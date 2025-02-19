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

// Search Functionality
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        // Here you can implement the search functionality
        console.log('Searching for:', searchTerm);
        // For now, just clear the input
        searchInput.value = '';
        // Remove focus from input to hide mobile keyboard
        searchInput.blur();
    }
}

// Speech Recognition Configuration
class SpeechRecognitionHandler {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.voiceButton = document.getElementById('voiceButton');
        this.searchInput = document.getElementById('searchInput');
        this.searchTimeout = null;
        this.countdownInterval = null;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.setupRecognition();
        this.bindEvents();
    }

    setupRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.voiceButton.style.display = 'none';
            console.error('Shfletuesi juaj nuk mbështet njohjen e zërit.');
            return;
        }

        // Try to use standard SpeechRecognition first, then fallback to webkit
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Configure for Albanian with mobile-optimized settings
        this.recognition.lang = 'sq-AL';
        this.recognition.continuous = false; // Set to false for better iOS compatibility
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        // For iOS Safari, we need to request permission first
        if (this.isMobile && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log('Microphone permission granted');
                })
                .catch((error) => {
                    console.error('Microphone permission denied:', error);
                    this.handleError({ error: 'not-allowed' });
                });
        }

        // Event handlers
        this.recognition.onstart = this.handleStart.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onerror = this.handleError.bind(this);
        this.recognition.onnomatch = this.handleNoMatch.bind(this);
        this.recognition.onspeechend = () => {
            console.log('Speech ended');
            if (this.searchInput.value.trim()) {
                this.stopListening();
                this.startCountdown();
            }
        };
    }

    bindEvents() {
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => {
                if (!this.recognition) {
                    alert('Shfletuesi juaj nuk mbështet njohjen e zërit.');
                    return;
                }
                if (this.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
            });
        }
    }

    startCountdown() {
        // Clear any existing timeouts and intervals
        this.clearTimers();
        
        let countdown = 3;
        this.showFeedback(`Kërkimi fillon për... ${countdown}`);

        this.countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.showFeedback(`Kërkimi fillon për... ${countdown}`);
            }
        }, 1000);

        this.searchTimeout = setTimeout(() => {
            this.clearTimers();
            if (!this.isListening) {
                handleSearch(new Event('submit'));
            }
        }, 3000);
    }

    clearTimers() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    startListening() {
        try {
            this.clearTimers();
            
            // Hide keyboard on mobile
            if (this.isMobile) {
                this.searchInput.blur();
            }
            
            this.recognition.start();
            this.showFeedback(this.isMobile ? 'Shtypni për të ndaluar...' : 'Ju lutem flisni...');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.handleError({ error: 'start-error' });
        }
    }

    stopListening() {
        try {
            this.clearTimers();
            this.recognition.stop();
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            
            // Prevent keyboard from showing on mobile
            if (this.isMobile) {
                this.searchInput.blur();
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }

    handleStart() {
        this.isListening = true;
        this.voiceButton.classList.add('listening');
        this.searchInput.placeholder = this.isMobile ? 'Duke dëgjuar...' : 'Ju lutem flisni...';
        
        // Prevent keyboard from showing on mobile
        if (this.isMobile) {
            this.searchInput.blur();
        }
    }

    handleEnd() {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        this.searchInput.placeholder = 'Search anything...';
        
        // If no result was received and no timeout is pending
        if (!this.searchInput.value && !this.searchTimeout) {
            this.showFeedback('Nuk u dëgjua asnjë zë. Provoni përsëri.');
        }
        
        // Restart recognition on mobile if still listening
        if (this.isMobile && this.isListening) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error restarting recognition:', error);
            }
        }
    }

    handleResult(event) {
        const results = Array.from(event.results);
        let finalTranscript = '';
        let interimTranscript = '';

        results.forEach(result => {
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            } else {
                interimTranscript += result[0].transcript;
            }
        });

        // Update the search input with all transcribed text
        this.searchInput.value = finalTranscript || interimTranscript;
    }

    handleError(event) {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');

        let message = '';
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        
        switch (event.error) {
            case 'no-speech':
                message = isIOS ? 
                    'Nuk u dëgjua zëri. Shtypni butonin dhe flisni pas tingullit.' : 
                    'Nuk u dëgjua asnjë zë. Ju lutem flisni më qartë dhe provoni përsëri.';
                break;
            case 'audio-capture':
                message = isIOS ?
                    'Ju lutem lejoni aksesin në mikrofon në Settings > Safari > Microphone.' :
                    'Nuk mund të aksesohet mikrofoni. Sigurohuni që keni një mikrofon të lidhur dhe funksional.';
                break;
            case 'not-allowed':
                message = isIOS ?
                    'Ju lutem lejoni aksesin në mikrofon në Settings > Safari > Microphone.' :
                    'Ju lutem jepni leje për përdorimin e mikrofonit në shfletuesin tuaj.';
                break;
            case 'network':
                message = 'Problem me lidhjen në internet. Kontrolloni lidhjen tuaj dhe provoni përsëri.';
                break;
            case 'aborted':
                message = 'Njohja e zërit u ndërpre. Shtypni butonin përsëri për të rifilluar.';
                break;
            case 'language-not-supported':
                message = 'Gjuha shqipe nuk mbështetet në këtë shfletues. Provoni një shfletues tjetër ose përdorni tastierën.';
                break;
            case 'service-not-allowed':
                message = isIOS ?
                    'Ju lutem aktivizoni njohjen e zërit në Settings > Safari > Microphone.' :
                    'Shërbimi i njohjes së zërit nuk është i disponueshëm. Provoni përsëri më vonë.';
                break;
            case 'start-error':
                message = isIOS ?
                    'Pati një problem. Ju lutem mbyllni dhe rihapni Safari-n, pastaj provoni përsëri.' :
                    'Pati një problem në nisjen e njohjes së zërit. Rifreskoni faqen dhe provoni përsëri.';
                break;
            case 'no-match':
                message = 'Nuk arritëm të kuptojmë çfarë thatë. Ju lutem flisni më qartë dhe më ngadalë.';
                break;
            default:
                message = 'Ndodhi një gabim i papritur. Ju lutem provoni përsëri ose përdorni tastierën.';
        }
        
        this.showFeedback(message);
        console.error('Speech recognition error:', event.error);
    }

    handleNoMatch() {
        this.showFeedback('Nuk mund të njihej zëri. Ju lutem provoni përsëri.');
    }

    showFeedback(message) {
        // Remove any existing feedback first
        const existingFeedback = document.querySelector('.voice-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create a new feedback element
        const feedback = document.createElement('div');
        feedback.className = 'voice-feedback';
        if (this.isMobile) {
            feedback.className += ' mobile';
        }
        feedback.textContent = message;
        
        // Position it near the search box
        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(feedback);
        
        // Only auto-remove feedback if it's not a countdown message
        if (!message.includes('Kërkimi fillon për...')) {
            setTimeout(() => {
                feedback.remove();
            }, this.isMobile ? 2000 : 3000);
        }
    }
}

// Initialize speech recognition when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... existing DOMContentLoaded code ...
    
    // Initialize speech recognition
    const speechHandler = new SpeechRecognitionHandler();
}); 