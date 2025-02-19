// Menu Functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector('.menu-button');
    const navOverlay = document.querySelector('.nav-overlay');
    const body = document.body;

    // Toggle menu
    menuButton.addEventListener('click', () => {
        body.classList.toggle('nav-active');
    });

    // Close menu when clicking overlay
    navOverlay.addEventListener('click', () => {
        body.classList.remove('nav-active');
    });

    // Close menu when pressing escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            body.classList.remove('nav-active');
        }
    });

    // Update initial bot message
    const initialMessage = document.querySelector('.message.bot .message-content');
    if (initialMessage) {
        initialMessage.textContent = AI_CONTEXT.commonPhrases.greeting;
    }
});

// Chatbot Widget Functionality
const chatbotWidget = document.querySelector('.chatbot-widget');
const chatbotButton = document.querySelector('.chatbot-button');
const chatInput = document.querySelector('#chatInput');
const sendButton = document.querySelector('.send-button');
const chatMessages = document.querySelector('.chat-messages');

// Google AI API Configuration
const API_KEY = 'AIzaSyA_S5Z4U9F37nRISRtcjOSGYfeCoZ0zZUg';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// AI Context and Rules
const AI_CONTEXT = {
    role: "Ti je një ekspert ekonomik dhe këshilltar i specializuar në legjislacionin tatimor dhe kontabilitetin e biznesit në Shqipëri. Gjithmonë duhet të përgjigjesh në gjuhën shqipe. Ekspertiza jote përfshin:",
    expertise: [
        "Ligjet dhe rregulloret tatimore në Shqipëri",
        "Standardet e kontabilitetit në Shqipëri (SKK)",
        "Rregulloret dhe procedurat e TVSH-së",
        "Tatimet e korporatave dhe biznesit të vogël",
        "Dokumentacioni fiskal dhe faturat tatimore",
        "Procedurat e regjistrimit të biznesit në QKB",
        "Deklaratat financiare dhe raportimet",
        "Kontributet e sigurimeve shoqërore dhe shëndetësore",
        "Tatimet e punonjësve dhe listëpagesat",
        "E-Albania dhe shërbimet elektronike tatimore",
        "Procedurat doganore dhe import-eksporti",
        "Legjislacioni i punës dhe kontratat",
        "Taksat vendore dhe tarifat"
    ],
    rules: [
        "Përgjigju gjithmonë në gjuhën shqipe",
        "Jep informacion të saktë bazuar në legjislacionin aktual shqiptar",
        "Shpjego konceptet e komplikuara në terma të thjeshtë",
        "Përfshi referencat ligjore kur diskuton rregulloret (numrin e ligjit/VKM)",
        "Jep shembuj praktikë për procedurat",
        "Sqaro çdo paqartësi në rregulloret tatimore",
        "Përmend afatet dhe datat e rëndësishme për deklarimet",
        "Thekso gjobat dhe penalitetet për moszbatim",
        "Sugjero praktikat më të mira për kontabilitetin",
        "Jep udhëzime për dokumentacionin e nevojshëm",
        "Rekomando procedurat e duhura për situata specifike",
        "Përdor terminologjinë zyrtare shqiptare për termat financiarë",
        "Referoju institucioneve përkatëse shqiptare (DPT, QKB, etj.)",
        "Informo për ndryshimet e fundit në legjislacion"
    ],
    commonPhrases: {
        greeting: "Përshëndetje! Unë jam këshilltari juaj për çështje ekonomike dhe tatimore. Si mund t'ju ndihmoj?",
        understanding: "Ju kuptoj. Më lejoni t'ju shpjegoj...",
        clarification: "Për të qenë më i qartë...",
        example: "Për shembull...",
        reference: "Sipas ligjit...",
        deadline: "Kini parasysh që afati është...",
        warning: "Është e rëndësishme të dini që...",
        suggestion: "Ju sugjeroj që...",
        closing: "Shpresoj t'ju kem ndihmuar. A keni ndonjë pyetje tjetër?"
    }
};

// Toggle chatbot
chatbotButton.addEventListener('click', () => {
    chatbotWidget.classList.toggle('active');
    if (chatbotWidget.classList.contains('active')) {
        chatInput.focus();
    }
});

// Send message function
function sendMessage(message, isUser = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            ${message}
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to get AI response
async function getAIResponse(message) {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${AI_CONTEXT.role}

Fushat e ekspertizës:
${AI_CONTEXT.expertise.map(exp => "- " + exp).join('\n')}

Rregullat për t'u ndjekur:
${AI_CONTEXT.rules.map(rule => "- " + rule).join('\n')}

Pyetja e përdoruesit: ${message}

Ju lutem jepni një përgjigje profesionale në gjuhën shqipe, bazuar në kontekstin dhe rregullat e mësipërme. Përdorni frazat e zakonshme për të strukturuar përgjigjen tuaj.`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error:', error);
        return 'Më vjen keq, pata një problem teknik. Ju lutem provoni përsëri më vonë.';
    }
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.innerHTML = `
        <div class="message-content">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

// Handle send button click
sendButton.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (message) {
        // Send user message
        sendMessage(message);
        chatInput.value = '';
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        // Get and send AI response
        const aiResponse = await getAIResponse(message);
        typingIndicator.remove();
        sendMessage(aiResponse, false);
    }
});

// Handle enter key
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButton.click();
    }
});

// Close chatbot when clicking outside
document.addEventListener('click', (e) => {
    if (!chatbotWidget.contains(e.target)) {
        chatbotWidget.classList.remove('active');
    }
}); 