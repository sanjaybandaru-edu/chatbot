import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ChevronDown, Sparkles, Bot, User } from 'lucide-react';
import MessageRenderer from './MessageRenderer';
import { chatApi } from '../api';

function Chat({
    chat,
    chatId,
    models,
    selectedModelId,
    onSelectModel,
    onChatUpdate,
    onMessageAdded
}) {
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const dropdownRef = useRef(null);

    const messages = chat?.messages || [];
    const selectedModel = models.find(m => m.config_id === selectedModelId);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowModelDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const userMessage = input.trim();
        setInput('');
        setIsStreaming(true);
        setStreamingContent('');

        // Add user message to UI immediately
        const userMsg = {
            message_id: `temp-${Date.now()}`,
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString()
        };
        onMessageAdded(userMsg);

        try {
            let currentChatId = chatId;
            let fullContent = '';

            for await (const chunk of chatApi.sendMessage(userMessage, chatId, selectedModelId)) {
                if (chunk.chat_id) {
                    currentChatId = chunk.chat_id;
                    if (chunk.is_new) {
                        onChatUpdate(chunk.chat_id, null);
                    }
                }
                if (chunk.content) {
                    fullContent += chunk.content;
                    setStreamingContent(fullContent);
                }
                if (chunk.title) {
                    onChatUpdate(currentChatId, chunk.title);
                }
            }

            // Add assistant message to UI
            const assistantMsg = {
                message_id: `temp-${Date.now() + 1}`,
                role: 'assistant',
                content: fullContent,
                created_at: new Date().toISOString()
            };
            onMessageAdded(assistantMsg);
            setStreamingContent('');

        } catch (err) {
            console.error('Failed to send message:', err);
            setStreamingContent(`\n\n**Error:** ${err.message}`);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800 glass">
                <div className="flex items-center gap-2 ml-12 md:ml-0">
                    <Bot size={20} className="text-primary-400" />
                    <span className="font-medium text-gray-200">
                        {chat?.title || 'New Chat'}
                    </span>
                </div>

                {/* Model Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors text-sm"
                    >
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-gray-300">{selectedModel?.name || 'Select Model'}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showModelDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                            {models.map((model) => (
                                <button
                                    key={model.config_id}
                                    onClick={() => {
                                        onSelectModel(model.config_id);
                                        setShowModelDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors ${selectedModelId === model.config_id ? 'bg-dark-700' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-200">{model.name}</span>
                                        {model.is_default && (
                                            <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{model.model_id}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 && !streamingContent ? (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg glow">
                                <Sparkles size={36} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 gradient-text">Welcome!</h2>
                            <p className="text-gray-400 mb-6">
                                I'm your personal AI assistant powered by Claude. Ask me anything - I'm here to help with coding, learning, writing, or just having a conversation.
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    "Explain quantum computing in simple terms",
                                    "Help me learn React hooks",
                                    "Write a Python function for binary search"
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(suggestion)}
                                        className="px-4 py-3 text-left bg-dark-800/50 hover:bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto py-6 px-4">
                        {messages.map((message, index) => (
                            <div
                                key={message.message_id || index}
                                className={`mb-6 animate-fade-in ${message.role === 'user' ? 'flex justify-end' : ''}`}
                            >
                                <div className={`flex gap-4 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${message.role === 'user'
                                            ? 'bg-primary-600'
                                            : 'bg-gradient-to-br from-purple-500 to-primary-600'
                                        }`}>
                                        {message.role === 'user' ? (
                                            <User size={16} className="text-white" />
                                        ) : (
                                            <Bot size={16} className="text-white" />
                                        )}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-dark-800 border border-dark-700'
                                        }`}>
                                        {message.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        ) : (
                                            <MessageRenderer content={message.content} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Streaming message */}
                        {streamingContent && (
                            <div className="mb-6 animate-fade-in">
                                <div className="flex gap-4 max-w-[85%]">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-primary-600 flex items-center justify-center">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="rounded-2xl px-4 py-3 bg-dark-800 border border-dark-700">
                                        <MessageRenderer content={streamingContent} />
                                        <span className="inline-block w-2 h-4 bg-primary-400 animate-pulse ml-1"></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Typing indicator */}
                        {isStreaming && !streamingContent && (
                            <div className="mb-6">
                                <div className="flex gap-4 max-w-[85%]">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-primary-600 flex items-center justify-center">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="rounded-2xl px-4 py-3 bg-dark-800 border border-dark-700">
                                        <div className="typing-indicator flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-dark-800 glass">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-3 bg-dark-800 rounded-2xl border border-dark-600 focus-within:border-primary-500 transition-colors">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message..."
                            className="flex-1 bg-transparent px-4 py-3 resize-none focus:outline-none text-gray-100 placeholder-gray-500 max-h-[200px]"
                            rows={1}
                            disabled={isStreaming}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className={`m-2 p-2 rounded-xl transition-all duration-200 ${input.trim() && !isStreaming
                                    ? 'bg-primary-600 hover:bg-primary-500 text-white'
                                    : 'bg-dark-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isStreaming ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-600 mt-2">
                        Powered by Claude via AWS Bedrock
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Chat;
