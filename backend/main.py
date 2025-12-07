"""
FastAPI backend for Personal ChatGPT Clone.
Deployed on AWS Lambda with Mangum adapter.
"""
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from mangum import Mangum

import database as db
import bedrock_client as bedrock

# Initialize FastAPI app
app = FastAPI(
    title="Personal ChatGPT API",
    description="Personal ChatGPT clone using AWS Bedrock",
    version="1.0.0"
)

# CORS middleware - Note: allow_credentials=False when using wildcard origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Default user ID (since this is a personal app)
DEFAULT_USER_ID = "default-user"


# ============================================
# Pydantic Models
# ============================================

class ChatCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatUpdate(BaseModel):
    title: str


class MessageCreate(BaseModel):
    content: str
    chat_id: Optional[str] = None
    selected_model_id: Optional[str] = None


class MemoryCreate(BaseModel):
    content: str


class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    enabled: Optional[bool] = None


class ModelConfigCreate(BaseModel):
    config_id: str
    name: str
    model_id: str
    max_tokens: int = 4096
    temperature: float = 0.7
    is_default: bool = False


# ============================================
# Health Check
# ============================================

@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Personal ChatGPT API"}


@app.get("/api/health")
async def api_health():
    """API health check."""
    return {"status": "ok"}


# ============================================
# Chat Endpoints
# ============================================

@app.get("/api/chats")
async def list_chats():
    """Get all chats for the user."""
    chats = db.get_chats(DEFAULT_USER_ID)
    return {"chats": chats}


@app.post("/api/chats")
async def create_chat(chat: ChatCreate):
    """Create a new chat."""
    new_chat = db.create_chat(DEFAULT_USER_ID, chat.title)
    return new_chat


@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    """Get a specific chat with its messages."""
    chat = db.get_chat(DEFAULT_USER_ID, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.get_messages(chat_id)
    return {**chat, "messages": messages}


@app.patch("/api/chats/{chat_id}")
async def update_chat(chat_id: str, update: ChatUpdate):
    """Update a chat's title."""
    chat = db.get_chat(DEFAULT_USER_ID, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    updated = db.update_chat_title(DEFAULT_USER_ID, chat_id, update.title)
    return updated


@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """Delete a chat and all its messages."""
    chat = db.get_chat(DEFAULT_USER_ID, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete_chat(DEFAULT_USER_ID, chat_id)
    return {"success": True}


# ============================================
# Message/Chat Completion Endpoints
# ============================================

@app.post("/api/chat/completions")
async def chat_completion(message: MessageCreate):
    """
    Send a message and get a streaming response.
    Creates a new chat if chat_id is not provided.
    """
    chat_id = message.chat_id
    is_new_chat = False
    
    # Create a new chat if needed
    if not chat_id:
        new_chat = db.create_chat(DEFAULT_USER_ID)
        chat_id = new_chat['chat_id']
        is_new_chat = True
    else:
        # Verify chat exists
        chat = db.get_chat(DEFAULT_USER_ID, chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    
    # Save user message
    db.add_message(chat_id, 'user', message.content)
    
    # Get model config
    model_config = None
    if message.selected_model_id:
        model_config = db.get_model_config(message.selected_model_id)
    if not model_config:
        model_config = db.get_default_model_config()
    if not model_config:
        # Initialize default models if none exist
        db.init_default_models()
        model_config = db.get_default_model_config()
    
    if not model_config:
        raise HTTPException(status_code=500, detail="No model configuration available")
    
    # Get conversation history
    all_messages = db.get_messages(chat_id)
    conversation = [{'role': msg['role'], 'content': msg['content']} for msg in all_messages]
    
    # Get memories
    memories = db.get_memories(DEFAULT_USER_ID, enabled_only=True)
    
    async def generate():
        full_response = []
        
        # First, yield the chat_id so frontend knows which chat to use
        yield f"data: {{'chat_id': '{chat_id}', 'is_new': {str(is_new_chat).lower()}}}\n\n"
        
        # Stream the response
        for chunk in bedrock.invoke_model_stream(
            messages=conversation,
            model_id=model_config['model_id'],
            max_tokens=model_config.get('max_tokens', 4096),
            temperature=float(model_config.get('temperature', 0.7)),
            memories=memories
        ):
            full_response.append(chunk)
            yield f"data: {{'content': {repr(chunk)}}}\n\n"
        
        # Save the complete response
        complete_response = ''.join(full_response)
        db.add_message(chat_id, 'assistant', complete_response)
        
        # Generate title for new chats
        if is_new_chat:
            title = bedrock.generate_chat_title(message.content, model_config['model_id'])
            db.update_chat_title(DEFAULT_USER_ID, chat_id, title)
            yield f"data: {{'title': {repr(title)}}}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ============================================
# Memory Endpoints
# ============================================

@app.get("/api/memories")
async def list_memories():
    """Get all memories for the user."""
    memories = db.get_memories(DEFAULT_USER_ID, enabled_only=False)
    return {"memories": memories}


@app.post("/api/memories")
async def create_memory(memory: MemoryCreate):
    """Create a new memory."""
    new_memory = db.add_memory(DEFAULT_USER_ID, memory.content)
    return new_memory


@app.patch("/api/memories/{memory_id}")
async def update_memory(memory_id: str, update: MemoryUpdate):
    """Update a memory."""
    memory = db.get_memory(DEFAULT_USER_ID, memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    updated = db.update_memory(
        DEFAULT_USER_ID, 
        memory_id, 
        content=update.content, 
        enabled=update.enabled
    )
    return updated


@app.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory."""
    memory = db.get_memory(DEFAULT_USER_ID, memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    db.delete_memory(DEFAULT_USER_ID, memory_id)
    return {"success": True}


# ============================================
# Model Config Endpoints
# ============================================

@app.get("/api/models")
async def list_models():
    """Get all model configurations."""
    # Ensure default models exist
    db.init_default_models()
    configs = db.get_model_configs()
    return {"models": configs}


@app.post("/api/models")
async def create_model(config: ModelConfigCreate):
    """Create or update a model configuration."""
    new_config = db.upsert_model_config(
        config_id=config.config_id,
        name=config.name,
        model_id=config.model_id,
        max_tokens=config.max_tokens,
        temperature=config.temperature,
        is_default=config.is_default
    )
    return new_config


@app.get("/api/models/{config_id}")
async def get_model(config_id: str):
    """Get a specific model configuration."""
    config = db.get_model_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Model config not found")
    return config


@app.delete("/api/models/{config_id}")
async def delete_model(config_id: str):
    """Delete a model configuration."""
    config = db.get_model_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Model config not found")
    
    db.delete_model_config(config_id)
    return {"success": True}


@app.post("/api/models/{config_id}/set-default")
async def set_default_model(config_id: str):
    """Set a model as the default."""
    config = db.get_model_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Model config not found")
    
    updated = db.upsert_model_config(
        config_id=config['config_id'],
        name=config['name'],
        model_id=config['model_id'],
        max_tokens=config.get('max_tokens', 4096),
        temperature=config.get('temperature', 0.7),
        is_default=True
    )
    return updated


# Lambda handler
handler = Mangum(app, lifespan="off")
