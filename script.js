const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const STORAGE_KEY = 'chatHistory';
const chatHistory = [];

// Restore saved messages when the page is ready
function loadChatHistory() {
  try {
    const savedMessages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(savedMessages)) return;

    savedMessages.forEach((message) => {
      if (
        message &&
        typeof message.text === 'string' &&
        ['user', 'ai', 'error'].includes(message.senderClass)
      ) {
        appendMessage(message.text, message.senderClass, false);
        chatHistory.push({
          text: message.text,
          senderClass: message.senderClass,
        });
      }
    });
  } catch (error) {
    console.error('Unable to load saved chat history:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadChatHistory);
} else {
  loadChatHistory();
}

// Toggle the dark theme when the user clicks the theme button
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle("dark");
});

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Render the user's message and clear the input
  appendMessage(text, 'user');
  userInput.value = '';

  // Disable controls while waiting for backend
  toggleInputState(true);
  showTypingIndicator();

  try {
    // Call the Java backend
    const response = await fetch('http://localhost:8080/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      throw new Error(`Server status: ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();

    // Render the AI reply
    appendMessage(data.reply || 'No response received.', 'ai');

  } catch (error) {
    console.error('Fetch error:', error);
    appendMessage('Error: Unable to reach the local backend server.', 'error');
  } finally {
    removeTypingIndicator();
    toggleInputState(false);
    userInput.focus();
  }
}

function appendMessage(text, senderClass, save = true) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', senderClass);
  messageElement.textContent = text;

  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (save) {
    chatHistory.push({ text, senderClass });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Unable to save chat history:', error);
    }
  }
}

function toggleInputState(isDisabled) {
  userInput.disabled = isDisabled;
  sendBtn.disabled = isDisabled;
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message typing-indicator';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = '<span>•</span><span>•</span><span>•</span>';
  chatWindow.appendChild(indicator);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}