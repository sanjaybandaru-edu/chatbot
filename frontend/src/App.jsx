import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import Settings from './components/Settings';
import PatternLock from './components/PatternLock';
import { chatApi, modelApi } from './api';
import { Menu, X } from 'lucide-react';

// Check if already authenticated (session storage)
const isAuthenticated = () => {
    return sessionStorage.getItem('chatgpt_auth') === 'true';
};

function App() {
    const [authenticated, setAuthenticated] = useState(isAuthenticated());
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [currentChat, setCurrentChat] = useState(null);
    const [models, setModels] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [chatsRes, modelsRes] = await Promise.all([
                chatApi.list(),
                modelApi.list()
            ]);

            setChats(chatsRes.chats || []);
            setModels(modelsRes.models || []);

            // Set default model
            const defaultModel = (modelsRes.models || []).find(m => m.is_default);
            if (defaultModel) {
                setSelectedModelId(defaultModel.config_id);
            }
        } catch (err) {
            console.error('Failed to load initial data:', err);
            setError('Failed to connect to server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // Load chat when selected
    useEffect(() => {
        if (currentChatId) {
            loadChat(currentChatId);
        } else {
            setCurrentChat(null);
        }
    }, [currentChatId]);

    const loadChat = async (chatId) => {
        try {
            const chat = await chatApi.get(chatId);
            setCurrentChat(chat);
        } catch (err) {
            console.error('Failed to load chat:', err);
            setError('Failed to load chat. Please try again.');
        }
    };

    const refreshChats = async () => {
        try {
            const res = await chatApi.list();
            setChats(res.chats || []);
        } catch (err) {
            console.error('Failed to refresh chats:', err);
        }
    };

    const handleNewChat = () => {
        setCurrentChatId(null);
        setCurrentChat(null);
    };

    const handleSelectChat = (chatId) => {
        setCurrentChatId(chatId);
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleDeleteChat = async (chatId) => {
        try {
            await chatApi.delete(chatId);
            await refreshChats();
            if (currentChatId === chatId) {
                handleNewChat();
            }
        } catch (err) {
            console.error('Failed to delete chat:', err);
            setError('Failed to delete chat. Please try again.');
        }
    };

    const handleRenameChat = async (chatId, newTitle) => {
        try {
            await chatApi.update(chatId, newTitle);
            await refreshChats();
            if (currentChatId === chatId && currentChat) {
                setCurrentChat({ ...currentChat, title: newTitle });
            }
        } catch (err) {
            console.error('Failed to rename chat:', err);
        }
    };

    const handleChatUpdate = useCallback((chatId, title) => {
        // Update chats list with new chat
        refreshChats();
        setCurrentChatId(chatId);
    }, []);

    const handleMessageAdded = useCallback((message) => {
        setCurrentChat(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                messages: [...(prev.messages || []), message]
            };
        });
    }, []);

    const handleUpdateModels = async () => {
        try {
            const res = await modelApi.list();
            setModels(res.models || []);
        } catch (err) {
            console.error('Failed to update models:', err);
        }
    };

    const handleUnlock = () => {
        sessionStorage.setItem('chatgpt_auth', 'true');
        setAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('chatgpt_auth');
        setAuthenticated(false);
    };

    // Show pattern lock if not authenticated
    if (!authenticated) {
        return <PatternLock onUnlock={handleUnlock} />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pr-bg)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--pr-lime)', borderTopColor: 'transparent' }}></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white flex" style={{ background: 'var(--pr-bg)' }}>
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border border-gray-700"
                style={{ background: 'var(--pr-dark)' }}
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <Sidebar
                    chats={chats}
                    currentChatId={currentChatId}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    onDeleteChat={handleDeleteChat}
                    onRenameChat={handleRenameChat}
                    onOpenSettings={() => setShowSettings(true)}
                    onLogout={handleLogout}
                />
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 text-center">
                        {error}
                        <button
                            onClick={() => window.location.reload()}
                            className="ml-4 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <Chat
                    chat={currentChat}
                    chatId={currentChatId}
                    models={models}
                    selectedModelId={selectedModelId}
                    onSelectModel={setSelectedModelId}
                    onChatUpdate={handleChatUpdate}
                    onMessageAdded={handleMessageAdded}
                />
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <Settings
                    models={models}
                    onClose={() => setShowSettings(false)}
                    onUpdateModels={handleUpdateModels}
                />
            )}
        </div>
    );
}

export default App;
