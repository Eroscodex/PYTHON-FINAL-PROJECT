const SERVER_URL = 'http://localhost:3000';
let currentModel = 'Eros_Assistant:latest';
let chatHistory = [];
let isWaitingForReply = false;
let currentChatKey = null;
let abortController = null;

const TYPING_CONFIG_HUMAN = {
    baseDelay: 10,
    randomVariation: 15,
    punctuationPause: 150,
    spaceDelay: 5,
    chunkDelay: 100,
    thinkingTime: 250
};

const chatContainer = document.getElementById('messages-container');
const textInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const cancelButton = document.getElementById('cancel-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const modelDropdown = document.getElementById('model-select');
const historySelect = document.getElementById('history-select');
const newChatBtn = document.getElementById('new-chat-btn');
const saveChatBtn = document.getElementById('save-chat-btn');
const renameChatBtn = document.getElementById('rename-chat-btn');
const deleteChatBtn = document.getElementById('delete-chat-btn');

document.addEventListener('DOMContentLoaded', async () => {
    await checkServerStatus();
    await loadModels();
    loadHistoryDropdown();
    textInput.focus();
});

function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        padding: 10px 20px;
        margin-top: 10px;
        border-radius: 8px;
        color: #fff;
        font-family: 'Poppins', sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    toast.style.backgroundColor = type === 'success' ? '#00cc66' :
                                 type === 'error' ? '#ff4444' :
                                 type === 'warning' ? '#ffaa00' : '#333';

    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

function showConfirm(message) {
    return confirm(message);
}

async function checkServerStatus() {
    try {
        const res = await fetch(SERVER_URL);
        if (!res.ok) throw new Error('Server down');
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
    } catch {
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Not connected';
    }
}

async function loadModels() {
    try {
        const res = await fetch(`${SERVER_URL}/api/models`);
        const data = await res.json();
        const models = data.models || [];
        if (!models.length) return;

        modelDropdown.innerHTML = '';
        models.forEach(model => {
            const option = document.createElement('option');
            const modelName = model.name || model.model || model;
            option.value = modelName;
            option.textContent = modelName;
            modelDropdown.appendChild(option);
        });

        if (modelDropdown.options.length > 0) currentModel = modelDropdown.value;
    } catch (e) {
        console.log('Could not load models:', e);
        modelDropdown.innerHTML = '<option value="llama3.2">None</option>';
        currentModel = 'llama3.2';
    }

    modelDropdown.onchange = () => currentModel = modelDropdown.value;
}

function loadHistoryDropdown() {
    historySelect.innerHTML = '<option value="">Select Chat History</option>';
    const chats = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                chats.push({ key: key, ...data });
            } catch (e) { console.error('Error parsing chat data:', e); }
        }
    }

    chats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    chats.forEach(chat => {
        const option = document.createElement('option');
        option.value = chat.key;
        option.textContent = chat.name || chat.key.replace('chat_', 'Chat: ');
        historySelect.appendChild(option);
    });

    updateChatButtons();
}

function saveChatHistory() {
    if (!chatHistory.length) { showToast('No messages to save!', 'warning'); return; }

    let defaultName = `Chat ${new Date().toLocaleString()}`;
    if (currentChatKey) {
        try {
            const savedData = JSON.parse(localStorage.getItem(currentChatKey));
            if (savedData?.name) defaultName = savedData.name;
        } catch {}
    }

    const chatName = prompt('Enter a name for this chat:', defaultName);
    if (!chatName) return;

    const timestamp = new Date().toISOString();
    const key = currentChatKey || `chat_${Date.now()}`;
    const chatData = { name: chatName, timestamp, messages: chatHistory };

    try {
        localStorage.setItem(key, JSON.stringify(chatData));
        currentChatKey = key;
        loadHistoryDropdown();
        historySelect.value = key;
        updateChatButtons();
        showToast('Chat saved successfully!', 'success');
    } catch (e) {
        showToast('Error saving chat: ' + e.message, 'error');
    }
}

function loadChatHistory(key) {
    if (!key) { currentChatKey = null; updateChatButtons(); return; }
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return;
        const chatData = JSON.parse(saved);
        chatHistory = chatData.messages || [];
        currentChatKey = key;

        chatContainer.innerHTML = '';
        chatHistory.forEach(msg => addMessageToChat(msg.role, msg.content));
        updateChatButtons();
    } catch (e) {
        showToast('Error loading chat: ' + e.message, 'error');
    }
}

function renameChat() {
    if (!currentChatKey) return;
    try {
        const chatData = JSON.parse(localStorage.getItem(currentChatKey));
        const newName = prompt('Enter new name for this chat:', chatData.name);
        if (!newName) return;
        chatData.name = newName;
        localStorage.setItem(currentChatKey, JSON.stringify(chatData));
        loadHistoryDropdown();
        historySelect.value = currentChatKey;
        showToast('Chat renamed successfully!', 'success');
    } catch (e) { showToast('Error renaming chat: ' + e.message, 'error'); }
}

function deleteChat() {
    if (!currentChatKey) return;
    try {
        const chatData = JSON.parse(localStorage.getItem(currentChatKey));
        if (!showConfirm(`Delete chat "${chatData.name}"? This cannot be undone.`)) return;
        localStorage.removeItem(currentChatKey);
        currentChatKey = null;
        startNewChat();
        loadHistoryDropdown();
        showToast('Chat deleted successfully!', 'success');
    } catch (e) { showToast('Error deleting chat: ' + e.message, 'error'); }
}

function updateChatButtons() {
    const hasSelectedChat = !!currentChatKey;
    renameChatBtn.disabled = !hasSelectedChat;
    deleteChatBtn.disabled = !hasSelectedChat;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addMessageToChat(role, text) {
    const bubble = document.createElement('div');
    bubble.className = 'message ' + role;
    bubble.innerHTML = `
        <div class="message-avatar">${role === 'user' ? 'C' : 'AI'}</div>
        <div class="message-content">
            <div class="message-role">${role === 'user' ? 'Customer' : 'Eros'}</div>
            <div class="message-text">${escapeHtml(text)}</div>
        </div>
    `;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return bubble.querySelector('.message-text');
}


function startNewChat() {
    if (chatHistory.length > 0 && !isWaitingForReply) {
        if (confirm('Save current chat before starting new one?')) {
            saveChatHistory();
            return;
        }
    }

    chatHistory = [];
    currentChatKey = null;

    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = `
        <div id="welcome-message" style="text-align: center; color: #00ff7faa; padding: 20px;">
            Welcome! Start a conversation with Eros.
        </div>
    `;

    showRecommendedPrompts();

    const textInput = document.getElementById('message-input');
    textInput.value = '';
    textInput.style.height = 'auto';
    historySelect.value = '';
    updateChatButtons();
    textInput.focus();
}



function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        setTimeout(sendMessage, 50);
    }
}

function cancelRequest() {
    if (abortController) {
        abortController.abort();
        abortController = null;
        isWaitingForReply = false;
        sendButton.style.display = 'block';
        cancelButton.style.display = 'none';
        sendButton.disabled = false;
        textInput.focus();
    }
}

function getDeviceSpeedMultiplier() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const width = window.innerWidth;

    let multiplier = 1;
    if (cores <= 4 || memory <= 4) multiplier *= 0.85;
    if (cores >= 8 && memory >= 8) multiplier *= 1.05;
    if (width < 1200) multiplier *= 0.9;

    return multiplier;
}

function getAutoTypingConfig(textLength) {
    let multiplier = 1;
    if (textLength < 80) multiplier = 1;
    else if (textLength < 250) multiplier = 1.5;
    else if (textLength < 600) multiplier = 2.2;
    else multiplier = 3;

    multiplier *= getDeviceSpeedMultiplier();

    return {
        baseDelay: TYPING_CONFIG_HUMAN.baseDelay * multiplier,
        randomVariation: TYPING_CONFIG_HUMAN.randomVariation * multiplier,
        punctuationPause: TYPING_CONFIG_HUMAN.punctuationPause * multiplier,
        spaceDelay: TYPING_CONFIG_HUMAN.spaceDelay * multiplier,
        chunkDelay: TYPING_CONFIG_HUMAN.chunkDelay * multiplier,
        thinkingTime: TYPING_CONFIG_HUMAN.thinkingTime * multiplier
    };
}

async function sendMessage() {
    const userText = textInput.value.trim();
    if (!userText || isWaitingForReply) return;

    const welcome = document.getElementById('welcome-message');
    if (welcome) welcome.remove();

    chatHistory.push({ role: 'user', content: userText });
    addMessageToChat('user', userText);
    textInput.value = '';

    const assistantBubble = addMessageToChat('assistant', '');
    assistantBubble.innerHTML = '<span class="streaming-cursor">Thinking...</span>';

    const cursor = assistantBubble.querySelector('.streaming-cursor');
    let cursorVisible = true;
    const blinkInterval = setInterval(() => {
        cursor.style.visibility = cursorVisible ? 'visible' : 'hidden';
        cursorVisible = !cursorVisible;
    }, 500);

    isWaitingForReply = true;
    sendButton.disabled = true;
    sendButton.style.display = 'none';
    cancelButton.style.display = 'block';
    abortController = new AbortController();

    try {
        const response = await fetch(`${SERVER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: currentModel, messages: chatHistory }),
            signal: abortController.signal
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        let buffer = '';

        async function typeTextHuman(text) {
            const cfg = getAutoTypingConfig(text.length);
            for (let i = 0; i < text.length; i++) {
                if (abortController.signal.aborted) break;
                assistantText += text[i];
                assistantBubble.innerHTML = escapeHtml(assistantText) + '<span class="streaming-cursor">|</span>';
                chatContainer.scrollTop = chatContainer.scrollHeight;

                let delay = cfg.baseDelay + Math.random() * cfg.randomVariation;
                if (/[.,!?]/.test(text[i])) delay += cfg.punctuationPause;
                else if (text[i] === ' ') delay += cfg.spaceDelay;
                if (i % 10 === 0 && i !== 0) delay += cfg.chunkDelay;

                await new Promise(r => setTimeout(r, delay));
            }
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done || abortController.signal.aborted) break;

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim() || !line.startsWith('data:')) continue;
                try {
                    const jsonStr = line.replace(/^data:\s*/, '').trim();
                    if (!jsonStr) continue;
                    const json = JSON.parse(jsonStr);
                    const part = json.message?.content || '';
                    if (part && !abortController.signal.aborted) await typeTextHuman(part);
                    if (json.done && !abortController.signal.aborted) assistantBubble.innerHTML = escapeHtml(assistantText);
                } catch (e) { console.error('Parse error:', e, line); }
            }
        }

        if (buffer.trim() && !abortController.signal.aborted) await typeTextHuman(buffer);
        if (!abortController.signal.aborted && assistantText) chatHistory.push({ role: 'assistant', content: assistantText });
        else if (abortController.signal.aborted && assistantText) chatHistory.pop();

    } catch (err) {
        if (err.name === 'AbortError') assistantBubble.innerHTML = '<div style="color:#ffaa00;">Response cancelled by user</div>';
        else assistantBubble.innerHTML = '<div style="color:#ff4444;">Error: Could not get response</div>';
    }

    clearInterval(blinkInterval);
    isWaitingForReply = false;
    sendButton.disabled = false;
    sendButton.style.display = 'block';
    cancelButton.style.display = 'none';
    abortController = null;
    textInput.focus();
}

function showRecommendedPrompts() {
    const container = document.getElementById('recommended-prompts');
    if (!container) return;

    container.innerHTML = '';

    const prompts = [
        "Best laptops under 50k",
        "Top gaming PCs",
        "Current laptop deals",
        "Warranty info",
        "Payment options",
        "Recommended accessories",
        "Refurbished laptops",
        "Student discounts",
        "Shipping details"
    ];


    prompts.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'recommend-btn';
        btn.textContent = text;
        btn.onclick = () => {
            const textInput = document.getElementById('message-input');
            textInput.value = text;
            textInput.focus();
            sendMessage();
        };
        container.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    showRecommendedPrompts();
});

newChatBtn.addEventListener('click', startNewChat);
saveChatBtn.addEventListener('click', saveChatHistory);
renameChatBtn.addEventListener('click', renameChat);
deleteChatBtn.addEventListener('click', deleteChat);
historySelect.addEventListener('change', () => loadChatHistory(historySelect.value));
textInput.addEventListener('input', (e) => autoResize(e.target));
textInput.addEventListener('keydown', handleKeyDown);
