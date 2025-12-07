// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    return response.json();
}

// Chat API
export const chatApi = {
    list: () => apiCall('/api/chats'),

    get: (chatId) => apiCall(`/api/chats/${chatId}`),

    create: (title = 'New Chat') => apiCall('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ title }),
    }),

    update: (chatId, title) => apiCall(`/api/chats/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    }),

    delete: (chatId) => apiCall(`/api/chats/${chatId}`, {
        method: 'DELETE',
    }),

    // Streaming chat completion
    sendMessage: async function* (content, chatId = null, modelConfigId = null) {
        const url = `${API_BASE_URL}/api/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                chat_id: chatId,
                selected_model_id: modelConfigId,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        // Parse the data - it's in a Python-like format, convert to JSON
                        const jsonStr = data
                            .replace(/'/g, '"')
                            .replace(/True/g, 'true')
                            .replace(/False/g, 'false');
                        yield JSON.parse(jsonStr);
                    } catch (e) {
                        // Skip malformed data
                        console.warn('Failed to parse SSE data:', data);
                    }
                }
            }
        }
    },
};

// Memory API
export const memoryApi = {
    list: () => apiCall('/api/memories'),

    create: (content) => apiCall('/api/memories', {
        method: 'POST',
        body: JSON.stringify({ content }),
    }),

    update: (memoryId, data) => apiCall(`/api/memories/${memoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    delete: (memoryId) => apiCall(`/api/memories/${memoryId}`, {
        method: 'DELETE',
    }),
};

// Model Config API
export const modelApi = {
    list: () => apiCall('/api/models'),

    get: (configId) => apiCall(`/api/models/${configId}`),

    create: (config) => apiCall('/api/models', {
        method: 'POST',
        body: JSON.stringify(config),
    }),

    delete: (configId) => apiCall(`/api/models/${configId}`, {
        method: 'DELETE',
    }),

    setDefault: (configId) => apiCall(`/api/models/${configId}/set-default`, {
        method: 'POST',
    }),
};
