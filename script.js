// State
const state = {
    messages: [],
    apiKey: localStorage.getItem('chat_api_key') || '',
    apiUrl: localStorage.getItem('chat_api_url') || 'https://api.openai.com/v1/chat/completions',
    modelName: localStorage.getItem('chat_model_name') || 'gpt-4o-mini',
    systemPrompt: `You are a multilingual AI chat assistant for a website hosted on GitHub Pages.

Your responsibilities:
- Automatically detect the language of the user’s message.
- Respond in the SAME language used by the user.
- Support Malayalam (മലയാളം), English, and mixed Malayalam-English (Manglish).
- Seamlessly switch response language if the user switches languages.
- Use simple, clear, and natural language.
- Keep responses friendly, professional, and conversational.
- If the user asks technical or informational questions, explain clearly in the detected language.
- If the user greets or chats casually, respond casually in the same language.

Language behavior rules:
- If the user message is written in Malayalam script → respond in Malayalam.
- If the user message is written in English → respond in English.
- If the user message is mixed Malayalam-English (Manglish) → respond in simple Manglish.
- Do NOT translate messages unless the user explicitly asks for a translation.
- Do NOT mention language detection or explain how the language was identified.

Tone and style:
- Helpful, polite, and human-like
- Concise by default; give longer explanations only when requested

Context:
You are an AI assistant designed for a public-facing chat website serving users in India, with a primary focus on users from Kerala.`
};

// DOM Elements
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');
const apiKeyInput = document.getElementById('api-key');
const apiUrlInput = document.getElementById('api-url');
const modelNameInput = document.getElementById('model-name');

// Helper: Time Format
function getTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

// Helper: Add Message to UI
function appendMessage(text, isUser = false) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'outgoing' : 'incoming'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'markdown-body';
    // Simple Markdown parsing for bold/new lines
    contentDiv.innerHTML = parseMarkdown(text);

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.innerText = getTime();

    div.appendChild(contentDiv);
    div.appendChild(timeDiv);
    chatWindow.appendChild(div);

    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Helper: Simple Markdown Parser
function parseMarkdown(text) {
    // Escape HTML
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Newlines
    html = html.replace(/\n/g, '<br>');

    return html;
}

// API Call
async function sendMessageToAI(userMessage) {
    if (!state.apiKey) {
        appendMessage("⚠️ Please set your API Key in Settings first (top right icon).", false);
        return;
    }

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message incoming';
    typingDiv.innerHTML = '<span class="typing-indicator">Typing...</span>';
    chatWindow.appendChild(typingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const response = await fetch(state.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: state.modelName,
                messages: [
                    { role: "system", content: state.systemPrompt },
                    ...state.messages, // History
                    { role: "user", content: userMessage }
                ]
            })
        });

        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // If response is not JSON, treat the text as the error/content
            throw new Error(`API Error (${response.status} ${response.statusText}): ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok) {
            if (response.status === 405) {
                throw new Error(`Method Not Allowed (405). Please check your API Endpoint URL in Settings. It should fail only on valid POST endpoints (like .../chat/completions).`);
            }
            throw new Error(data.error?.message || data.message || `API Error: ${responseText}`);
        }

        const aiText = data.choices[0].message.content;

        // Remove typing indicator
        if (document.body.contains(typingDiv)) {
            chatWindow.removeChild(typingDiv);
        }

        // Add AI response
        appendMessage(aiText, false);

        // Update History
        state.messages.push({ role: "user", content: userMessage });
        state.messages.push({ role: "assistant", content: aiText });

    } catch (error) {
        if (document.body.contains(typingDiv)) {
            chatWindow.removeChild(typingDiv);
        }
        appendMessage(`❌ Error: ${error.message}`, false);
    }
}

// Event Listeners
sendBtn.addEventListener('click', () => {
    const text = messageInput.value.trim();
    if (text) {
        appendMessage(text, true); // User message
        messageInput.value = '';
        sendMessageToAI(text);
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Settings Modal Logic
settingsBtn.addEventListener('click', () => {
    apiKeyInput.value = state.apiKey;
    apiUrlInput.value = state.apiUrl;
    modelNameInput.value = state.modelName;
    settingsModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

saveSettings.addEventListener('click', () => {
    state.apiKey = apiKeyInput.value.trim();
    state.apiUrl = apiUrlInput.value.trim();
    state.modelName = modelNameInput.value.trim();

    localStorage.setItem('chat_api_key', state.apiKey);
    localStorage.setItem('chat_api_url', state.apiUrl);
    localStorage.setItem('chat_model_name', state.modelName);

    settingsModal.style.display = 'none';
    alert('Settings Saved!');
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});
