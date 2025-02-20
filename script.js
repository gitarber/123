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
    if (event) {
        event.preventDefault();
    }
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        // Here you can implement the search functionality
        console.log('Performing search for:', searchTerm);
        
        // Example: You can redirect to a search results page
        // window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
        
        // Store the search term before clearing input
        const searchedTerm = searchTerm;
        
        // Clear the input and remove focus
        searchInput.value = '';
        searchInput.blur();
        
        // Show feedback that search was performed
        const speechHandler = window.speechHandler;
        if (speechHandler) {
            speechHandler.showFeedback(`Duke kërkuar: "${searchedTerm}"`);
            
            // Optional: Show a "no results" message after a delay
            setTimeout(() => {
                speechHandler.showFeedback('Nuk u gjetën rezultate për këtë kërkim.');
            }, 2000);
        }
    } else {
        // Show feedback for empty search
        const speechHandler = window.speechHandler;
        if (speechHandler) {
            speechHandler.showFeedback('Ju lutem shkruani diçka për të kërkuar.');
        }
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
        this.isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        
        // Only initialize the recognition object, don't request permissions yet
        this.initRecognition().then(() => {
            this.bindEvents();
        }).catch(error => {
            console.error('Failed to initialize recognition:', error);
            if (this.voiceButton) {
                this.voiceButton.style.display = 'none';
            }
        });
    }

    async initRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported');
        }

        // Initialize recognition object without starting it
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings
        this.recognition.lang = 'sq-AL';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        // Set up event handlers
        this.recognition.onstart = this.handleStart.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onerror = this.handleError.bind(this);
        this.recognition.onnomatch = this.handleNoMatch.bind(this);
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Store the stream reference to keep the permission active
            if (!window.streamReference) {
                window.streamReference = stream;
            }
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
                this.showFeedback('Please allow microphone access to use voice commands');
            }
            return false;
        }
    }

    bindEvents() {
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', async () => {
                if (!this.recognition) {
                    this.showFeedback('Speech recognition not supported in your browser');
                    return;
                }

                if (this.isListening) {
                    this.stopListening();
                } else {
                    // Only request permission when the user clicks the button
                    if (this.isIOS) {
                        const permissionGranted = await this.requestMicrophonePermission();
                        if (!permissionGranted) {
                            return;
                        }
                    }
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

        // Store the search term at the start of countdown
        const searchTerm = this.searchInput.value.trim();
        if (!searchTerm) {
            return; // Don't start countdown if there's no text
        }

        this.countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.showFeedback(`Kërkimi fillon për... ${countdown}`);
            } else {
                // Clear the interval when countdown reaches 0
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        }, 1000);

        this.searchTimeout = setTimeout(() => {
            this.clearTimers();
            // Only perform search if the text hasn't changed
            if (this.searchInput.value.trim() === searchTerm) {
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

    async startListening() {
        try {
            this.clearTimers();
            
            // Hide keyboard on mobile
            if (this.isMobile) {
                this.searchInput.blur();
            }

            // Start recognition
            await this.recognition.start();
            this.isListening = true;
            this.voiceButton.classList.add('listening');
            this.showFeedback(this.isMobile ? 'Tap to stop...' : 'Listening...');
        } catch (error) {
            console.error('Start listening error:', error);
            this.handleError({ error: 'start-error' });
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
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

            // Ensure we start the countdown if we have text when manually stopping
            if (this.searchInput.value.trim()) {
                this.startCountdown();
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
            // Reset state even if there's an error
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.clearTimers();
        }
    }

    handleStart() {
        this.isListening = true;
        this.voiceButton.classList.add('listening');
        this.searchInput.placeholder = 'Duke dëgjuar...';
        
        // Clear any existing text when starting new recognition
        if (this.isMobile) {
            this.searchInput.value = '';
            this.searchInput.blur();
        }
    }

    handleEnd() {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        this.searchInput.placeholder = 'Search anything...';
        
        // If we have text in the input, start the countdown for search
        if (this.searchInput.value.trim()) {
            this.startCountdown();
        } else if (!this.searchTimeout) {
            // Only show no speech message if no text was captured and no timeout is pending
            this.showFeedback('Nuk u dëgjua asnjë zë. Provoni përsëri.');
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

        // Update the search input with transcribed text
        const transcribedText = finalTranscript || interimTranscript;
        if (transcribedText) {
            this.searchInput.value = transcribedText;
            
            // On iOS, we need to manually trigger the end if we have a final result
            if (finalTranscript && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
                this.stopListening();
                this.startCountdown();
            }
        }
    }

    handleError(event) {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        console.error('Speech recognition error:', event.error);

        let message = '';
        
        switch (event.error) {
            case 'no-speech':
                message = 'No speech detected. Please try speaking again.';
                break;
            case 'audio-capture':
            case 'not-allowed':
                message = this.isIOS ? 
                    'Please allow microphone access in Settings > Safari > Microphone' :
                    'Please allow microphone access to use voice commands';
                break;
            case 'network':
                message = 'Network error. Please check your connection and try again.';
                break;
            case 'aborted':
                message = 'Voice recognition was stopped. Tap the mic to try again.';
                break;
            case 'language-not-supported':
                message = 'This language is not supported. Please try another browser.';
                break;
            case 'service-not-allowed':
                message = this.isIOS ?
                    'Please enable voice recognition in Settings > Safari > Microphone' :
                    'Voice recognition service is not available. Please try again later.';
                break;
            case 'start-error':
                message = this.isIOS ?
                    'Please close and reopen Safari, then try again' :
                    'Error starting voice recognition. Please refresh and try again.';
                break;
            default:
                message = this.isIOS ?
                    'Please check microphone permissions in Settings > Safari > Microphone' :
                    'An unexpected error occurred. Please try again.';
        }
        
        this.showFeedback(message);
    }

    handleNoMatch() {
        this.showFeedback('Could not recognize speech. Please try again.');
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
    // Initialize menu functionality
    const menuButton = document.querySelector('.menu-button');
    const navOverlay = document.querySelector('.nav-overlay');
    const body = document.body;

    if (menuButton && navOverlay) {
        menuButton.addEventListener('click', () => {
            body.classList.toggle('nav-active');
        });

        navOverlay.addEventListener('click', () => {
            body.classList.remove('nav-active');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                body.classList.remove('nav-active');
            }
        });
    }

    // Initialize chatbot
    const initialMessage = document.querySelector('.message.bot .message-content');
    if (initialMessage && window.AI_CONTEXT) {
        initialMessage.textContent = AI_CONTEXT.commonPhrases.greeting;
    }
    
    // Initialize speech recognition
    try {
        window.speechHandler = new SpeechRecognitionHandler();
        console.log('Speech recognition initialized successfully');
    } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        // Hide voice button if initialization fails
        const voiceButton = document.getElementById('voiceButton');
        if (voiceButton) {
            voiceButton.style.display = 'none';
        }
    }
}); 