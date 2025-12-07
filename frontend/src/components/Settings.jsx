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
            setNewModel({ config_id: '', name: '', model_id: '', max_tokens: 4096, temperature: 0.7, is_default: false });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden animate-fade-in"
                style={{ background: 'var(--pr-dark)', border: '1px solid #3a3a50' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--pr-lime)' }}>Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Toast */}
                {message && (
                    <div className={`mx-4 mt-4 px-4 py-2 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('models')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'models' ? 'border-b-2' : 'text-gray-400 hover:text-white'
                            }`}
                        style={activeTab === 'models' ? { color: 'var(--pr-lime)', borderColor: 'var(--pr-lime)' } : {}}
                    >
                        <Cpu size={18} /> Models
                    </button>
                    <button
                        onClick={() => setActiveTab('memories')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'memories' ? 'border-b-2' : 'text-gray-400 hover:text-white'
                            }`}
                        style={activeTab === 'memories' ? { color: 'var(--pr-lime)', borderColor: 'var(--pr-lime)' } : {}}
                    >
                        <Brain size={18} /> Memories
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'models' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-400">Add new models as they become available.</p>
                                <button onClick={() => setShowAddModel(!showAddModel)} className="pr-btn flex items-center gap-2 text-sm">
                                    <Plus size={16} /> Add Model
                                </button>
                            </div>

                            {showAddModel && (
                                <div className="pr-card p-4 space-y-4 animate-fade-in">
                                    <h3 className="font-semibold text-white">Add New Model</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Config ID *</label>
                                            <input type="text" value={newModel.config_id} onChange={(e) => setNewModel({ ...newModel, config_id: e.target.value })}
                                                placeholder="claude-opus-5" className="w-full pr-input text-sm" style={{ borderColor: '#3a3a50' }} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Display Name *</label>
                                            <input type="text" value={newModel.name} onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                                                placeholder="Claude Opus 5" className="w-full pr-input text-sm" style={{ borderColor: '#3a3a50' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Bedrock Model ID *</label>
                                        <input type="text" value={newModel.model_id} onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                                            placeholder="anthropic.claude-3-opus-20240229-v1:0" className="w-full pr-input text-sm" style={{ borderColor: '#3a3a50' }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
                                            <input type="number" value={newModel.max_tokens} onChange={(e) => setNewModel({ ...newModel, max_tokens: parseInt(e.target.value) || 4096 })}
                                                className="w-full pr-input text-sm" style={{ borderColor: '#3a3a50' }} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Temperature</label>
                                            <input type="number" step="0.1" min="0" max="1" value={newModel.temperature} onChange={(e) => setNewModel({ ...newModel, temperature: parseFloat(e.target.value) || 0.7 })}
                                                className="w-full pr-input text-sm" style={{ borderColor: '#3a3a50' }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="is_default" checked={newModel.is_default} onChange={(e) => setNewModel({ ...newModel, is_default: e.target.checked })} className="w-4 h-4 rounded" />
                                        <label htmlFor="is_default" className="text-sm text-gray-300">Set as default</label>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setShowAddModel(false)} className="btn-secondary text-sm">Cancel</button>
                                        <button onClick={handleAddModel} disabled={loading} className="pr-btn text-sm flex items-center gap-2">
                                            <Save size={16} /> Save
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {models.map((model) => (
                                    <div key={model.config_id} className="pr-card p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-white">{model.name}</h4>
                                                    {model.is_default && (
                                                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--pr-lime)', color: 'var(--pr-darker)' }}>Default</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 font-mono">{model.model_id}</p>
                                                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                                    <span>Max: {model.max_tokens}</span>
                                                    <span>Temp: {model.temperature}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!model.is_default && (
                                                    <button onClick={() => handleSetDefaultModel(model.config_id)} className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-lg">
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteModel(model.config_id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg">
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
                            <p className="text-sm text-gray-400">Add information you want Claude to remember.</p>
                            <div className="flex gap-2">
                                <input type="text" value={newMemory} onChange={(e) => setNewMemory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                                    placeholder="e.g., I prefer concise explanations" className="flex-1 pr-input text-sm" style={{ borderColor: '#3a3a50' }} />
                                <button onClick={handleAddMemory} disabled={loading || !newMemory.trim()} className="pr-btn flex items-center gap-2 text-sm">
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {memories.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Brain size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No memories yet</p>
                                    </div>
                                ) : (
                                    memories.map((memory) => (
                                        <div key={memory.memory_id} className={`pr-card p-4 ${!memory.enabled ? 'opacity-60' : ''}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="text-sm text-gray-200 flex-1">{memory.content}</p>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleToggleMemory(memory)} style={{ color: memory.enabled ? 'var(--pr-lime)' : '#6b7280' }}>
                                                        {memory.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteMemory(memory.memory_id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg">
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
