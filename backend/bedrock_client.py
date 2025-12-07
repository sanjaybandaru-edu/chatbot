"""
AWS Bedrock client for Claude model interactions.
"""
import json
import boto3
import os
from typing import Generator, Dict, Any, Optional, List

# Initialize Bedrock client
bedrock_runtime = boto3.client(
    'bedrock-runtime',
    region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1')
)


def build_messages_with_context(
    messages: List[Dict[str, str]],
    memories: List[Dict[str, Any]],
    system_prompt: Optional[str] = None
) -> tuple[str, List[Dict[str, str]]]:
    """Build the system prompt with memories and return formatted messages."""
    
    # Build system prompt with memories
    system_parts = []
    
    if system_prompt:
        system_parts.append(system_prompt)
    
    if memories:
        memory_text = "\n".join([f"- {m['content']}" for m in memories])
        system_parts.append(f"""
Here are some things to remember about the user:
{memory_text}

Use this context to personalize your responses when relevant.
""")
    
    system = "\n\n".join(system_parts) if system_parts else "You are a helpful AI assistant."
    
    # Format messages for Claude
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            'role': msg['role'],
            'content': msg['content']
        })
    
    return system, formatted_messages


def invoke_model_stream(
    messages: List[Dict[str, str]],
    model_id: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
    memories: Optional[List[Dict[str, Any]]] = None,
    system_prompt: Optional[str] = None
) -> Generator[str, None, None]:
    """
    Invoke a Claude model with streaming response.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model_id: Bedrock model ID (e.g., 'anthropic.claude-3-opus-20240229-v1:0')
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature
        memories: Optional list of memory items to include in context
        system_prompt: Optional custom system prompt
    
    Yields:
        Text chunks as they are generated
    """
    
    system, formatted_messages = build_messages_with_context(
        messages, 
        memories or [],
        system_prompt
    )
    
    # Build request body for Claude
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": formatted_messages
    }
    
    try:
        response = bedrock_runtime.invoke_model_with_response_stream(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body)
        )
        
        for event in response['body']:
            chunk = json.loads(event['chunk']['bytes'])
            
            if chunk['type'] == 'content_block_delta':
                delta = chunk.get('delta', {})
                if 'text' in delta:
                    yield delta['text']
            
            elif chunk['type'] == 'message_stop':
                break
                
    except Exception as e:
        yield f"\n\n**Error:** {str(e)}"


def invoke_model(
    messages: List[Dict[str, str]],
    model_id: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
    memories: Optional[List[Dict[str, Any]]] = None,
    system_prompt: Optional[str] = None
) -> str:
    """
    Invoke a Claude model without streaming (for simple responses).
    
    Returns:
        Complete response text
    """
    
    system, formatted_messages = build_messages_with_context(
        messages,
        memories or [],
        system_prompt
    )
    
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": formatted_messages
    }
    
    try:
        response = bedrock_runtime.invoke_model(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
        
    except Exception as e:
        return f"Error: {str(e)}"


def generate_chat_title(first_message: str, model_id: str) -> str:
    """Generate a title for a chat based on the first message."""
    
    messages = [{
        'role': 'user',
        'content': f"""Generate a very short title (3-6 words) for a chat that starts with this message:

"{first_message[:500]}"

Respond with ONLY the title, no quotes or extra text."""
    }]
    
    try:
        title = invoke_model(
            messages=messages,
            model_id=model_id,
            max_tokens=50,
            temperature=0.5
        )
        return title.strip()[:100]
    except:
        return "New Chat"
