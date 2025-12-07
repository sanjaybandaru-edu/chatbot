import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ChevronDown, Sparkles, Bot, User, Zap } from 'lucide-react';
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

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

    const suggestions = [
        "Explain quantum computing in simple terms",
        "Help me learn React hooks",
        "Write a Python function for binary search",
        "Create a study plan for learning AWS"
    ];

    return (
        <div className="flex-1 flex flex-col h-screen" style={{ background: 'var(--pr-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3 ml-12 md:ml-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--pr-lime)' }}>
                        <Zap size={16} className="text-gray-900" />
                    </div>
                    <span className="font-semibold text-white">
                        {chat?.title || 'New Chat'}
                    </span>
                </div>

                {/* Model Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium"
                        style={{
                            background: 'var(--pr-dark)',
                            borderColor: showModelDropdown ? 'var(--pr-lime)' : '#3a3a50',
                            color: 'white'
                        }}
                    >
                        <Sparkles size={14} style={{ color: 'var(--pr-lime)' }} />
                        <span>{selectedModel?.name || 'Select Model'}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showModelDropdown && (
                        <div className="absolute right-0 mt-2 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden animate-fade-in"
                            style={{ background: 'var(--pr-dark)', borderColor: '#3a3a50' }}>
                            {models.map((model) => (
                                <button
                                    key={model.config_id}
                                    onClick={() => {
                                        onSelectModel(model.config_id);
                                        setShowModelDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${selectedModelId === model.config_id ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-white">{model.name}</span>
                                        {model.is_default && (
                                            <span className="text-xs px-2 py-0.5 rounded font-medium"
                                                style={{ background: 'var(--pr-lime)', color: 'var(--pr-darker)' }}>
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate font-mono">{model.model_id}</p>
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
                        <div className="text-center max-w-2xl">
                            {/* Welcome Card */}
                            <div className="pr-card p-8 mb-8">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-pulse-glow"
                                    style={{ background: 'var(--pr-lime)' }}>
                                    <Sparkles size={36} className="text-gray-900" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">
                                    Hi <span style={{ color: 'var(--pr-lime)' }}>Sanjay</span>, welcome back!
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    I'm your personal AI assistant powered by Claude. Ask me anything!
                                </p>
                            </div>

                            {/* Suggestion Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(suggestion)}
                                        className="pr-card p-4 text-left transition-all hover:border-gray-600 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-800 group-hover:bg-gray-700 transition-colors">
                                                <Zap size={14} style={{ color: 'var(--pr-lime)' }} />
                                            </div>
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                                {suggestion}
                                            </span>
                                        </div>
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
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${message.role === 'user' ? 'bg-gray-700' : ''
                                        }`}
                                        style={message.role === 'assistant' ? { background: 'var(--pr-lime)' } : {}}>
                                        {message.role === 'user' ? (
                                            <User size={16} className="text-white" />
                                        ) : (
                                            <Bot size={16} className="text-gray-900" />
                                        )}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-gray-800 text-white'
                                            : 'pr-card'
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
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--pr-lime)' }}>
                                        <Bot size={16} className="text-gray-900" />
                                    </div>
                                    <div className="pr-card rounded-2xl px-4 py-3">
                                        <MessageRenderer content={streamingContent} />
                                        <span className="inline-block w-2 h-4 ml-1 animate-pulse"
                                            style={{ background: 'var(--pr-lime)' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Typing indicator */}
                        {isStreaming && !streamingContent && (
                            <div className="mb-6">
                                <div className="flex gap-4 max-w-[85%]">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--pr-lime)' }}>
                                        <Bot size={16} className="text-gray-900" />
                                    </div>
                                    <div className="pr-card rounded-2xl px-4 py-3">
                                        <div className="typing-indicator flex gap-1">
                                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
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
            <div className="p-4 border-t border-gray-800">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-3 rounded-xl overflow-hidden"
                        style={{ background: 'var(--pr-dark)', border: '2px solid var(--pr-lime)' }}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-transparent px-4 py-3 resize-none focus:outline-none text-white placeholder-gray-500 max-h-[200px]"
                            rows={1}
                            disabled={isStreaming}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className={`m-2 p-3 rounded-lg transition-all duration-200 ${input.trim() && !isStreaming
                                    ? 'text-gray-900 hover:opacity-90'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                            style={input.trim() && !isStreaming ? { background: 'var(--pr-lime)' } : {}}
                        >
                            {isStreaming ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-600 mt-3">
                        Powered by Claude via AWS Bedrock
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Chat;
