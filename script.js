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
        
        // Initialize the recognition object without starting it
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

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Keep Albanian but add fallback handling
        this.recognition.lang = 'sq-AL';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3; // Increased alternatives for better recognition

        // Set up event handlers with improved error handling
        this.recognition.onstart = this.handleStart.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onerror = (event) => {
            if (event.error === 'language-not-supported' && this.isIOS) {
                // Try restarting with Albanian again
                console.log('Retrying with Albanian language...');
                if (this.isListening) {
                    this.stopListening();
                    setTimeout(() => this.startListening(), 100);
                }
            } else {
                this.handleError(event);
            }
        };
        this.recognition.onnomatch = this.handleNoMatch.bind(this);
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!window.streamReference) {
                window.streamReference = stream;
                console.log('Microphone stream acquired');
            }
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error.name, error.message);
            if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
                this.showFeedback('Ju lutem lejoni aksesin në mikrofon në Settings > Safari > Microphone dhe rifreskoni faqen');
            }
            return false;
        }
    }

    bindEvents() {
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => {
                if (!this.recognition) {
                    this.showFeedback('Zëri nuk mbështetet në këtë shfletues');
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

    async startListening() {
        try {
            console.log('Starting speech recognition...');
            this.clearTimers();
            if (this.isMobile) {
                this.searchInput.blur();
            }
            if (!window.streamReference) {
                console.log('Requesting microphone permission...');
                const permissionGranted = await this.requestMicrophonePermission();
                console.log('Permission granted:', permissionGranted);
                if (!permissionGranted) {
                    return;
                }
            }
            console.log('Calling recognition.start()');
            await this.recognition.start();
            console.log('Recognition started successfully');
            this.isListening = true;
            this.voiceButton.classList.add('listening');
            this.showFeedback(this.isMobile ? 'Prekni për të ndalur...' : 'Duke dëgjuar...');

            // iOS-specific timeout to force stop after 10 seconds
            if (this.isIOS) {
                setTimeout(() => {
                    if (this.isListening) {
                        console.log('Forcing stop after 10s on iOS');
                        this.stopListening();
                    }
                }, 10000);
            }
        } catch (error) {
            console.error('Start listening error:', error.name, error.message);
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.showFeedback(this.isIOS ?
                'Gabim në nisjen e zërit. Ju lutem rifreskoni faqen ose kontrolloni Settings > Safari > Microphone' :
                'Gabim në nisjen e zërit. Ju lutem provoni përsëri.');
        }
    }

    stopListening() {
        try {
            this.clearTimers();
            this.recognition.stop();
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            if (this.isMobile) {
                this.searchInput.blur();
            }
            if (this.searchInput.value.trim()) {
                this.startCountdown();
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.clearTimers();
        }
    }

    handleStart() {
        console.log('Recognition started');
        this.isListening = true;
        this.voiceButton.classList.add('listening');
        this.searchInput.placeholder = 'Duke dëgjuar...';
        if (this.isMobile) {
            this.searchInput.value = '';
            this.searchInput.blur();
        }
    }

    handleEnd() {
        console.log('Recognition ended');
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        this.searchInput.placeholder = 'Search anything...';
        if (this.searchInput.value.trim()) {
            this.startCountdown();
        } else if (!this.searchTimeout) {
            this.showFeedback('Nuk u dëgjua asnjë zë. Provoni përsëri.');
        }
    }

    handleResult(event) {
        console.log('handleResult called with event:', event);
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
        const transcribedText = finalTranscript || interimTranscript;
        if (transcribedText) {
            console.log('Transcribed text:', transcribedText);
            this.searchInput.value = transcribedText;
            if (finalTranscript && this.isIOS) {
                this.stopListening();
                this.startCountdown();
            }
        } else {
            console.log('No transcribed text available.');
        }
    }

    handleError(event) {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        console.error('Speech recognition error:', event.error);
        let message = '';
        switch (event.error) {
            case 'no-speech':
                message = 'Nuk u dëgjua asnjë zë. Ju lutem provoni përsëri.';
                break;
            case 'audio-capture':
            case 'not-allowed':
                message = this.isIOS ?
                    'Ju lutem lejoni aksesin në mikrofon në Settings > Safari > Microphone dhe rifreskoni faqen' :
                    'Ju lutem lejoni aksesin në mikrofon për të përdorur komandat me zë';
                break;
            case 'network':
                message = 'Gabim në rrjet. Ju lutem kontrolloni lidhjen tuaj dhe provoni përsëri.';
                break;
            case 'aborted':
                message = 'Zëri u ndërpre. Prekni mikrofonin për të provuar përsëri.';
                break;
            case 'language-not-supported':
                message = 'Kjo gjuhë nuk mbështetet. Provoni të ndryshoni gjuhën ose shfletuesin.';
                break;
            case 'service-not-allowed':
                message = this.isIOS ?
                    'Ju lutem aktivizoni zërin në Settings > Safari > Microphone dhe rifreskoni' :
                    'Shërbimi i zërit nuk është i disponueshëm. Provoni përsëri më vonë.';
                break;
            default:
                message = this.isIOS ?
                    'Gabim i panjohur. Kontrolloni Settings > Safari > Microphone dhe rifreskoni' :
                    'Ndodhi një gabim i papritur. Provoni përsëri.';
        }
        this.showFeedback(message);
    }

    handleNoMatch() {
        this.showFeedback('Nuk mund të njohë zërin. Ju lutem provoni përsëri.');
    }

    showFeedback(message) {
        const existingFeedback = document.querySelector('.voice-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        const feedback = document.createElement('div');
        feedback.className = 'voice-feedback';
        if (this.isMobile) {
            feedback.className += ' mobile';
        }
        feedback.textContent = message;
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.appendChild(feedback);
        }
        if (!message.includes('Kërkimi fillon për...')) {
            setTimeout(() => {
                feedback.remove();
            }, this.isMobile ? 2000 : 3000);
        }
    }

    startCountdown() {
        this.clearTimers();
        let countdown = 3;
        this.showFeedback(`Kërkimi fillon për... ${countdown}`);
        const searchTerm = this.searchInput.value.trim();
        if (!searchTerm) {
            return;
        }
        this.countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.showFeedback(`Kërkimi fillon për... ${countdown}`);
            } else {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        }, 1000);
        this.searchTimeout = setTimeout(() => {
            this.clearTimers();
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
}

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

// Matrix Animation
class MatrixAnimation {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Albanian tax-related terms and numbers
        this.terms = [
            'TVSH', 'TAP', 'FITIM', 'TATIM', 'PAGA',
            'SIGURIME', 'KONTRIBUTE', 'DEKLARIM', 
            'EFILING', 'NIPTI', 'FATURA', 'BILANC',
            'AKTIV', 'PASIV', 'ARKE', 'BANKE',
            '20%', '15%', '13.5%', '21.6%', '3.4%',
            'SHITJE', 'BLERJE', 'XHIRO', 'QARKULLIM'
        ];
        
        this.fontSize = 16;
        this.streams = [];
        this.frameCount = 0;
        
        this.messages = [
            'TVSH APLIKOHET 20% PER MALLRAT',
            'TATIMI MBI FITIMIN 15%',
            'TATIMI MBI PAGEN 13.5%',
            'SIGURIMET SHOQERORE 21.6%',
            'SIGURIMET SHENDETESORE 3.4%',
            'DEKLARIMI ONLINE NE E-FILING',
            'AFATI I DEKLARIMIT DERI ME 14',
            'TATIMI NE BURIM 15%'
        ];
        this.currentMessageIndex = 0;
        
        this.init();
        this.animate();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Initialize horizontal streams with more space between them
        const rows = Math.floor(this.canvas.height / (this.fontSize * 1.5)); // Increased spacing
        for (let i = 0; i < rows; i++) {
            this.streams.push({
                x: -Math.random() * 1000,
                y: i * (this.fontSize * 1.5), // Increased spacing
                speed: 0.5 + Math.random() * 1.5, // Slower speed for better readability
                characters: [],
                length: 5 + Math.floor(Math.random() * 10), // Shorter streams for better readability
                brightness: 0.2 + Math.random() * 0.4,
                lastCharUpdateTime: 0,
                updateInterval: 500 + Math.random() * 1000 // Slower updates for better readability
            });
        }

        window.addEventListener('resize', () => this.onWindowResize());
    }

    drawText(message, y) {
        const x = (this.canvas.width - (message.length * this.fontSize)) / 2;
        this.ctx.fillStyle = '#00fdb1';
        this.ctx.font = 'bold ' + this.fontSize + 'px monospace';
        this.ctx.fillText(message, x, y);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Slower fade for better readability
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = this.fontSize + 'px monospace';
        const currentTime = Date.now();
        
        // Update and draw streams
        this.streams.forEach(stream => {
            if (stream.characters.length < stream.length) {
                stream.characters.push({
                    term: this.terms[Math.floor(Math.random() * this.terms.length)],
                    brightness: stream.brightness,
                    lastUpdate: currentTime
                });
            }
            
            // Draw terms horizontally
            stream.characters.forEach((char, index) => {
                if (currentTime - char.lastUpdate > stream.updateInterval) {
                    char.term = this.terms[Math.floor(Math.random() * this.terms.length)];
                    char.lastUpdate = currentTime;
                }
                
                const alpha = (index === stream.characters.length - 1) ? 1 : 
                             (index === 0) ? 0.3 : 
                             char.brightness;
                
                this.ctx.shadowColor = '#00fdb1';
                this.ctx.shadowBlur = index === stream.characters.length - 1 ? 8 : 0;
                this.ctx.fillStyle = `rgba(0, 253, 177, ${alpha})`;
                
                const xPos = stream.x + (index * (this.fontSize * 4)); // Increased spacing between terms
                this.ctx.fillText(char.term, xPos, stream.y);
                
                this.ctx.shadowBlur = 0;
            });
            
            stream.x += stream.speed;
            
            if (stream.x > this.canvas.width) {
                stream.x = -(stream.length * this.fontSize * 4); // Adjusted for term length
                stream.characters = [];
                stream.speed = 0.5 + Math.random() * 1.5;
            }
        });
        
        this.frameCount++;
        if (this.frameCount % 200 === 0) {
            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        }
        
        this.ctx.shadowColor = '#00fdb1';
        this.ctx.shadowBlur = 15;
        this.drawText(this.messages[this.currentMessageIndex], this.canvas.height / 2);
        this.ctx.shadowBlur = 0;
    }

    onWindowResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.streams = [];
        this.init();
    }
}

// Initialize matrix animation
const matrixAnimation = new MatrixAnimation();

// Menu functionality
document.querySelector('.menu-button').addEventListener('click', function() {
    document.body.classList.toggle('nav-active');
});

document.querySelector('.nav-overlay').addEventListener('click', function() {
    document.body.classList.remove('nav-active');
});

// Login modal functionality
const loginBtn = document.querySelector('.auth-btn.login');
const loginModal = document.querySelector('.login-modal');
const loginClose = document.querySelector('.login-close');

loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
});

loginClose.addEventListener('click', () => {
    loginModal.classList.remove('active');
});

loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
    }
});

// Chatbot functionality
const chatbotWidget = document.querySelector('.chatbot-widget');
const chatbotButton = document.querySelector('.chatbot-button');

chatbotButton.addEventListener('click', () => {
    chatbotWidget.classList.toggle('active');
});

// Voice button functionality
const voiceButton = document.getElementById('voiceButton');

voiceButton.addEventListener('click', function() {
    this.classList.toggle('listening');
});