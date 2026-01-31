
// State
const state = {
    apiKey: localStorage.getItem('openai_api_key') || '',
    messages: [
        { role: 'assistant', content: 'Hello! I am your AI assistant. Configure your API key in Settings to start chatting.' }
    ],
    loading: false,
    isMobile: window.innerWidth <= 768,
    isSidebarOpen: window.innerWidth > 768
};

// DOM Elements
const elements = {
    appContainer: document.querySelector('.app-container'),
    sidebar: document.querySelector('.sidebar'),
    chatArea: document.querySelector('.chat-area'),
    messagesContainer: document.querySelector('.messages-container'),
    messageInput: document.querySelector('.chat-input'),
    sendButton: document.getElementById('btn-send'),
    micButton: document.getElementById('btn-mic'),
    settingsModal: document.getElementById('settings-modal'),
    apiKeyInput: document.getElementById('api-key-input'),
    backButton: document.getElementById('btn-back'),
    settingsButton: document.getElementById('btn-settings'),
    saveKeyButton: document.getElementById('btn-save-key'),
    cancelKeyButton: document.getElementById('btn-cancel-key'),
    contactItems: document.querySelectorAll('.contact-item'),
    contactNameDisplay: document.getElementById('header-contact-name'),
    contactStatusDisplay: document.getElementById('header-contact-status'),
    messagesEndRef: document.getElementById('messages-end')
};

// Icons (SVG strings)
const Icons = {
    user: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 496 512" height="49" width="49" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 1.8-23.2 19.3-50.6 34.3-59.5 25.4-15 62.4-25.1 112.2-25.1s86.8 10.1 112.2 25.1c15 8.9 32.5 36.3 34.3 59.5-35.2 41.6-87.8 68.2-146.5 68.2z"></path></svg>',
    comment: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 0H64C28.7 0 0 28.7 0 64v288c0 35.3 28.7 64 64 64h96v84c0 9.8 11.2 15.5 19.1 9.7L304 416h144c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64z"></path></svg>',
    ellipsis: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 192 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"></path></svg>',
    // Add more as needed or rely on external library
};


// Initialization
function init() {
    renderMessages();
    setupEventListeners();
    handleResize();

    // Check API Key
    if (!state.apiKey) {
        setTimeout(() => {
            state.messages.push({ role: 'assistant', content: '⚠️ Please set your OpenAI API key in the settings menu (top left) to start.' });
            renderMessages();
        }, 1000);
    }
}

// Logic
function setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', handleResize);

    // Input Handling
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        toggleSendButton();
    });

    elements.messageInput.addEventListener('input', toggleSendButton);

    // Send Button
    elements.sendButton.addEventListener('click', sendMessage);

    // Modal Handling
    elements.settingsButton.addEventListener('click', () => toggleModal(true));
    elements.cancelKeyButton.addEventListener('click', () => toggleModal(false));
    elements.saveKeyButton.addEventListener('click', saveApiKey);

    // Mobile Navigation
    elements.backButton.addEventListener('click', () => toggleSidebar(true));

    // Contact Selection
    elements.contactItems.forEach(item => {
        item.addEventListener('click', () => {
            // Visual Active State
            elements.contactItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // On mobile, hide sidebar
            if (state.isMobile) {
                toggleSidebar(false);
            }

            // Assume "AI Assistant" for now as the only functional chat
            updateHeader("AI Assistant", "Online");
        });
    });
}

function handleResize() {
    state.isMobile = window.innerWidth <= 768;
    console.log('Resize:', state.isMobile);
    if (!state.isMobile) {
        elements.sidebar.classList.remove('visible', 'hidden');
        elements.sidebar.style.transform = ''; // Reset inline style
        elements.backButton.style.display = 'none';
        state.isSidebarOpen = true;
    } else {
        elements.backButton.style.display = 'block';
        // Default to showing sidebar on mobile init if not set
        if (state.isSidebarOpen) {
            elements.sidebar.classList.add('visible');
        } else {
            elements.sidebar.classList.remove('visible');
        }
    }
}

function toggleSidebar(show) {
    state.isSidebarOpen = show;
    if (state.isMobile) {
        if (show) {
            elements.sidebar.classList.add('visible');
        } else {
            elements.sidebar.classList.remove('visible');
        }
    }
}

function toggleModal(show) {
    if (show) {
        elements.apiKeyInput.value = state.apiKey;
        elements.settingsModal.classList.add('open');
    } else {
        elements.settingsModal.classList.remove('open');
    }
}

function saveApiKey() {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
        state.apiKey = key;
        localStorage.setItem('openai_api_key', key);
        toggleModal(false);
        state.messages.push({ role: 'assistant', content: '✅ API Key saved! You can now chat.' });
        renderMessages();
    }
}

function toggleSendButton() {
    const text = elements.messageInput.value.trim();
    if (text) {
        elements.sendButton.style.display = 'flex';
        elements.micButton.style.display = 'none';
    } else {
        elements.sendButton.style.display = 'none';
        elements.micButton.style.display = 'flex';
    }
}

async function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text || state.loading) return;

    if (!state.apiKey) {
        toggleModal(true);
        alert('Please set your API Key first.');
        return;
    }

    // Add user message
    state.messages.push({ role: 'user', content: text });
    elements.messageInput.value = '';
    toggleSendButton();
    renderMessages();
    setLoading(true);

    try {
        const responseText = await fetchAIResponse(state.messages);
        state.messages.push({ role: 'assistant', content: responseText });
    } catch (error) {
        state.messages.push({ role: 'assistant', content: 'Error: ' + error.message });
    } finally {
        setLoading(false);
        renderMessages();
    }
}

async function fetchAIResponse(allMessages) {
    const context = allMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: context
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Failed to fetch');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function renderMessages() {
    elements.messagesContainer.innerHTML = '';

    state.messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.role === 'user' ? 'outgoing' : 'incoming'}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        div.innerHTML = `
            <div class="message-text">${escapeHtml(msg.content)}</div>
            <div class="message-time">${time}</div>
        `;
        elements.messagesContainer.appendChild(div);
    });

    if (state.loading) {
        const div = document.createElement('div');
        div.className = 'message incoming';
        div.innerHTML = '<div class="message-text">...</div>';
        elements.messagesContainer.appendChild(div);
    }

    elements.messagesEndRef.scrollIntoView({ behavior: 'auto' });
}

function setLoading(isLoading) {
    state.loading = isLoading;
    elements.contactStatusDisplay.textContent = isLoading ? 'Typing...' : 'Online';
    elements.messageInput.disabled = isLoading;
}

function updateHeader(name, status) {
    elements.contactNameDisplay.textContent = name;
    elements.contactStatusDisplay.textContent = status;
}

// Utility
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Run
document.addEventListener('DOMContentLoaded', init);
