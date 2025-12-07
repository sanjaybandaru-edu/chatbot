import { useState } from 'react';
import {
    MessageSquarePlus,
    MessageSquare,
    Trash2,
    Edit3,
    Check,
    X,
    Settings,
    Home,
    Sparkles,
    LogOut
} from 'lucide-react';

function Sidebar({
    chats,
    currentChatId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onOpenSettings,
    onLogout
}) {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleStartEdit = (chat) => {
        setEditingId(chat.chat_id);
        setEditTitle(chat.title);
    };

    const handleSaveEdit = (chatId) => {
        if (editTitle.trim()) {
            onRenameChat(chatId, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
    };

    const handleDeleteClick = (chatId) => {
        if (deleteConfirm === chatId) {
            onDeleteChat(chatId);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(chatId);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    return (
        <div className="h-full flex flex-col pr-sidebar">
            {/* Logo Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--pr-lime)' }}>
                        <Sparkles size={20} className="text-gray-900" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white">ChatBot</h1>
                        <p className="text-xs text-gray-500">by Sanjay</p>
                    </div>
                </div>

                {/* New Chat Button */}
                <button
                    onClick={onNewChat}
                    className="w-full pr-btn flex items-center justify-center gap-2 py-3"
                >
                    <MessageSquarePlus size={18} />
                    New Chat
                </button>
            </div>

            {/* Navigation */}
            <div className="px-3 py-4">
                <button
                    onClick={onNewChat}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${!currentChatId
                            ? 'text-gray-900'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                    style={!currentChatId ? { background: 'var(--pr-lime)' } : {}}
                >
                    <Home size={18} />
                    Home
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                    Recent Chats
                </div>

                {chats.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <MessageSquare size={32} className="mx-auto mb-3 text-gray-600" />
                        <p className="text-sm text-gray-500">No chats yet</p>
                        <p className="text-xs mt-1 text-gray-600">Start a new conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {chats.map((chat) => (
                            <div
                                key={chat.chat_id}
                                className={`group rounded-lg transition-all duration-200 ${currentChatId === chat.chat_id
                                        ? 'bg-gray-800'
                                        : 'hover:bg-gray-800/50'
                                    }`}
                            >
                                {editingId === chat.chat_id ? (
                                    <div className="flex items-center gap-2 p-2">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(chat.chat_id);
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-lime-400 focus:outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(chat.chat_id)}
                                            className="p-1 text-green-400 hover:text-green-300"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => onSelectChat(chat.chat_id)}
                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                                    >
                                        <MessageSquare size={16} className="flex-shrink-0 text-gray-500" />
                                        <span className="flex-1 truncate text-sm text-gray-300">
                                            {chat.title || 'New Chat'}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEdit(chat);
                                                }}
                                                className="p-1 text-gray-500 hover:text-white rounded"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(chat.chat_id);
                                                }}
                                                className={`p-1 rounded ${deleteConfirm === chat.chat_id
                                                        ? 'text-red-400 bg-red-500/20'
                                                        : 'text-gray-500 hover:text-red-400'
                                                    }`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800 space-y-1">
                <button
                    onClick={onOpenSettings}
                    className="w-full btn-ghost flex items-center gap-3 text-sm"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-full btn-ghost flex items-center gap-3 text-sm text-gray-500 hover:text-red-400"
                    >
                        <LogOut size={18} />
                        <span>Lock</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default Sidebar;
