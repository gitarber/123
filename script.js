// Menu Functionality
class MenuHandler {
    constructor() {
        this.menuButton = document.querySelector('.menu-button');
        this.navOverlay = document.querySelector('.nav-overlay');
        this.body = document.body;
        this.mainNav = document.querySelector('.main-nav');
        this.lastScrollTop = 0;
        this.bindEvents();
    }

    bindEvents() {
        if (!this.menuButton || !this.navOverlay) return;

        // Toggle menu
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.body.classList.toggle('nav-active');
        });

        // Close menu when clicking overlay
        this.navOverlay.addEventListener('click', () => {
            this.body.classList.remove('nav-active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.body.classList.contains('nav-active') && 
                !this.mainNav.contains(e.target) && 
                !this.menuButton.contains(e.target)) {
                this.body.classList.remove('nav-active');
            }
        });

        // Close menu when pressing escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.body.classList.remove('nav-active');
            }
        });

        // Handle scroll
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Show menu button when at top
            if (scrollTop <= 0) {
                this.menuButton.style.opacity = '1';
                this.menuButton.style.transform = 'translateY(0)';
                return;
            }

            // Hide menu button when scrolling down, show when scrolling up
            if (scrollTop > this.lastScrollTop) {
                // Scrolling down
                this.menuButton.style.opacity = '0';
                this.menuButton.style.transform = 'translateY(-20px)';
            } else {
                // Scrolling up
                this.menuButton.style.opacity = '1';
                this.menuButton.style.transform = 'translateY(0)';
            }
            
            this.lastScrollTop = scrollTop;
        });
    }
}

// Video Data
const videoData = [
    {
        id: '60jZKH9q_RA',
        title: 'Si të bëj ndryshimin e adresës se biznesit nga e albania ?',
        description: 'Si të bëj ndryshimin e adresës se biznesit nga e albania ?',
        thumbnail: 'thumbnails/e-albania/1.png',
        category: 'e-albania',
        keywords: ['ndryshimi', 'adresës', 'biznesit', 'e-albania']
    },
    {
        id: 'rsROpcHbT_Y',
        title: 'Si të shtoj përgjegjësinë tatim i mbajtur në burim për bizneset nga e albania',
        description: 'Si të shtoj përgjegjësinë tatim i mbajtur në burim për bizneset nga e albania ?',
        thumbnail: 'thumbnails/e-albania/2.png',
        category: 'e-albania',
        keywords: ['tatim', 'bizneset', 'e-albania']
    },
    {
        id: 'TnCy5Qze1pI',
        title: 'Si të ndryshoj përgjegjësitë tatimore të biznesit nga e-Albania?',
        description: 'Si të ndryshoj përgjegjësitë tatimore të biznesit nga e-Albania?',
        thumbnail: 'thumbnails/e-albania/3.png',
        category: 'e-albania',
        keywords: ['tatimore', 'biznesit', 'e-Albania']
    },
    {
        id: 'nHipbjjsGMM',
        title: 'Si të shtoj TVSH si përgjegjësi tatimore në e-Albania e biznesit ',
        description: 'Si të shtoj TVSH si përgjegjësi tatimore në e-Albania e biznesit ?',
        thumbnail: 'thumbnails/e-albania/4.png',
        category: 'e-albania',
        keywords: ['TVSH', 'tatimore', 'biznesit', 'e-Albania']
    },
    {
        id: 'R9-YZqG5ue0',
        title: 'A nevojitet nënshkrimi elektronik për ndryshimin e adresës',
        description: 'A nevojitet nënshkrimi elektronik për ndryshimin e adresës ?',
        thumbnail: 'thumbnails/e-albania/5.png',
        category: 'e-albania',
        keywords: ['ndryshimi', 'adresës', 'elektronik']
    },
    {
        id: 'farGSJaxhoc',
        title: 'Si të shkarkojmë një vërtetim që nuk kemi detyrime biznesi ?',
        description: 'Si të shkarkojmë një vërtetim që nuk kemi detyrime biznesi ?',
        thumbnail: 'thumbnails/e-albania/6.png',
        category: 'e-albania',
        keywords: ['vërtetim', 'biznesi']
    },
    {
        id: 'TRbIIOoEZbQ',
        title: 'Si të shtoj përgjegjësinë tatim i mbajtur në burim për bizneset nga e albania',
        description: 'Si të shtoj përgjegjësinë tatim i mbajtur në burim për bizneset nga e albania ?',
        thumbnail: 'thumbnails/e-albania/7.png',
        category: 'e-albania',
        keywords: ['tatim', 'bizneset', 'e-albania']
    },
    {
        id: 'p2DWTp84Y8o',
        title: 'Si të shkarkojmë vërtetimin e pagesës së kontributeve në vite nga e-Albania?',
        description: 'Si të shkarkojmë vërtetimin e pagesës së kontributeve në vite nga e-Albania?',
        thumbnail: 'thumbnails/e-albania/8.png',
        category: 'e-albania',
        keywords: ['vërtetim', 'pagesës', 'kontributeve', 'e-Albania']
    },
    {
        id: 'swiJ7_cCUVs',
        title: 'Ndryshimi i kategorisë së biznesit që të bëjmë fatura falas nga selfcare?',
        description: 'Ndryshimi i kategorisë së biznesit që të bëjmë fatura falas nga selfcare?',
        thumbnail: 'thumbnails/e-albania/9.png',
        category: 'e-albania',
        keywords: ['ndryshimi', 'kategorisë', 'biznesit', 'fatura', 'selfcare']
    },
    {
        id: 'hFg2NT2Wg3I',
        title: 'Si të ndryshojmë kategorinë e punësimit të biznesit nga e albania ?',
        description: 'Si të ndryshojmë kategorinë e punësimit të biznesit nga e albania ?',
        thumbnail: 'thumbnails/e-albania/11.png',
        category: 'e-albania',
        keywords: ['ndryshimi', 'kategorinë', 'punësimit', 'biznesit', 'e-albania']
    },
    {
        id: 'RS9fHh0E4ZU',
        title: 'Si të hapim një nipt ose adresë sekondare',
        description: 'Si të hapim një nipt ose adresë sekondare ?',
        thumbnail: 'thumbnails/e-albania/10.png',
        category: 'e-albania',
        keywords: ['nipt', 'adresë', 'sekondare']
    },
    // Add other videos here...
];

// Search functionality
function handleSearch(event) {
    if (event) {
        event.preventDefault();
    }
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm) {
        // Store the search term in sessionStorage
        sessionStorage.setItem('lastSearch', searchTerm);
        
        // Redirect to search results page
        window.location.href = `/search-results.html?q=${encodeURIComponent(searchTerm)}`;
    }
}

// Function to display search results
function displaySearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q')?.toLowerCase() || sessionStorage.getItem('lastSearch');

    if (!searchTerm) {
        window.location.href = '/index.html';
        return;
    }

    // Display search term
    document.getElementById('searchQuery').textContent = searchTerm;

    // Split search term into keywords
    const keywords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Score and rank results
    const scoredResults = videoData.map(video => {
        let score = 0;
        const searchableText = `${video.title} ${video.description} ${video.category}`.toLowerCase();
        
        // Check for exact matches
        if (searchableText.includes(searchTerm)) {
            score += 10;
        }

        // Check for keyword matches
        keywords.forEach(keyword => {
            // Score based on keyword presence in title, description, and category
            if (video.title.toLowerCase().includes(keyword)) {
                score += 5; // Higher score for title matches
            }
            if (video.description.toLowerCase().includes(keyword)) {
                score += 3; // Medium score for description matches
            }
            if (video.category.toLowerCase().includes(keyword)) {
                score += 2; // Lower score for category matches
            }
            // Check against keywords
            if (video.keywords && video.keywords.includes(keyword)) {
                score += 4; // Additional score for keyword matches
            }
        });

        // Add common search terms and their related topics
        const relatedTerms = {
            'si': ['how', 'tutorial', 'guide', 'udhëzues'],
            'aplikim': ['application', 'apply', 'submit', 'register'],
            'deklarim': ['declare', 'submit', 'report', 'file'],
            'biznes': ['business', 'company', 'firm', 'enterprise'],
            'tatim': ['tax', 'fiscal', 'payment', 'duty'],
            'dokument': ['document', 'form', 'paper', 'file']
        };

        // Check for related terms
        Object.entries(relatedTerms).forEach(([term, related]) => {
            if (searchTerm.includes(term) || related.some(r => searchTerm.includes(r))) {
                if (searchableText.includes(term)) {
                    score += 2; // Boost score for related term matches
                }
            }
        });

        return { ...video, score };
    });

    // Filter results with any score and sort by score
    const results = scoredResults
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);

    // Update results count with appropriate message
    const countElement = document.getElementById('resultsCount');
    if (results.length > 0) {
        countElement.textContent = `${results.length} rezultate u gjetën`;
        countElement.style.color = 'rgba(255, 255, 255, 0.8)';
    } else {
        countElement.innerHTML = `
            Nuk u gjetën rezultate për "${searchTerm}".<br>
            Ju sugjerojmë të shikoni tutorialet tona më të fundit:
        `;
        countElement.style.color = '#00fdb1';
        // Show all videos when no results are found
        results.push(...videoData);
    }

    // Clear existing results
    searchResults.innerHTML = '';

    // Display results
    results.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.setAttribute('data-video-id', video.id);
        
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <h3>${video.title}</h3>
            ${video.score > 0 ? `<div class="relevance-score">Përputhshmëria: ${Math.min(100, Math.round(video.score * 10))}%</div>` : ''}
        `;

        // Add click event for modal
        videoCard.addEventListener('click', () => {
            const modal = document.querySelector('.video-modal');
            const player = document.querySelector('.youtube-player');
            player.src = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        searchResults.appendChild(videoCard);
    });
}

// Initialize search results if on search page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu
    window.menuHandler = new MenuHandler();
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        // Show login modal on page load
        const loginModal = document.querySelector('.login-modal');
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
        // If logged in, proceed to show the main content
        // You can add logic here to show the main content
    }

    // Initialize search results if on search page
    displaySearchResults();
    
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
        const voiceButton = document.getElementById('voiceButton');
        if (voiceButton) {
            voiceButton.style.display = 'none';
        }
    }

    // Login Modal Functionality
    const loginButtons = document.querySelectorAll('.auth-btn.login'); // This will get both desktop and mobile buttons
    const loginClose = document.querySelector('.login-close');
    const loginForm = document.querySelector('.login-form');
    const errorMessage = document.createElement('div'); // Create an error message element
    errorMessage.className = 'error-message'; // Add a class for styling
    loginForm.appendChild(errorMessage); // Append it to the form

    // Open modal when clicking any login button
    loginButtons.forEach(button => {
        button.addEventListener('click', () => {
            const loginModal = document.querySelector('.login-modal');
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            // Close the nav menu if it's open (mobile)
            document.body.classList.remove('nav-active');
            document.getElementById('email').focus(); // Focus on the email input
        });
    });

    // Close modal when clicking close button
    loginClose.addEventListener('click', () => {
        const loginModal = document.querySelector('.login-modal');
        loginModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        // Lock the website by showing the login modal again
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    // Handle login form submission
    loginForm.addEventListener('submit', validateLogin);

    function validateLogin(event) {
        event.preventDefault(); // Prevent form submission

        // Get the input values
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // Check if inputs exist
        console.log('Email Input:', emailInput);
        console.log('Password Input:', passwordInput);

        if (!emailInput || !passwordInput) {
            errorMessage.textContent = 'Login form is not properly initialized.';
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        // Form validation for email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            errorMessage.textContent = 'Please enter a valid email address.';
            return;
        }

        // Default credentials
        const credentials = [
            { email: 'user1@example.com', password: 'password123' },
            { email: 'user2@example.com', password: 'password456' },
            { email: 'user3@example.com', password: 'password789' },
            { email: 'user4@example.com', password: 'password101' },
            { email: 'user5@example.com', password: 'password202' }
        ];

        // Validate credentials
        const user = credentials.find(cred => cred.email === email && cred.password === password);
        if (user) {
            alert('Login successful!');
            // Close the login modal
            const loginModal = document.querySelector('.login-modal');
            loginModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling

            // Set user as logged in
            localStorage.setItem('isLoggedIn', 'true');

            // Redirect to the landing page or main content
            window.location.href = 'index.html'; // Change this to your landing page URL
        } else {
            errorMessage.textContent = 'Invalid email or password. Please try again.';
        }
    }

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
}); 