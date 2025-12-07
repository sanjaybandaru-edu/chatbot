import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Brain, Cpu, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { memoryApi, modelApi } from '../api';

function Settings({ models, onClose, onUpdateModels }) {
    const [activeTab, setActiveTab] = useState('models');
    const [memories, setMemories] = useState([]);
    const [newMemory, setNewMemory] = useState('');
    const [newModel, setNewModel] = useState({
        config_id: '',
        name: '',
        model_id: '',
        max_tokens: 4096,
        temperature: 0.7,
        is_default: false
    });
    const [showAddModel, setShowAddModel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            const res = await memoryApi.list();
            setMemories(res.memories || []);
        } catch (err) {
            console.error('Failed to load memories:', err);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    // Memory functions
    const handleAddMemory = async () => {
        if (!newMemory.trim()) return;

        try {
            setLoading(true);
            await memoryApi.create(newMemory.trim());
            setNewMemory('');
            await loadMemories();
            showMessage('Memory added!');
        } catch (err) {
            showMessage('Failed to add memory', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMemory = async (memory) => {
        try {
            await memoryApi.update(memory.memory_id, { enabled: !memory.enabled });
            await loadMemories();
        } catch (err) {
            showMessage('Failed to update memory', 'error');
        }
    };

    const handleDeleteMemory = async (memoryId) => {
        try {
            await memoryApi.delete(memoryId);
            await loadMemories();
            showMessage('Memory deleted');
        } catch (err) {
            showMessage('Failed to delete memory', 'error');
        }
    };

    // Model functions
    const handleAddModel = async () => {
        if (!newModel.config_id || !newModel.name || !newModel.model_id) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            await modelApi.create(newModel);
            await onUpdateModels();
            setShowAddModel(false);
            setNewModel({
                config_id: '',
                name: '',
                model_id: '',
                max_tokens: 4096,
                temperature: 0.7,
                is_default: false
            });
            showMessage('Model added!');
        } catch (err) {
            showMessage('Failed to add model', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefaultModel = async (configId) => {
        try {
            await modelApi.setDefault(configId);
            await onUpdateModels();
            showMessage('Default model updated!');
        } catch (err) {
            showMessage('Failed to set default model', 'error');
        }
    };

    const handleDeleteModel = async (configId) => {
        try {
            await modelApi.delete(configId);
            await onUpdateModels();
            showMessage('Model deleted');
        } catch (err) {
            showMessage('Failed to delete model', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-700">
                    <h2 className="text-xl font-bold gradient-text">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Message toast */}
                {message && (
                    <div className={`mx-4 mt-4 px-4 py-2 rounded-lg text-sm ${message.type === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-dark-700">
                    <button
                        onClick={() => setActiveTab('models')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'models'
                                ? 'text-primary-400 border-b-2 border-primary-400'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Cpu size={18} />
                        Models
                    </button>
                    <button
                        onClick={() => setActiveTab('memories')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'memories'
                                ? 'text-primary-400 border-b-2 border-primary-400'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Brain size={18} />
                        Memories
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'models' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    Configure AI models. Add new models as they become available (e.g., Claude Opus 5).
                                </p>
                                <button
                                    onClick={() => setShowAddModel(!showAddModel)}
                                    className="btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Plus size={16} />
                                    Add Model
                                </button>
                            </div>

                            {/* Add Model Form */}
                            {showAddModel && (
                                <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 space-y-4 animate-fade-in">
                                    <h3 className="font-semibold text-white">Add New Model</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Config ID *</label>
                                            <input
                                                type="text"
                                                value={newModel.config_id}
                                                onChange={(e) => setNewModel({ ...newModel, config_id: e.target.value })}
                                                placeholder="claude-opus-5"
                                                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm focus-ring"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Display Name *</label>
                                            <input
                                                type="text"
                                                value={newModel.name}
                                                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                                                placeholder="Claude Opus 5"
                                                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm focus-ring"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Bedrock Model ID *</label>
                                        <input
                                            type="text"
                                            value={newModel.model_id}
                                            onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                                            placeholder="anthropic.claude-3-opus-20240229-v1:0"
                                            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm focus-ring"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Find model IDs in the AWS Bedrock console
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
                                            <input
                                                type="number"
                                                value={newModel.max_tokens}
                                                onChange={(e) => setNewModel({ ...newModel, max_tokens: parseInt(e.target.value) || 4096 })}
                                                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm focus-ring"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Temperature</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="1"
                                                value={newModel.temperature}
                                                onChange={(e) => setNewModel({ ...newModel, temperature: parseFloat(e.target.value) || 0.7 })}
                                                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm focus-ring"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={newModel.is_default}
                                            onChange={(e) => setNewModel({ ...newModel, is_default: e.target.checked })}
                                            className="w-4 h-4 rounded border-dark-600 bg-dark-800"
                                        />
                                        <label htmlFor="is_default" className="text-sm text-gray-300">
                                            Set as default model
                                        </label>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setShowAddModel(false)}
                                            className="btn-secondary text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddModel}
                                            disabled={loading}
                                            className="btn-primary text-sm flex items-center gap-2"
                                        >
                                            <Save size={16} />
                                            Save Model
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Model List */}
                            <div className="space-y-2">
                                {models.map((model) => (
                                    <div
                                        key={model.config_id}
                                        className="bg-dark-800 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-white">{model.name}</h4>
                                                    {model.is_default && (
                                                        <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 font-mono">{model.model_id}</p>
                                                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                                    <span>Max tokens: {model.max_tokens}</span>
                                                    <span>Temperature: {model.temperature}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!model.is_default && (
                                                    <button
                                                        onClick={() => handleSetDefaultModel(model.config_id)}
                                                        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                                                        title="Set as default"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteModel(model.config_id)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Delete model"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'memories' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                Add information you want the AI to remember about you across all conversations.
                            </p>

                            {/* Add Memory */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMemory}
                                    onChange={(e) => setNewMemory(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                                    placeholder="e.g., I'm learning Python and prefer detailed explanations"
                                    className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-sm focus-ring"
                                />
                                <button
                                    onClick={handleAddMemory}
                                    disabled={loading || !newMemory.trim()}
                                    className="btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>

                            {/* Memory List */}
                            <div className="space-y-2">
                                {memories.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Brain size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No memories yet</p>
                                        <p className="text-sm mt-1">Add information for personalized responses</p>
                                    </div>
                                ) : (
                                    memories.map((memory) => (
                                        <div
                                            key={memory.memory_id}
                                            className={`bg-dark-800 border rounded-xl p-4 transition-all ${memory.enabled
                                                    ? 'border-dark-700'
                                                    : 'border-dark-700/50 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="text-sm text-gray-200 flex-1">{memory.content}</p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleMemory(memory)}
                                                        className={`p-1 rounded transition-colors ${memory.enabled
                                                                ? 'text-primary-400'
                                                                : 'text-gray-500'
                                                            }`}
                                                        title={memory.enabled ? 'Disable memory' : 'Enable memory'}
                                                    >
                                                        {memory.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMemory(memory.memory_id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Settings;
