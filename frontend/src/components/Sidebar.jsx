import { useState } from 'react';
import {
    MessageSquarePlus,
    MessageSquare,
    Trash2,
    Edit3,
    Check,
    X,
    Settings,
    Sparkles
} from 'lucide-react';

function Sidebar({
    chats,
    currentChatId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onOpenSettings
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
            // Auto-clear after 3 seconds
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    // Group chats by date
    const groupedChats = chats.reduce((groups, chat) => {
        const date = new Date(chat.updated_at || chat.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let group;
        if (date.toDateString() === today.toDateString()) {
            group = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = 'Yesterday';
        } else if (date > new Date(today.setDate(today.getDate() - 7))) {
            group = 'Previous 7 Days';
        } else {
            group = 'Older';
        }

        if (!groups[group]) groups[group] = [];
        groups[group].push(chat);
        return groups;
    }, {});

    return (
        <div className="h-full flex flex-col bg-dark-900 border-r border-dark-700">
            {/* Header */}
            <div className="p-4 border-b border-dark-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg gradient-text">My ChatGPT</h1>
                        <p className="text-xs text-gray-500">Powered by Claude</p>
                    </div>
                </div>

                <button
                    onClick={onNewChat}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                    <MessageSquarePlus size={18} />
                    New Chat
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto py-2">
                {Object.entries(groupedChats).map(([group, groupChats]) => (
                    <div key={group} className="mb-4">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {group}
                        </div>
                        {groupChats.map((chat) => (
                            <div
                                key={chat.chat_id}
                                className={`
                  group mx-2 mb-1 rounded-lg transition-all duration-200
                  ${currentChatId === chat.chat_id
                                        ? 'bg-dark-700/80'
                                        : 'hover:bg-dark-800'
                                    }
                `}
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
                                            className="flex-1 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm focus-ring"
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
                                        className="flex items-center gap-3 p-3 cursor-pointer"
                                    >
                                        <MessageSquare size={16} className="flex-shrink-0 text-gray-400" />
                                        <span className="flex-1 truncate text-sm text-gray-200">
                                            {chat.title || 'New Chat'}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEdit(chat);
                                                }}
                                                className="p-1 text-gray-400 hover:text-white rounded"
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
                                                        : 'text-gray-400 hover:text-red-400'
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
                ))}

                {chats.length === 0 && (
                    <div className="text-center py-8 px-4 text-gray-500">
                        <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No chats yet</p>
                        <p className="text-xs mt-1">Start a new conversation!</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-dark-700">
                <button
                    onClick={onOpenSettings}
                    className="w-full btn-ghost flex items-center gap-3"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
