// ==================== ЧАТ С ПРОФЕССОРОМ ====================

const BACKEND_URL = 'https://professor-backend-1.onrender.com/chat';

async function sendMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;

    window.addChatMessage(text, 'user');
    input.value = '';

    if (typeof DiagState !== 'undefined' && DiagState.active) {
        if (typeof window.handleDiagnosticAnswer === 'function') {
            window.handleDiagnosticAnswer(text);
        }
        return;
    }

    if (AppState.user && !AppState.user.diagnosticsCompleted) {
        if (text.toLowerCase().includes('да') || 
            text.toLowerCase().includes('начнём') || 
            text.toLowerCase().includes('готов') ||
            text.toLowerCase().includes('поехали')) {
            
            if (typeof window.startDiagnostics === 'function') {
                window.startDiagnostics();
                return;
            }
        }
    }

    AppState.messageHistory.push({ role: 'user', content: text });

    const thinkingId = 'think_' + Date.now();
    const thinkDiv = document.createElement('div');
    thinkDiv.className = 'message prof';
    thinkDiv.id = thinkingId;
    thinkDiv.innerText = '🤔 Профессор думает...';
    document.getElementById('chatWindow').appendChild(thinkDiv);

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: AppState.messageHistory })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.reply;

        document.getElementById(thinkingId)?.remove();
        window.addChatMessage(reply, 'prof');
        AppState.messageHistory.push({ role: 'assistant', content: reply });

    } catch (error) {
        document.getElementById(thinkingId)?.remove();
        window.addChatMessage('Не удалось связаться с профессором. Проверьте соединение.', 'prof');
        console.error('Ошибка:', error);
    }
}

function initChat() {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    if (AppState.user) {
        if (AppState.user.diagnosticsCompleted) {
            window.addChatMessage(`С возвращением, ${AppState.user.firstName}! Готовы продолжить?`, 'prof');
        } else {
            window.addChatMessage(`${AppState.user.firstName}, давайте проведём диагностику. Напишите "да" или "начнём".`, 'prof');
        }
    } else {
        window.addChatMessage('Здравствуйте! Заполните форму слева, чтобы я мог к вам обращаться.', 'prof');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initApp === 'function') {
        window.initApp();
    }
    initChat();
});

window.sendMessage = sendMessage;
