"""
DynamoDB database operations for the ChatGPT clone.
"""
import os
import boto3
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import uuid4

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1'))

# Table references
def get_chats_table():
    return dynamodb.Table(os.environ.get('CHATS_TABLE', 'mychatgpt-chats'))

def get_messages_table():
    return dynamodb.Table(os.environ.get('MESSAGES_TABLE', 'mychatgpt-messages'))

def get_memories_table():
    return dynamodb.Table(os.environ.get('MEMORIES_TABLE', 'mychatgpt-memories'))

def get_model_config_table():
    return dynamodb.Table(os.environ.get('MODEL_CONFIG_TABLE', 'mychatgpt-model-config'))


# ============================================
# Chat Operations
# ============================================

def create_chat(user_id: str, title: str = "New Chat") -> Dict[str, Any]:
    """Create a new chat session."""
    table = get_chats_table()
    chat_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'user_id': user_id,
        'chat_id': chat_id,
        'title': title,
        'created_at': now,
        'updated_at': now
    }
    
    table.put_item(Item=item)
    return item


def get_chats(user_id: str) -> List[Dict[str, Any]]:
    """Get all chats for a user, sorted by updated_at descending."""
    table = get_chats_table()
    
    response = table.query(
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id},
        ScanIndexForward=False  # Descending order
    )
    
    return response.get('Items', [])


def get_chat(user_id: str, chat_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific chat."""
    table = get_chats_table()
    
    response = table.get_item(
        Key={'user_id': user_id, 'chat_id': chat_id}
    )
    
    return response.get('Item')


def update_chat_title(user_id: str, chat_id: str, title: str) -> Dict[str, Any]:
    """Update chat title."""
    table = get_chats_table()
    now = datetime.utcnow().isoformat()
    
    response = table.update_item(
        Key={'user_id': user_id, 'chat_id': chat_id},
        UpdateExpression='SET title = :title, updated_at = :updated_at',
        ExpressionAttributeValues={
            ':title': title,
            ':updated_at': now
        },
        ReturnValues='ALL_NEW'
    )
    
    return response.get('Attributes', {})


def delete_chat(user_id: str, chat_id: str) -> bool:
    """Delete a chat and all its messages."""
    # Delete all messages first
    messages_table = get_messages_table()
    messages = get_messages(chat_id)
    
    for msg in messages:
        messages_table.delete_item(
            Key={'chat_id': chat_id, 'message_id': msg['message_id']}
        )
    
    # Delete the chat
    chats_table = get_chats_table()
    chats_table.delete_item(
        Key={'user_id': user_id, 'chat_id': chat_id}
    )
    
    return True


# ============================================
# Message Operations
# ============================================

def add_message(chat_id: str, role: str, content: str) -> Dict[str, Any]:
    """Add a message to a chat."""
    table = get_messages_table()
    message_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'chat_id': chat_id,
        'message_id': message_id,
        'role': role,
        'content': content,
        'created_at': now
    }
    
    table.put_item(Item=item)
    return item


def get_messages(chat_id: str) -> List[Dict[str, Any]]:
    """Get all messages for a chat, sorted by created_at."""
    table = get_messages_table()
    
    response = table.query(
        KeyConditionExpression='chat_id = :cid',
        ExpressionAttributeValues={':cid': chat_id}
    )
    
    # Sort by created_at since DynamoDB doesn't sort by non-key attributes
    items = response.get('Items', [])
    items.sort(key=lambda x: x.get('created_at', ''))
    
    return items


# ============================================
# Memory Operations
# ============================================

def add_memory(user_id: str, content: str) -> Dict[str, Any]:
    """Add a memory for a user."""
    table = get_memories_table()
    memory_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'user_id': user_id,
        'memory_id': memory_id,
        'content': content,
        'created_at': now,
        'enabled': True
    }
    
    table.put_item(Item=item)
    return item


def get_memories(user_id: str, enabled_only: bool = True) -> List[Dict[str, Any]]:
    """Get all memories for a user."""
    table = get_memories_table()
    
    response = table.query(
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    
    items = response.get('Items', [])
    
    if enabled_only:
        items = [m for m in items if m.get('enabled', True)]
    
    return items


def update_memory(user_id: str, memory_id: str, content: Optional[str] = None, enabled: Optional[bool] = None) -> Dict[str, Any]:
    """Update a memory."""
    table = get_memories_table()
    
    update_expr = []
    expr_values = {}
    
    if content is not None:
        update_expr.append('content = :content')
        expr_values[':content'] = content
    
    if enabled is not None:
        update_expr.append('enabled = :enabled')
        expr_values[':enabled'] = enabled
    
    if not update_expr:
        return get_memory(user_id, memory_id)
    
    response = table.update_item(
        Key={'user_id': user_id, 'memory_id': memory_id},
        UpdateExpression='SET ' + ', '.join(update_expr),
        ExpressionAttributeValues=expr_values,
        ReturnValues='ALL_NEW'
    )
    
    return response.get('Attributes', {})


def get_memory(user_id: str, memory_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific memory."""
    table = get_memories_table()
    
    response = table.get_item(
        Key={'user_id': user_id, 'memory_id': memory_id}
    )
    
    return response.get('Item')


def delete_memory(user_id: str, memory_id: str) -> bool:
    """Delete a memory."""
    table = get_memories_table()
    table.delete_item(
        Key={'user_id': user_id, 'memory_id': memory_id}
    )
    return True


# ============================================
# Model Config Operations
# ============================================

def get_model_configs() -> List[Dict[str, Any]]:
    """Get all model configurations."""
    table = get_model_config_table()
    
    response = table.scan()
    return response.get('Items', [])


def get_model_config(config_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific model configuration."""
    table = get_model_config_table()
    
    response = table.get_item(
        Key={'config_id': config_id}
    )
    
    return response.get('Item')


def get_default_model_config() -> Optional[Dict[str, Any]]:
    """Get the default model configuration."""
    configs = get_model_configs()
    
    # Find default config
    for config in configs:
        if config.get('is_default', False):
            return config
    
    # If no default, return first config
    if configs:
        return configs[0]
    
    return None


def upsert_model_config(
    config_id: str,
    name: str,
    model_id: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
    is_default: bool = False
) -> Dict[str, Any]:
    """Create or update a model configuration."""
    table = get_model_config_table()
    now = datetime.utcnow().isoformat()
    
    # If setting this as default, unset other defaults
    if is_default:
        configs = get_model_configs()
        for config in configs:
            if config['config_id'] != config_id and config.get('is_default', False):
                table.update_item(
                    Key={'config_id': config['config_id']},
                    UpdateExpression='SET is_default = :false',
                    ExpressionAttributeValues={':false': False}
                )
    
    item = {
        'config_id': config_id,
        'name': name,
        'model_id': model_id,
        'max_tokens': max_tokens,
        'temperature': float(temperature),
        'is_default': is_default,
        'updated_at': now
    }
    
    table.put_item(Item=item)
    return item


def delete_model_config(config_id: str) -> bool:
    """Delete a model configuration."""
    table = get_model_config_table()
    table.delete_item(
        Key={'config_id': config_id}
    )
    return True


def init_default_models():
    """Initialize default model configurations if none exist."""
    configs = get_model_configs()
    
    if not configs:
        # Add Claude Opus 4.5 as default
        upsert_model_config(
            config_id='claude-opus-4',
            name='Claude Opus 4',
            model_id='us.anthropic.claude-opus-4-20250514-v1:0',
            max_tokens=16000,
            temperature=0.7,
            is_default=True
        )
        
        # Add Claude Sonnet as backup
        upsert_model_config(
            config_id='claude-sonnet-4',
            name='Claude Sonnet 4',
            model_id='us.anthropic.claude-sonnet-4-20250514-v1:0',
            max_tokens=8000,
            temperature=0.7,
            is_default=False
        )
