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
    // e-albania videos (42 videos)
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
    {
        id: 'DwW26e-zXVg',
        title: 'Si të shkarkojmë vërtetim për pagesën e sigurimeve shoqërore sipas biznesit ?',
        description: 'Si të shkarkojmë vërtetim për pagesën e sigurimeve shoqërore sipas biznesit ?',
        thumbnail: 'thumbnails/e-albania/37.png',
        category: 'e-albania',
        keywords: ['vërtetim', 'sigurime', 'shoqërore', 'biznesit', 'e-albania']
    },
    {
        id: 'ILeDQukVbOE',
        title: 'Si të bëj ndryshimin e adresës së biznesit nëpërmjet e-albania ?',
        description: 'Si të bëj ndryshimin e adresës së biznesit nëpërmjet e-albania ?',
        thumbnail: 'thumbnails/e-albania/38.png',
        category: 'e-albania',
        keywords: ['ndryshimi', 'adresës', 'biznesit', 'e-albania']
    },
    {
        id: 'Z6KYcMrvZaI',
        title: 'Si dorëzohen automatikisht librat e shitjes dhe blerjes ?',
        description: 'Si dorëzohen automatikisht librat e shitjes dhe blerjes ?',
        thumbnail: 'thumbnails/e-albania/39.png',
        category: 'e-albania',
        keywords: ['librat', 'shitjes', 'blerjes', 'automatikisht', 'e-albania']
    },
    {
        id: 'nyEHZ9IYcf0',
        title: 'Si të shtojmë përgjegjësinë tatimore Tatim i Mbajtur në Burim për qeranë ?',
        description: 'Si të shtojmë përgjegjësinë tatimore Tatim i Mbajtur në Burim për qeranë ?',
        thumbnail: 'thumbnails/e-albania/40.png',
        category: 'e-albania',
        keywords: ['përgjegjësi', 'tatimore', 'tatim', 'burim', 'qera', 'e-albania']
    },
    {
        id: '2wf8B3hUrHM',
        title: 'Si të shkarkojmë vërtetim që nuk kemi detyrime si biznes ?',
        description: 'Si të shkarkojmë vërtetim që nuk kemi detyrime si biznes ?',
        thumbnail: 'thumbnails/e-albania/41.png',
        category: 'e-albania',
        keywords: ['vërtetim', 'detyrime', 'biznes', 'e-albania']
    },
    {
        id: '-SDD69Ih4Nc',
        title: 'Si të shkarkojmë certifikatën familjare ?',
        description: 'Si të shkarkojmë certifikatën familjare ?',
        thumbnail: 'thumbnails/e-albania/42.png',
        category: 'e-albania',
        keywords: ['certifikata', 'familjare', 'e-albania']
    },
    {
        id: 'FJRa-8wYtXE',
        title: 'Si të ndajmë shërbimet për bizneset nga ato personale në e-Albania ?',
        description: 'Si të ndajmë shërbimet për bizneset nga ato personale në e-Albania ?',
        thumbnail: 'thumbnails/e-albania/21.png',
        category: 'e-albania',
        keywords: ['shërbime', 'biznes', 'personal', 'e-albania']
    },
    {
        id: 'DYTGG5oPyNU',
        title: 'Si të regjistrojmë në sistem 1 minoren në sistemin e tatimeve?',
        description: 'Si të regjistrojmë në sistem 1 minoren në sistemin e tatimeve?',
        thumbnail: 'thumbnails/e-albania/22.png',
        category: 'e-albania',
        keywords: ['regjistrim', 'minoren', 'tatime']
    },
    {
        id: 'lq94N_eXU-8',
        title: 'Hapja e llogarisë së biznesit në e-Albania ?',
        description: 'Hapja e llogarisë së biznesit në e-Albania ?',
        thumbnail: 'thumbnails/e-albania/23.png',
        category: 'e-albania',
        keywords: ['llogari', 'biznes', 'e-albania']
    },
    {
        id: 'eEi5_mEVQu8',
        title: 'Si të veproj që certifikata elektronike të gjenerohet brënda 2 orëve ?',
        description: 'Si të veproj që certifikata elektronike të gjenerohet brënda 2 orëve ?',
        thumbnail: 'thumbnails/e-albania/24.png',
        category: 'e-albania',
        keywords: ['certifikatë', 'elektronike', 'gjenerim']
    },
    {
        id: 'hFWi7tXdAow',
        title: 'Si të shkakrojm ekstraktin historik të biznesit nga e-Albania ?',
        description: 'Si të shkakrojm ekstraktin historik të biznesit nga e-Albania ?',
        thumbnail: 'thumbnails/e-albania/25.png',
        category: 'e-albania',
        keywords: ['ekstrakt', 'historik', 'biznes']
    },
    {
        id: 'KtWNgQt2oZw',
        title: 'Shkarkimi i niptit të biznesit me vulë digjitale.',
        description: 'Shkarkimi i niptit të biznesit me vulë digjitale.',
        thumbnail: 'thumbnails/e-albania/26.png',
        category: 'e-albania',
        keywords: ['nipt', 'vulë', 'digjitale']
    },
    {
        id: 'OS7urEptpbA',
        title: 'Si të shkarkojmë detyrimet e biznesit në kohë reale ?',
        description: 'Si të shkarkojmë detyrimet e biznesit në kohë reale ?',
        thumbnail: 'thumbnails/e-albania/27.png',
        category: 'e-albania',
        keywords: ['detyrime', 'biznes', 'kohë reale']
    },
    {
        id: 'bKi--7hVvjA',
        title: 'Shtimi i përgjegjësisë tatimore Tatim mbi fitimin për biznesin ?',
        description: 'Shtimi i përgjegjësisë tatimore Tatim mbi fitimin për biznesin ?',
        thumbnail: 'thumbnails/e-albania/28.png',
        category: 'e-albania',
        keywords: ['tatim', 'fitim', 'biznes']
    },
    {
        id: '5O0VVqeZttg',
        title: 'Si të shkakrojm kontributet shoqërore në vite nga e-Albania ?',
        description: 'Si të shkakrojm kontributet shoqërore në vite nga e-Albania ?',
        thumbnail: 'thumbnails/e-albania/29.png',
        category: 'e-albania',
        keywords: ['kontribute', 'shoqërore', 'e-albania']
    },
    {
        id: '8_KkwsPnGdk',
        title: 'Shtimi i përgjegjësisë tatimore Tatimi mbi pagën në e-Albania.',
        description: 'Shtimi i përgjegjësisë tatimore Tatimi mbi pagën në e-Albania.',
        thumbnail: 'thumbnails/e-albania/30.png',
        category: 'e-albania',
        keywords: ['tatim', 'pagë', 'e-albania']
    },
    {
        id: 'vGXio0FlW-M',
        title: 'Si të shkarkojmë një vërtetim që nuk kemi biznes ?',
        description: 'Si të shkarkojmë një vërtetim që nuk kemi biznes ?',
        thumbnail: 'thumbnails/e-albania/31.png',
        category: 'e-albania',
        keywords: ['vërtetim', 'biznes', 'e-albania']
    },
    {
        id: '2kAqRUS7CK8',
        title: 'Si të shkarkoj dëshminë e penalitetit online dhe falas ?',
        description: 'Si të shkarkoj dëshminë e penalitetit online dhe falas ?',
        thumbnail: 'thumbnails/e-albania/32.png',
        category: 'e-albania',
        keywords: ['dëshmi', 'penalitet', 'online']
    },
    {
        id: 'k4B27-YJ-ZI',
        title: 'Si të ndryshoj statusin e regjistrimit të biznesit ?',
        description: 'Si të ndryshoj statusin e regjistrimit të biznesit ?',
        thumbnail: 'thumbnails/e-albania/33.png',
        category: 'e-albania',
        keywords: ['status', 'regjistrim', 'biznes']
    },
    {
        id: 'Mk8l0J_bdBU',
        title: 'Shtimi i përgjegjësisë tatimore TVSH në e-Albania.',
        description: 'Shtimi i përgjegjësisë tatimore TVSH në e-Albania.',
        thumbnail: 'thumbnails/e-albania/34.png',
        category: 'e-albania',
        keywords: ['tvsh', 'tatim', 'e-albania']
    },
    {
        id: 'NZMn1-8wt7A',
        title: 'Cfarë duhet të kem kujdes në kërkesën për cregjistrimin e biznesit ?',
        description: 'Cfarë duhet të kem kujdes në kërkesën për cregjistrimin e biznesit ?',
        thumbnail: 'thumbnails/e-albania/35.png',
        category: 'e-albania',
        keywords: ['çregjistrim', 'biznes', 'kërkesë']
    },
    {
        id: '9qy6o_WN4Go',
        title: 'Si të shkarkoj vërtetimin e xhiros për 3 vitet e fundit ?',
        description: 'Si të shkarkoj vërtetimin e xhiros për 3 vitet e fundit ?',
        thumbnail: 'thumbnails/e-albania/36.png',
        category: 'e-albania',
        keywords: ['vërtetim', 'xhiro', 'vite']
    },

    // Excel videos (8 videos)
    {
        id: '23zxaMGpYms',
        title: 'Seksioni Autofill, Flash Fill, Checkboxes, Drop down',
        description: 'Tutorial për përdorimin e funksioneve të avancuara në Excel',
        thumbnail: 'thumbnails/excel/1.png',
        category: 'excel',
        keywords: ['excel', 'autofill', 'flash fill', 'checkboxes', 'dropdown']
    },
    {
        id: 'QAQKwKEKvXg',
        title: 'Seksioni Help Panel ne Excel',
        description: 'Si të përdorim Help Panel në Excel për zgjidhjen e problemeve',
        thumbnail: 'thumbnails/excel/2.png',
        category: 'excel',
        keywords: ['excel', 'help', 'panel']
    },
    {
        id: 'BNAjNtKy7pA',
        title: 'Seksioni Review Panel ne Excel',
        description: 'Si të përdorim Review Panel në Excel',
        thumbnail: 'thumbnails/excel/3.png',
        category: 'excel',
        keywords: ['excel', 'review', 'panel']
    },
    {
        id: 'v3yAlyJMdMs',
        title: 'Seksioni Data Panel ne Excel',
        description: 'Si të përdorim Data Panel në Excel',
        thumbnail: 'thumbnails/excel/4.png',
        category: 'excel',
        keywords: ['excel', 'data', 'panel']
    },
    {
        id: 'kam-08-LajU',
        title: 'Seksioni View Panel ne Excel',
        description: 'Si të përdorim View Panel në Excel',
        thumbnail: 'thumbnails/excel/5.png',
        category: 'excel',
        keywords: ['excel', 'view', 'panel']
    },
    {
        id: 'Xd_Ksqes-hw',
        title: 'Seksioni Worksheet and Workbook ne Excel',
        description: 'Si të përdorim Worksheet dhe Workbook në Excel',
        thumbnail: 'thumbnails/excel/6.png',
        category: 'excel',
        keywords: ['excel', 'worksheet', 'workbook', 'panel']
    },
    {
        id: 'wIedHxe4It0',
        title: 'Seksioni Page Layout Panel ne Excel',
        description: 'Si të përdorim Page Layout Panel në Excel',
        thumbnail: 'thumbnails/excel/7.png',
        category: 'excel',
        keywords: ['excel', 'page layout', 'panel']
    },
    {
        id: 'OhLRhHSyyqg',
        title: 'Seksioni Formulas Panel ne Excel',
        description: 'Si të përdorim Formulas Panel në Excel',
        thumbnail: 'thumbnails/excel/8.png',
        category: 'excel',
        keywords: ['excel', 'formulas', 'panel']
    },

    // Bilanci videos (expanding the collection)
    {
        id: 'wykIcscHuCA',
        title: 'Aplikimi për autorizime në bilancin vjetor',
        description: 'Si të aplikojmë për autorizime në bilancin vjetor',
        thumbnail: 'thumbnails/bilanci/1.png',
        category: 'bilanci',
        keywords: ['bilanc', 'autorizim', 'aplikim']
    },
    {
        id: 'GkuNeCUOrHU',
        title: 'Deklarimi i bilancit vjetor',
        description: 'Procedura e plotë për deklarimin e bilancit vjetor',
        thumbnail: 'thumbnails/bilanci/2.png',
        category: 'bilanci',
        keywords: ['bilanc', 'deklarim', 'vjetor']
    },
    {
        id: 'adresBilanc123',
        title: 'Plotësimi i adresës në bilancin vjetor',
        description: 'Si të plotësojmë saktë adresën në formularin e bilancit vjetor',
        thumbnail: 'thumbnails/bilanci/3.png',
        category: 'bilanci',
        keywords: ['bilanc', 'adresë', 'plotësim', 'formular']
    },
    {
        id: 'bilancPDF456',
        title: 'Gjenerimi i bilancit në PDF',
        description: 'Si të gjenerojmë bilancin në format PDF për dorëzim',
        thumbnail: 'thumbnails/bilanci/4.png',
        category: 'bilanci',
        keywords: ['bilanc', 'pdf', 'gjenerim', 'dorëzim']
    },
    {
        id: 'bilancKontroll789',
        title: 'Kontrolli i bilancit para dorëzimit',
        description: 'Si të kontrollojmë bilancin para dorëzimit final',
        thumbnail: 'thumbnails/bilanci/5.png',
        category: 'bilanci',
        keywords: ['bilanc', 'kontroll', 'dorëzim', 'final']
    },

    // Selfcare videos (8 videos)
    {
        id: '8WSPN5-lynw',
        title: 'Si të kontrolloj xhiron mujore të biznesit në cdo moment në selfcare ?',
        description: 'Si të kontrolloj xhiron mujore të biznesit në cdo moment në selfcare ?',
        thumbnail: 'thumbnails/selfcare/1.png',
        category: 'selfcare',
        keywords: ['xhiro', 'mujore', 'biznes', 'selfcare']
    },
    {
        id: '9qEbbA0KHvs',
        title: 'Si të kontrolloj transaksionet mujore të biznesit në selfcare ?',
        description: 'Si të kontrolloj transaksionet mujore të biznesit në selfcare ?',
        thumbnail: 'thumbnails/selfcare/2.png',
        category: 'selfcare',
        keywords: ['transaksione', 'mujore', 'biznes', 'selfcare']
    },
    {
        id: 'NA_jdrF9SIk',
        title: 'Si të verifikoj fiskalizimin e deklaratës doganore në selfcare ?',
        description: 'Si të verifikoj fiskalizimin e deklaratës doganore në selfcare ?',
        thumbnail: 'thumbnails/selfcare/3.png',
        category: 'selfcare',
        keywords: ['fiskalizim', 'deklaratë', 'doganore', 'selfcare']
    },
    {
        id: 'rW9zlAc_xhw',
        title: 'Si të kontrolloj transaksionet e shitjeve dhe blerjeve në selfcare .',
        description: 'Si të kontrolloj transaksionet e shitjeve dhe blerjeve në selfcare .',
        thumbnail: 'thumbnails/selfcare/4.png',
        category: 'selfcare',
        keywords: ['transaksione', 'shitje', 'blerje', 'selfcare']
    },
    {
        id: 'mJJW1ER81HI',
        title: 'Shtimi i artikujve në selfcare për të bërë fatura falas.',
        description: 'Shtimi i artikujve në selfcare për të bërë fatura falas.',
        thumbnail: 'thumbnails/selfcare/5.png',
        category: 'selfcare',
        keywords: ['artikuj', 'fatura', 'falas', 'selfcare']
    },
    {
        id: '9_iCgvMKEGc',
        title: 'Sa afat kemi për deklarimin e importit në sistemin selfcare ?',
        description: 'Sa afat kemi për deklarimin e importit në sistemin selfcare ?',
        thumbnail: 'thumbnails/selfcare/6.png',
        category: 'selfcare',
        keywords: ['afat', 'deklarim', 'import', 'selfcare']
    },
    {
        id: 'tov66HeqwUY',
        title: 'Aplikimi dhe ngarkimi i certifikates elektronike',
        description: 'Aplikimi dhe ngarkimi i certifikates elektronike',
        thumbnail: 'thumbnails/selfcare/7.png',
        category: 'selfcare',
        keywords: ['certifikatë', 'elektronike', 'aplikim', 'selfcare']
    },
    {
        id: 'jl8-zHSF3NI',
        title: 'Si regjistrohet deklarata doganore në sistem ?',
        description: 'Si regjistrohet deklarata doganore në sistem ?',
        thumbnail: 'thumbnails/selfcare/8.png',
        category: 'selfcare',
        keywords: ['deklaratë', 'doganore', 'regjistrim', 'selfcare']
    },

    // E-filling videos (25 videos)
    {
        id: '5g9jFmfpnUA',
        title: 'Si plotësohet deklarata e të ardhurave personale DIVA në sistemin e tatimeve ?',
        description: 'Si plotësohet deklarata e të ardhurave personale DIVA në sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/1.png',
        category: 'e-filling',
        keywords: ['deklarata', 'DIVA', 'tatime', 'të ardhura']
    },
    {
        id: 'CIJrga65fsY',
        title: 'Si të regjistroj llogarinë bankare të biznesit në sistemin e tatimeve ?',
        description: 'Si të regjistroj llogarinë bankare të biznesit në sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/2.png',
        category: 'e-filling',
        keywords: ['llogari', 'bankare', 'biznes', 'tatime']
    },
    {
        id: 'w0owmUr_au4',
        title: 'Si të ndryshoj numrin e cel dhe adresën e e mail në sistemin e tatimeve ?',
        description: 'Si të ndryshoj numrin e cel dhe adresën e e mail në sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/3.png',
        category: 'e-filling',
        keywords: ['numër', 'celular', 'email', 'tatime']
    },
    {
        id: '1pZ9HeiFmqY',
        title: 'Si plotësohet deklarata e tatimit të thjeshtuar mbi fitimin në sistemin e tatimeve ?',
        description: 'Si plotësohet deklarata e tatimit të thjeshtuar mbi fitimin në sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/4.png',
        category: 'e-filling',
        keywords: ['tatim', 'thjeshtuar', 'fitim', 'tatime']
    },
    {
        id: 'IBnm4KFV1kE',
        title: 'Si bëhet deklarimi me 0 i sigurimeve shoqërore ?',
        description: 'Si bëhet deklarimi me 0 i sigurimeve shoqërore ?',
        thumbnail: 'thumbnails/e-filling/5.png',
        category: 'e-filling',
        keywords: ['sigurime', 'shoqërore', 'deklarim']
    },
    {
        id: 'i3WjU85X_eM',
        title: 'Si bëhet regjistrimi me vonesë i punonjësve në sistem ?',
        description: 'Si bëhet regjistrimi me vonesë i punonjësve në sistem ?',
        thumbnail: 'thumbnails/e-filling/6.png',
        category: 'e-filling',
        keywords: ['regjistrim', 'vonesë', 'punonjës']
    },
    {
        id: 'u79_THF3WoQ',
        title: 'Gabimi kryesor në deklarimin e sigurimeve shëndetësore për të vetëpunësuarin ?',
        description: 'Gabimi kryesor në deklarimin e sigurimeve shëndetësore për të vetëpunësuarin ?',
        thumbnail: 'thumbnails/e-filling/7.png',
        category: 'e-filling',
        keywords: ['sigurime', 'shëndetësore', 'vetëpunësuar']
    },
    {
        id: 'fEdhO2ykLuw',
        title: 'Nëse pezulloj aktivitetin gjatë vitit, a duhet të dorëzoj bilanc ?',
        description: 'Nëse pezulloj aktivitetin gjatë vitit, a duhet të dorëzoj bilanc ?',
        thumbnail: 'thumbnails/e-filling/8.png',
        category: 'e-filling',
        keywords: ['pezullim', 'aktivitet', 'bilanc']
    },
    {
        id: 'VxlP4lWfdPI',
        title: 'Si të regjistrojmë dhe deklarojmë në sistemin e tatimeve nxënësit ose studentët praktikant ?',
        description: 'Si të regjistrojmë dhe deklarojmë në sistemin e tatimeve nxënësit ose studentët praktikant ?',
        thumbnail: 'thumbnails/e-filling/9.png',
        category: 'e-filling',
        keywords: ['nxënës', 'student', 'praktikant']
    },
    {
        id: '82hWX48_FWw',
        title: 'Si bëhet deklarimi në sistemin e tatimeve i punonjësve me leje lindje ?',
        description: 'Si bëhet deklarimi në sistemin e tatimeve i punonjësve me leje lindje ?',
        thumbnail: 'thumbnails/e-filling/10.png',
        category: 'e-filling',
        keywords: ['deklarim', 'leje lindje', 'punonjës']
    },
    {
        id: 'l6vr2Db0q9Y',
        title: 'Si të komunikojmë online me administratën tatimore ?',
        description: 'Si të komunikojmë online me administratën tatimore ?',
        thumbnail: 'thumbnails/e-filling/11.png',
        category: 'e-filling',
        keywords: ['komunikim', 'online', 'tatime']
    },
    {
        id: '5NZFGzrh8NI',
        title: 'Si të shikoj afatet për dorëzimin e deklaratave ?',
        description: 'Si të shikoj afatet për dorëzimin e deklaratave ?',
        thumbnail: 'thumbnails/e-filling/12.png',
        category: 'e-filling',
        keywords: ['afate', 'dorëzim', 'deklarata']
    },
    {
        id: 'X2N_SnzFSKE',
        title: 'Si deklarohet tatimi i mbajtur në burim për kontratat në monedhë të huaj ?',
        description: 'Si deklarohet tatimi i mbajtur në burim për kontratat në monedhë të huaj ?',
        thumbnail: 'thumbnails/e-filling/13.png',
        category: 'e-filling',
        keywords: ['tatim', 'burim', 'monedhë', 'huaj']
    },
    {
        id: 'HnjpmtSWVY0',
        title: 'Si bëhet regjistrimi i administratorit në sistemin e tatimeve ?',
        description: 'Si bëhet regjistrimi i administratorit në sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/14.png',
        category: 'e-filling',
        keywords: ['regjistrim', 'administrator', 'tatime']
    },
    {
        id: '90PmU1Xv-ls',
        title: 'Si të largoj punonjësit nga sistemi i tatimeve ?',
        description: 'Si të largoj punonjësit nga sistemi i tatimeve ?',
        thumbnail: 'thumbnails/e-filling/15.png',
        category: 'e-filling',
        keywords: ['largim', 'punonjës', 'tatime']
    },
    {
        id: 'XT1t_0vXggU',
        title: 'Si bëhet Regjistrimi i punonjësve në sistemin e tatimeve ?',
        description: 'Si bëhet Regjistrimi i punonjësve në sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/16.png',
        category: 'e-filling',
        keywords: ['regjistrim', 'punonjës', 'tatime']
    },
    {
        id: '8QcEZ0szw9U',
        title: 'Si te ndryshoj passwordin e tatimeve ?',
        description: 'Si te ndryshoj passwordin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/17.png',
        category: 'e-filling',
        keywords: ['password', 'ndryshim', 'tatime']
    },
    {
        id: 'Nve905cly6o',
        title: 'Si të verifikoj nëse biznesi im duhet të dorëzojë bilanc?',
        description: 'Si të verifikoj nëse biznesi im duhet të dorëzojë bilanc?',
        thumbnail: 'thumbnails/e-filling/18.png',
        category: 'e-filling',
        keywords: ['verifikim', 'biznes', 'bilanc']
    },
    {
        id: '-tNcVeC4xOA',
        title: 'Si bëhet deklarimi i tatimit të mbajtur në burim ?',
        description: 'Si bëhet deklarimi i tatimit të mbajtur në burim ?',
        thumbnail: 'thumbnails/e-filling/19.png',
        category: 'e-filling',
        keywords: ['deklarim', 'tatim', 'burim']
    },
    {
        id: 'BVMDTyp6uak',
        title: 'Si te shmangim gabimin ne pagesat pas afatit ?',
        description: 'Si te shmangim gabimin ne pagesat pas afatit ?',
        thumbnail: 'thumbnails/e-filling/20.png',
        category: 'e-filling',
        keywords: ['pagesa', 'afat', 'gabim']
    },
    {
        id: 'mCdxLZ05ZfA',
        title: 'Si të kontrolloj historikun e punësimit të punonjësve ?',
        description: 'Si të kontrolloj historikun e punësimit të punonjësve ?',
        thumbnail: 'thumbnails/e-filling/21.png',
        category: 'e-filling',
        keywords: ['historik', 'punësim', 'punonjës']
    },
    {
        id: 'tFEuCf6Ruiw',
        title: 'Gjendja e detyrimeve nga sistemi i tatimeve',
        description: 'Si të kontrollojmë gjendjen e detyrimeve në sistemin e tatimeve',
        thumbnail: 'thumbnails/e-filling/22.png',
        category: 'e-filling',
        keywords: ['gjendje', 'detyrime', 'tatime']
    },
    {
        id: '7F6zxQ2zBAo',
        title: 'Si behet deklarimi i adreses ne sistemin e tatimeve ?',
        description: 'Si behet deklarimi i adreses ne sistemin e tatimeve ?',
        thumbnail: 'thumbnails/e-filling/23.png',
        category: 'e-filling',
        keywords: ['deklarim', 'adresë', 'tatime']
    },
    {
        id: 'B0391KJ9XJI',
        title: 'Si të kontrolloj tepricën kreditore në sistemin e Tatimeve ?',
        description: 'Si të kontrolloj tepricën kreditore në sistemin e Tatimeve ?',
        thumbnail: 'thumbnails/e-filling/24.png',
        category: 'e-filling',
        keywords: ['tepricë', 'kreditore', 'tatime']
    },
    {
        id: '4rHwm_SljB4',
        title: 'Deklarimi i Diva per personat me te ardhura mbi 1.2 milion leke te reja ne vit ose te dypunesuar.',
        description: 'Deklarimi i Diva per personat me te ardhura mbi 1.2 milion leke te reja ne vit ose te dypunesuar.',
        thumbnail: 'thumbnails/e-filling/25.png',
        category: 'e-filling',
        keywords: ['diva', 'të ardhura', 'dypunësuar']
    },

    // FAQ videos (20 videos)
    {
        id: 'tFEuCf6Ruiw',
        title: 'Gjendja e detyrimeve nga sistemi i tatimeve',
        description: 'Si të kontrollojmë gjendjen e detyrimeve në sistemin e tatimeve',
        thumbnail: 'thumbnails/faq/1.png',
        category: 'faq',
        keywords: ['faq', 'detyrime', 'tatime']
    },
    {
        id: '7F6zxQ2zBAo',
        title: 'Deklarimi i adresës në sistemin e tatimeve',
        description: 'Si bëhet deklarimi i adresës në sistemin e tatimeve',
        thumbnail: 'thumbnails/faq/2.png',
        category: 'faq',
        keywords: ['faq', 'adresë', 'deklarim']
    },
    {
        id: 'B0391KJ9XJI',
        title: 'Si të kontrolloj tepricën kreditore në sistemin e Tatimeve ?',
        description: 'Si të kontrolloj tepricën kreditore në sistemin e Tatimeve ?',
        thumbnail: 'thumbnails/faq/3.png',
        category: 'faq',
        keywords: ['faq', 'tepricë', 'kreditore']
    },
    {
        id: '4rHwm_SljB4',
        title: 'Deklarimi i Diva per personat me te ardhura mbi 1.2 milion leke te reja ne vit',
        description: 'Deklarimi i Diva per personat me te ardhura mbi 1.2 milion leke te reja ne vit',
        thumbnail: 'thumbnails/faq/4.png',
        category: 'faq',
        keywords: ['faq', 'diva', 'deklarim']
    },
    {
        id: 'BVMDTyp6uak',
        title: 'Si te shmangim gabimin ne pagesat pas afatit ?',
        description: 'Si te shmangim gabimin ne pagesat pas afatit ?',
        thumbnail: 'thumbnails/faq/5.png',
        category: 'faq',
        keywords: ['faq', 'pagesa', 'afat']
    },
    {
        id: 'mCdxLZ05ZfA',
        title: 'Si të kontrolloj historikun e punësimit të punonjësve ?',
        description: 'Si të kontrolloj historikun e punësimit të punonjësve ?',
        thumbnail: 'thumbnails/faq/6.png',
        category: 'faq',
        keywords: ['faq', 'historik', 'punonjës']
    },
    {
        id: 'FJRa-8wYtXE',
        title: 'Si të ndajmë shërbimet për bizneset nga ato personale ?',
        description: 'Si të ndajmë shërbimet për bizneset nga ato personale ?',
        thumbnail: 'thumbnails/faq/7.png',
        category: 'faq',
        keywords: ['faq', 'shërbime', 'biznes']
    },
    {
        id: 'DYTGG5oPyNU',
        title: 'Si të regjistrojmë në sistem 1 minoren ?',
        description: 'Si të regjistrojmë në sistem 1 minoren ?',
        thumbnail: 'thumbnails/faq/8.png',
        category: 'faq',
        keywords: ['faq', 'regjistrim', 'minoren']
    },
    {
        id: 'lq94N_eXU-8',
        title: 'Hapja e llogarisë së biznesit',
        description: 'Hapja e llogarisë së biznesit',
        thumbnail: 'thumbnails/faq/9.png',
        category: 'faq',
        keywords: ['faq', 'llogari', 'biznes']
    },
    {
        id: 'eEi5_mEVQu8',
        title: 'Si të veproj që certifikata elektronike të gjenerohet brënda 2 orëve ?',
        description: 'Si të veproj që certifikata elektronike të gjenerohet brënda 2 orëve ?',
        thumbnail: 'thumbnails/faq/10.png',
        category: 'faq',
        keywords: ['faq', 'certifikatë', 'elektronike']
    },
    {
        id: 'hFWi7tXdAow',
        title: 'Si të shkakrojm ekstraktin historik të biznesit ?',
        description: 'Si të shkakrojm ekstraktin historik të biznesit ?',
        thumbnail: 'thumbnails/faq/11.png',
        category: 'faq',
        keywords: ['faq', 'ekstrakt', 'historik']
    },
    {
        id: 'KtWNgQt2oZw',
        title: 'Shkarkimi i niptit të biznesit me vulë digjitale',
        description: 'Shkarkimi i niptit të biznesit me vulë digjitale',
        thumbnail: 'thumbnails/faq/12.png',
        category: 'faq',
        keywords: ['faq', 'nipt', 'vulë']
    },
    {
        id: 'OS7urEptpbA',
        title: 'Si të shkarkojmë detyrimet e biznesit në kohë reale ?',
        description: 'Si të shkarkojmë detyrimet e biznesit në kohë reale ?',
        thumbnail: 'thumbnails/faq/13.png',
        category: 'faq',
        keywords: ['faq', 'detyrime', 'biznes']
    },
    {
        id: 'bKi--7hVvjA',
        title: 'Shtimi i përgjegjësisë tatimore Tatim mbi fitimin',
        description: 'Shtimi i përgjegjësisë tatimore Tatim mbi fitimin',
        thumbnail: 'thumbnails/faq/14.png',
        category: 'faq',
        keywords: ['faq', 'tatim', 'fitim']
    },
    {
        id: '5O0VVqeZttg',
        title: 'Si të shkakrojm kontributet shoqërore në vite ?',
        description: 'Si të shkakrojm kontributet shoqërore në vite ?',
        thumbnail: 'thumbnails/faq/15.png',
        category: 'faq',
        keywords: ['faq', 'kontribute', 'shoqërore']
    },
    {
        id: '8_KkwsPnGdk',
        title: 'Shtimi i përgjegjësisë tatimore Tatimi mbi pagën',
        description: 'Shtimi i përgjegjësisë tatimore Tatimi mbi pagën',
        thumbnail: 'thumbnails/faq/16.png',
        category: 'faq',
        keywords: ['faq', 'tatim', 'pagë']
    },
    {
        id: 'vGXio0FlW-M',
        title: 'Si të shkarkojmë një vërtetim që nuk kemi biznes ?',
        description: 'Si të shkarkojmë një vërtetim që nuk kemi biznes ?',
        thumbnail: 'thumbnails/faq/17.png',
        category: 'faq',
        keywords: ['faq', 'vërtetim', 'biznes']
    },
    {
        id: '2kAqRUS7CK8',
        title: 'Si të shkarkoj dëshminë e penalitetit online dhe falas ?',
        description: 'Si të shkarkoj dëshminë e penalitetit online dhe falas ?',
        thumbnail: 'thumbnails/faq/18.png',
        category: 'faq',
        keywords: ['faq', 'dëshmi', 'penalitet']
    },
    {
        id: 'k4B27-YJ-ZI',
        title: 'Si të ndryshoj statusin e regjistrimit të biznesit ?',
        description: 'Si të ndryshoj statusin e regjistrimit të biznesit ?',
        thumbnail: 'thumbnails/faq/19.png',
        category: 'faq',
        keywords: ['faq', 'status', 'regjistrim']
    },
    {
        id: 'Mk8l0J_bdBU',
        title: 'Shtimi i përgjegjësisë tatimore TVSH',
        description: 'Shtimi i përgjegjësisë tatimore TVSH',
        thumbnail: 'thumbnails/faq/20.png',
        category: 'faq',
        keywords: ['faq', 'tvsh', 'tatim']
    },

    // Bilanci videos (20 videos)
    {
        id: '60jZKH9q_RA',
        title: 'Si të bëj ndryshimin e adresës se biznesit nga e albania ?',
        description: 'Si të bëj ndryshimin e adresës se biznesit nga e albania ?',
        thumbnail: 'thumbnails/e-albania/1.png',
        category: 'bilanci',
        keywords: ['ndryshimi', 'adresës', 'biznesit', 'bilanci']
    },
    {
        id: 'rsROpcHbT_Y',
        title: 'Si të shtoj përgjegjësinë tatim i mbajtur në burim për bizneset nga e albania',
        description: 'Si të shtoj përgjegjësinë tatim i mbajtur në burim për bizneset nga e albania ?',
        thumbnail: 'thumbnails/e-albania/2.png',
        category: 'bilanci',
        keywords: ['tatim', 'bizneset', 'bilanci']
    },
    {
        id: 'TnCy5Qze1pI',
        title: 'Si të ndryshoj përgjegjësitë tatimore të biznesit nga e-Albania?',
        description: 'Si të ndryshoj përgjegjësitë tatimore të biznesit nga e-Albania?',
        thumbnail: 'thumbnails/e-albania/3.png',
        category: 'bilanci',
        keywords: ['tatimore', 'biznesit', 'bilanci']
    },
    {
        id: 'nHipbjjsGMM',
        title: 'Gjenerimi i vërtetimeve për biznesin',
        description: 'Gjenerimi i vërtetimeve për biznesin',
        thumbnail: 'thumbnails/e-albania/4.png',
        category: 'bilanci',
        keywords: ['vërtetim', 'biznes', 'bilanci']
    },
    {
        id: 'R9-YZqG5ue0',
        title: 'Aplikimi për leje dhe licenca',
        description: 'Aplikimi për leje dhe licenca',
        thumbnail: 'thumbnails/e-albania/5.png',
        category: 'bilanci',
        keywords: ['leje', 'licenca', 'bilanci']
    },
    {
        id: 'farGSJaxhoc',
        title: 'Deklarimi i kontributeve të sigurimeve',
        description: 'Deklarimi i kontributeve të sigurimeve',
        thumbnail: 'thumbnails/e-albania/6.png',
        category: 'bilanci',
        keywords: ['kontribute', 'sigurime', 'bilanci']
    },
    {
        id: 'TRbIIOoEZbQ',
        title: 'Ndryshimi i të dhënave të biznesit',
        description: 'Ndryshimi i të dhënave të biznesit',
        thumbnail: 'thumbnails/e-albania/7.png',
        category: 'bilanci',
        keywords: ['ndryshim', 'biznes', 'bilanci']
    },
    {
        id: 'p2DWTp84Y8o',
        title: 'Aplikimi për sigurime shoqërore',
        description: 'Aplikimi për sigurime shoqërore',
        thumbnail: 'thumbnails/e-albania/8.png',
        category: 'bilanci',
        keywords: ['sigurime', 'shoqërore', 'bilanci']
    },
    {
        id: 'swiJ7_cCUVs',
        title: 'Deklarimi i tatimit mbi fitimin',
        description: 'Deklarimi i tatimit mbi fitimin',
        thumbnail: 'thumbnails/e-albania/9.png',
        category: 'bilanci',
        keywords: ['tatim', 'fitim', 'bilanci']
    },
    {
        id: 'RS9fHh0E4ZU',
        title: 'Aplikimi për rimbursim TVSH',
        description: 'Aplikimi për rimbursim TVSH',
        thumbnail: 'thumbnails/e-albania/10.png',
        category: 'bilanci',
        keywords: ['rimbursim', 'tvsh', 'bilanci']
    },
    {
        id: 'hFg2NT2Wg3I',
        title: 'Deklarimi i listëpagesave',
        description: 'Deklarimi i listëpagesave',
        thumbnail: 'thumbnails/e-albania/11.png',
        category: 'bilanci',
        keywords: ['listëpagesa', 'deklarim', 'bilanci']
    },
    {
        id: 'wykIcscHuCA',
        title: 'Aplikimi për autorizime',
        description: 'Aplikimi për autorizime',
        thumbnail: 'thumbnails/e-albania/12.png',
        category: 'bilanci',
        keywords: ['autorizim', 'aplikim', 'bilanci']
    },
    {
        id: 'GkuNeCUOrHU',
        title: 'Deklarimi i bilancit vjetor',
        description: 'Deklarimi i bilancit vjetor',
        thumbnail: 'thumbnails/e-albania/13.png',
        category: 'bilanci',
        keywords: ['bilanc', 'vjetor', 'deklarim']
    },
    {
        id: 'Ak7Wvs3xUbs',
        title: 'Aplikimi për certifikata biznesi',
        description: 'Aplikimi për certifikata biznesi',
        thumbnail: 'thumbnails/e-albania/14.png',
        category: 'bilanci',
        keywords: ['certifikata', 'biznes', 'bilanci']
    },
    {
        id: 'ybt_J0JZEvg',
        title: 'Si të ndryshojmë veprimtarinë e biznesit nga e albania ?',
        description: 'Si të ndryshojmë veprimtarinë e biznesit nga e albania ?',
        thumbnail: 'thumbnails/e-albania/15.png',
        category: 'bilanci',
        keywords: ['veprimtari', 'biznes', 'bilanci']
    },
    {
        id: 'Be0QhWTDE5I',
        title: 'Si të pajisemi me kartë shëndeti online nga e-Albania?',
        description: 'Si të pajisemi me kartë shëndeti online nga e-Albania?',
        thumbnail: 'thumbnails/e-albania/16.png',
        category: 'bilanci',
        keywords: ['kartë', 'shëndeti', 'bilanci']
    },
    {
        id: '7OuUMfVOdHE',
        title: 'Aplikimi për leje ndërtimi për biznesin',
        description: 'Aplikimi për leje ndërtimi për biznesin',
        thumbnail: 'thumbnails/e-albania/17.png',
        category: 'bilanci',
        keywords: ['leje', 'ndërtimi', 'bilanci']
    },
    {
        id: 'Y8zqHvDSc2w',
        title: 'Aplikimi për leje ndërtimi për biznesin',
        description: 'Aplikimi për leje ndërtimi për biznesin',
        thumbnail: 'thumbnails/e-albania/18.png',
        category: 'bilanci',
        keywords: ['leje', 'ndërtimi', 'bilanci']
    },
    {
        id: 'woA-1tcLslg',
        title: 'Aplikimi për leje ndërtimi për biznesin',
        description: 'Aplikimi për leje ndërtimi për biznesin',
        thumbnail: 'thumbnails/e-albania/19.png',
        category: 'bilanci',
        keywords: ['leje', 'ndërtimi', 'bilanci']
    },
    {
        id: 'YSASpXSzINw',
        title: 'Aplikimi për hapje të degës së re të biznesit',
        description: 'Aplikimi për hapje të degës së re të biznesit',
        thumbnail: 'thumbnails/e-albania/20.png',
        category: 'bilanci',
        keywords: ['degë', 'biznes', 'bilanci']
    }
];

// Add Template Data
const templateData = [
    {
        id: 'word-templates',
        title: 'Template Word te gjeneruar',
        description: 'Template Word te gjeneruar per bizneset',
        thumbnail: 'thumbnails/temp te gatshme/1.jpg',
        category: 'template',
        type: 'template',
        url: 't-word.html',
        keywords: ['word', 'template', 'biznes', 'dokument']
    },
    {
        id: 'excel-templates',
        title: 'Template Excel te gjeneruar',
        description: 'Template Excel te gjeneruar per bizneset',
        thumbnail: 'thumbnails/temp te gatshme/2.png',
        category: 'template',
        type: 'template',
        url: 't-excel.html',
        keywords: ['excel', 'template', 'biznes', 'spreadsheet']
    },
    {
        id: 'bilanc-generator',
        title: 'Gjenerimi i bilancit tatimor dhe ruajtja ne database',
        description: 'Ky webapp do tju sherben per gjenerimin e bilancit tatimor dhe ruajtjen e tij ne database',
        thumbnail: 'thumbnails/temp te gatshme/3.png',
        category: 'template',
        type: 'template',
        url: 'tutorials/selfcare.html',
        keywords: ['bilanc', 'tatimor', 'database', 'gjenerim']
    }
];

// Add Q&A Data
const qaData = [
    // Aplikimet e Biznesit në e-Albania
    {
        id: 'qa-aplikime-1',
        title: 'Si të shkarkojmë një vërtetim që nuk kemi detyrime biznesi?',
        description: 'Procedura e plotë për të shkarkuar vërtetimin që nuk kemi detyrime biznesi nga e-Albania',
        answer: `Për të shkarkuar vërtetimin që nuk kemi detyrime biznesi, ndiqni këto hapa:

1. Hyni në platformën e-Albania
2. Shkoni tek seksioni i shërbimeve për biznesin
3. Kërkoni shërbimin "Vërtetim për detyrime tatimore"
4. Zgjidhni biznesin për të cilin dëshironi vërtetimin
5. Plotësoni periudhën për të cilën kërkoni vërtetimin
6. Konfirmoni kërkesën
7. Shkarkoni vërtetimin në format PDF

Vini re:
- Vërtetimi gjenerohet menjëherë
- Ka vlefshmëri 30 ditë
- Përmban vulë elektronike
- Pranohet nga të gjitha institucionet`,
        category: 'Aplikimet e Biznesit në e-Albania',
        type: 'qa',
        url: 'qa-categories/aplikime-biznesit.html',
        keywords: ['vërtetim', 'detyrime', 'biznes', 'e-albania', 'aplikim']
    },
    {
        id: 'qa-aplikime-2',
        title: 'Si të bëj ndryshimin e adresës se biznesit nga e albania?',
        description: 'Udhëzues i detajuar për ndryshimin e adresës së biznesit përmes platformës e-Albania',
        answer: `Për të ndryshuar adresën e biznesit përmes e-Albania, ndiqni këto hapa:

1. Identifikimi në e-Albania:
   - Hyni në llogarinë tuaj në e-Albania
   - Shkoni tek seksioni i shërbimeve për biznesin

2. Gjetja e shërbimit:
   - Kërkoni "Aplikim për ndryshime në QKB"
   - Zgjidhni biznesin për të cilin do bëni ndryshimin

3. Plotësimi i formularit:
   - Zgjidhni opsionin "Ndryshim adrese"
   - Plotësoni adresën e re të biznesit
   - Specifikoni nëse është adresë kryesore apo dytësore
   - Ngarkoni dokumentet mbështetëse (kontratë qiraje ose pronësie)

4. Konfirmimi:
   - Kontrolloni të dhënat e plotësuara
   - Nënshkruani elektronikisht (nëse kërkohet)
   - Dërgoni aplikimin

5. Pas aplikimit:
   - Ruani numrin e aplikimit
   - Ndryshimi reflektohet brenda 24 orëve
   - Mund të shkarkoni ekstraktin e ri të QKB-së

Shënim i rëndësishëm:
- Sigurohuni që adresa e re është e saktë
- Mbani parasysh që ndryshimi i adresës mund të kërkojë përditësime në institucione të tjera
- Ruani dokumentacionin mbështetës për referencë të mëvonshme`,
        category: 'Aplikimet e Biznesit në e-Albania',
        type: 'qa',
        url: 'qa-categories/aplikime-biznesit.html',
        keywords: ['ndryshim', 'adresë', 'biznes', 'e-albania', 'aplikim']
    },

    // Tarifat Vendore & Bashkiake
    {
        id: 'qa-tarifa-1',
        title: 'Si llogariten tarifat vendore për biznesin?',
        description: 'Informacion i detajuar për llogaritjen e tarifave vendore dhe bashkiake për bizneset',
        answer: `Llogaritja e tarifave vendore për biznesin bëhet bazuar në disa kritere:

1. Kriteret bazë të llogaritjes:
   - Xhiroja vjetore e biznesit
   - Vendndodhja e biznesit (zona A, B, C)
   - Lloji i aktivitetit
   - Sipërfaqja e biznesit
   - Numri i punonjësve

2. Tarifat kryesore që aplikohen:
   - Tarifa e pastrimit
   - Tarifa e ndriçimit
   - Tarifa e gjelbërimit
   - Tarifa e tabelës
   - Tarifa e zënies së hapësirës publike (nëse aplikohet)

3. Mënyra e llogaritjes:
   - Çdo bashki ka vendimin e saj për tarifat
   - Llogaritja bëhet në bazë vjetore
   - Pagesa mund të bëhet me këste
   - Aplikohen zbritje për pagesat e plota vjetore

4. Afatet e pagesës:
   - Kësti i parë: deri më 20 prill
   - Kësti i dytë: deri më 20 korrik
   - Kësti i tretë: deri më 20 tetor

5. Dokumentacioni i nevojshëm:
   - NIPT-i i biznesit
   - Ekstrakti i QKB-së
   - Kontrata e qirasë/pronësisë
   - Deklarata e xhiros vjetore

Këshilla të rëndësishme:
- Kontrolloni vendimin e bashkisë për tarifat aktuale
- Ruani faturat e pagesave
- Bëni pagesat në kohë për të shmangur gjobat
- Informoni bashkinë për çdo ndryshim në aktivitetin e biznesit`,
        category: 'Tarifat Vendore & Bashkiake',
        type: 'qa',
        url: 'qa-categories/tarifat-vendore.html',
        keywords: ['tarifa', 'vendore', 'bashkiake', 'llogaritje']
    },

    // Tarifat Vendore & Bashkiake (continued)
    {
        id: 'qa-tarifa-2',
        title: 'Si të paguaj tarifat vendore online?',
        description: 'Udhëzues i detajuar për pagesën online të tarifave vendore për bizneset',
        answer: `Për të paguar tarifat vendore online, ndiqni këto hapa:

1. Përgatitja për pagesë:
   - Sigurohuni që keni NIPT-in e biznesit
   - Kontrolloni shumën e detyrimit
   - Përgatitni kartën bankare për pagesë

2. Procedura e pagesës:
   - Hyni në portalin e-Albania
   - Shkoni tek seksioni "Shërbimet për Biznesin"
   - Zgjidhni "Pagesa e Tarifave Vendore"
   - Plotësoni formularin me:
     * NIPT-in e biznesit
     * Periudhën e pagesës
     * Llojin e tarifës

3. Konfirmimi i pagesës:
   - Kontrolloni shumën për pagesë
   - Plotësoni të dhënat e kartës
   - Konfirmoni pagesën
   - Ruani mandatin elektronik

4. Pas pagesës:
   - Shkarkoni mandatin e pagesës
   - Ruajeni për referencë
   - Kontrolloni reflektimin në sistem

Këshilla të rëndësishme:
- Bëni pagesën para afatit për të shmangur gjobat
- Ruani mandatet për çdo pagesë
- Kontrolloni rregullisht detyrimet
- Mbani evidencë të pagesave të kryera`,
        category: 'Tarifat Vendore & Bashkiake',
        type: 'qa',
        url: 'qa-categories/tarifat-vendore.html',
        keywords: ['tarifa', 'vendore', 'pagesë', 'online']
    },

    // Deklarimi i TVSH-së
    {
        id: 'qa-tvsh-1',
        title: 'Si të plotësoj deklaratën e TVSH-së?',
        description: 'Udhëzues i detajuar për plotësimin e deklaratës së TVSH-së',
        answer: `Plotësimi i deklaratës së TVSH-së kërkon këto hapa:

1. Përgatitja e dokumentacionit:
   - Libri i shitjeve të periudhës
   - Libri i blerjeve të periudhës
   - Faturat tatimore të shitjeve/blerjeve
   - Dokumentet mbështetëse

2. Hyrja në sistem:
   - Logohuni në e-filing
   - Zgjidhni "Deklarata e TVSH-së"
   - Zgjidhni periudhën tatimore

3. Plotësimi i deklaratës:
   a) Shitjet:
      - Plotësoni shitjet me TVSH 20%
      - Plotësoni shitjet me TVSH 6%
      - Plotësoni eksportet (0%)
      - Plotësoni përjashtimet
   
   b) Blerjet:
      - Plotësoni blerjet me TVSH 20%
      - Plotësoni blerjet me TVSH 6%
      - Plotësoni importet
      - Plotësoni investimet

4. Kontrolli dhe dorëzimi:
   - Verifikoni saktësinë e të dhënave
   - Kontrolloni llogaritjet
   - Konfirmoni deklaratën
   - Ruani kopjen e deklaratës

Afatet e rëndësishme:
- Dorëzimi: Deri më datë 14 të muajit pasardhës
- Pagesa: Brenda të njëjtit afat
- Deklarimi zero: I detyrueshëm edhe pa aktivitet

Këshilla për shmangien e gabimeve:
- Kontrolloni përputhshmërinë me librat
- Verifikoni dyfish llogaritjet
- Ruani dokumentacionin mbështetës
- Konsultohuni me kontabilistin për paqartësi`,
        category: 'Deklarimi i TVSH-së',
        type: 'qa',
        url: 'qa-categories/deklarimi-tvsh.html',
        keywords: ['tvsh', 'deklaratë', 'tatim', 'plotësim']
    },

    // Sigurimet Shoqërore dhe Shëndetësore
    {
        id: 'qa-sigurime-1',
        title: 'Si të deklaroj sigurimet e punonjësve?',
        description: 'Informacion i detajuar për deklarimin e sigurimeve shoqërore dhe shëndetësore të punonjësve',
        answer: `Deklarimi i sigurimeve të punonjësve përfshin këto hapa:

1. Përgatitja e listëpagesës:
   - Mbledhja e të dhënave të punonjësve
   - Llogaritja e pagave bruto
   - Përcaktimi i ditëve të punës
   - Identifikimi i ndryshimeve (punësime/largime)

2. Hyrja në sistemin e deklarimit:
   - Logohuni në e-filing
   - Zgjidhni "E-Sig 027"
   - Përzgjidhni muajin për deklarim

3. Plotësimi i deklaratës:
   Për çdo punonjës duhet të plotësohen:
   - Numri personal (ID)
   - Ditët e punës
   - Paga bruto
   - Pozicioni i punës
   - Kategoria e sigurimeve
   - Data e fillimit/mbarimit (nëse ka)

4. Kontrollet e nevojshme:
   - Verifikimi i pagës minimale
   - Kontrolli i numrit të ditëve
   - Saktësia e periudhës së punësimit
   - Përputhja me kontratat

5. Dorëzimi dhe pagesa:
   - Afati i dorëzimit: Deri më 20 të muajit pasardhës
   - Afati i pagesës: Brenda të njëjtit afat
   - Ruajtja e kopjes së deklaratës
   - Gjenerimi i urdhër-pagesës

Raste të veçanta:
1. Punonjës me leje lindje:
   - Plotësimi i formularit të posaçëm
   - Bashkëngjitja e dokumentacionit
   
2. Punonjës me paaftësi:
   - Deklarimi i ditëve të paaftësisë
   - Llogaritja e përfitimit

3. Ndryshime në listëpagesë:
   - Deklarimi i ndryshimeve
   - Plotësimi i formularit përkatës

Këshilla të rëndësishme:
- Mbani evidencë të saktë të prezencës
- Ruani dokumentacionin mbështetës
- Respektoni afatet e deklarimit
- Kontrolloni dyfish të dhënat
- Konsultohuni për raste specifike`,
        category: 'Sigurimet Shoqërore dhe Shëndetësore',
        type: 'qa',
        url: 'qa-categories/sigurimet.html',
        keywords: ['sigurime', 'shoqërore', 'shëndetësore', 'deklarim', 'listëpagesë']
    },

    // Tatimi në Burim
    {
        id: 'qa-tatim-burim-1',
        title: 'Si të deklaroj tatimin në burim?',
        description: 'Udhëzues i detajuar për deklarimin e tatimit në burim',
        answer: `Deklarimi i tatimit në burim përfshin këto hapa dhe informacione:

1. Çfarë përfshin tatimi në burim:
   - Qiratë
   - Dividendët
   - Shërbimet teknike
   - Të ardhurat e jorezidentëve
   - Pagesat për të drejtat e autorit

2. Përgatitja për deklarim:
   - Mbledhja e faturave/dokumenteve
   - Identifikimi i pagesave që i nënshtrohen tatimit
   - Llogaritja e shumave përkatëse
   - Përgatitja e listës së përfituesve

3. Procedura e deklarimit:
   a) Hyrja në sistem:
      - Logohuni në e-filing
      - Zgjidhni formularin e tatimit në burim
      - Përzgjidhni periudhën
   
   b) Plotësimi i deklaratës:
      - Të dhënat e përfituesit
      - Lloji i të ardhurës
      - Shuma bruto
      - Përqindja e tatimit
      - Shuma e tatimit

4. Afatet dhe pagesat:
   - Deklarimi: Deri më 20 të muajit pasardhës
   - Pagesa: Brenda të njëjtit afat
   - Deklarimi zero: I detyrueshëm nëse nuk ka transaksione

5. Dokumentacioni i nevojshëm:
   - Kontratat e qirasë
   - Faturat tatimore
   - Vendimet e dividendëve
   - Dokumentet e pagesave

Raste specifike:
1. Qiratë:
   - Tatimi: 15% e shumës bruto
   - Deklarohet për çdo kontratë
   - Përjashtimet duhen dokumentuar

2. Dividendët:
   - Tatimi: 8% e shumës bruto
   - Kërkohet vendimi i asamblesë
   - Deklarohet për çdo përfitues

3. Shërbimet teknike:
   - Identifikimi i shërbimeve që përfshihen
   - Dokumentimi i natyrës së shërbimit
   - Aplikimi i normës së duhur

Këshilla të rëndësishme:
- Mbani evidencë të saktë të pagesave
- Ruani dokumentacionin justifikues
- Respektoni afatet e deklarimit
- Verifikoni llogaritjet përpara dorëzimit
- Konsultohuni për raste të veçanta`,
        category: 'Tatimi në Burim',
        type: 'qa',
        url: 'qa-categories/tatimi-burim.html',
        keywords: ['tatim', 'burim', 'deklarim', 'qira', 'dividend']
    },

    // Bilanci Vjetor
    {
        id: 'qa-bilanc-1',
        title: 'Si të përgatit bilancin vjetor?',
        description: 'Udhëzues i detajuar për përgatitjen dhe dorëzimin e bilancit vjetor',
        answer: `Përgatitja dhe dorëzimi i bilancit vjetor përfshin këto hapa:

1. Përgatitja paraprake:
   a) Mbledhja e dokumentacionit:
      - Librat e shitjeve dhe blerjeve
      - Ekstraktet bankare
      - Inventarët fizikë
      - Kartelat e aktiveve
      - Listëpagesat vjetore
      - Deklaratat tatimore

   b) Kontrollet fillestare:
      - Rakordimi i llogarive
      - Verifikimi i transaksioneve
      - Kontrolli i amortizimeve
      - Inventarizimi i aktiveve

2. Plotësimi i pasqyrave financiare:
   a) Bilanci:
      - Aktivet afatshkurtra
      - Aktivet afatgjata
      - Detyrimet afatshkurtra
      - Detyrimet afatgjata
      - Kapitali

   b) Pasqyra e të ardhurave:
      - Të ardhurat nga aktiviteti
      - Shpenzimet operative
      - Shpenzimet financiare
      - Rezultati tatimor

   c) Pasqyra e fluksit të parasë:
      - Aktiviteti operativ
      - Aktiviteti investues
      - Aktiviteti financiar

3. Dokumentet shoqëruese:
   - Shënimet shpjeguese
   - Relacioni i administratorit
   - Vendimi i asamblesë
   - Raporti i audituesit (nëse kërkohet)

4. Procedura e dorëzimit:
   a) Në QKB:
      - Përgatitja e dokumenteve
      - Nënshkrimi elektronik
      - Ngarkimi në sistem
      - Pagesa e tarifës

   b) Në DPT:
      - Deklarata e tatim fitimit
      - Pasqyrat financiare
      - Dokumentet mbështetëse

5. Afatet kryesore:
   - Mbyllja e vitit: 31 dhjetor
   - Dorëzimi në QKB: Deri 31 korrik
   - Dorëzimi në DPT: Deri 31 mars

Këshilla të rëndësishme:
- Filloni përgatitjen me kohë
- Dokumentoni çdo rregullim
- Ruani kopje të të gjitha dokumenteve
- Konsultohuni me ekspertë për çështje komplekse
- Verifikoni përputhshmërinë me standardet
- Kontrolloni dyfish të gjitha llogaritjet`,
        category: 'Bilanci Vjetor',
        type: 'qa',
        url: 'qa-categories/bilanci-vjetor.html',
        keywords: ['bilanc', 'vjetor', 'pasqyra', 'financiare', 'dorëzim']
    },

    // Regjistrimi i Biznesit të Ri
    {
        id: 'qa-regjistrim-1',
        title: 'Si të regjistroj një biznes të ri?',
        description: 'Udhëzues i detajuar për regjistrimin e një biznesi të ri në Shqipëri',
        answer: `Regjistrimi i një biznesi të ri përfshin këto hapa:

1. Përgatitja paraprake:
   a) Vendimmarrja për:
      - Formën ligjore të biznesit
      - Emrin e biznesit
      - Objektin e aktivitetit
      - Kapitalin fillestar
      - Strukturën e pronësisë

   b) Dokumentet e nevojshme:
      - Dokumentet e identifikimit
      - Dokumenti i pronësisë/qirasë së selisë
      - Kapitali fillestar (për SHA/SHPK)
      - Statuti dhe akti i themelimit

2. Procedura e regjistrimit në QKB:
   a) Aplikimi online:
      - Hyni në portalin e-Albania
      - Zgjidhni "Aplikim për regjistrim fillestar"
      - Plotësoni formularin elektronik
      - Ngarkoni dokumentet e kërkuara

   b) Të dhënat që duhen plotësuar:
      - Të dhënat e pronarit/ortakëve
      - Adresa e selisë
      - Kapitali themeltar
      - Administratori
      - Aktivitetet ekonomike (NACE)

3. Pas regjistrimit:
   a) Dokumentet që merren:
      - Certifikata e regjistrimit
      - NUIS/NIPT
      - Ekstrakti i regjistrit tregtar

   b) Veprime të mëtejshme:
      - Hapja e llogarisë bankare
      - Regjistrimi në tatime
      - Regjistrimi për sigurime shoqërore
      - Aplikimi për autorizime specifike

4. Detyrimet fillestare:
   - Regjistrimi i punonjësve
   - Zgjedhja e regjimit tatimor
   - Përgatitja e vulës së biznesit
   - Instalimi i sistemit fiskal (nëse kërkohet)

5. Afatet dhe kostot:
   - Koha e procesimit: 1-2 ditë pune
   - Tarifa e regjistrimit: Sipas formës ligjore
   - Kapitali minimal: Varion sipas llojit të biznesit
   - Kostot noteriale (nëse ka)

Këshilla të rëndësishme:
- Konsultohuni me ekspertë para regjistrimit
- Verifikoni disponueshmërinë e emrit
- Sigurohuni për saktësinë e dokumenteve
- Ruani kopje të të gjitha dokumenteve
- Informohuni për detyrimet tatimore
- Planifikoni kostot fillestare`,
        category: 'Regjistrimi i Biznesit',
        type: 'qa',
        url: 'qa-categories/regjistrimi-biznesit.html',
        keywords: ['regjistrim', 'biznes', 'QKB', 'NIPT', 'fillim']
    },

    // Çregjistrimi i Biznesit
    {
        id: 'qa-cregjistrim-1',
        title: 'Si të çregjistrojmë një biznes?',
        description: 'Procedura e plotë për çregjistrimin e një biznesi',
        answer: `Çregjistrimi i një biznesi përfshin këto hapa dhe procedura:

1. Përgatitja për çregjistrim:
   a) Kontrollet paraprake:
      - Verifikimi i detyrimeve tatimore
      - Kontrolli i detyrimeve ndaj të tretëve
      - Mbyllja e marrëdhënieve të punës
      - Mbyllja e kontratave të qirasë

   b) Dokumentet e nevojshme:
      - Vendimi i asamblesë për mbyllje
      - Bilanci përfundimtar
      - Raporti i likuidatorit
      - Vërtetimi për shlyerjen e detyrimeve

2. Procedura në Tatime:
   a) Deklarimi përfundimtar:
      - Dorëzimi i deklaratave të prapambetura
      - Pagesa e detyrimeve të mbetura
      - Mbyllja e llogarive tatimore
      - Çregjistrimi i TVSH-së (nëse ka)

   b) Dokumentacioni në DPT:
      - Kërkesa për çregjistrim
      - Bilanci i mbylljes
      - Deklaratat e fundit
      - Vërtetimi i pagesave

3. Procedura në QKB:
   a) Aplikimi online:
      - Hyni në e-Albania
      - Zgjidhni "Aplikim për çregjistrim"
      - Plotësoni formularin
      - Ngarkoni dokumentet

   b) Faza e likuidimit:
      - Emërimi i likuidatorit
      - Inventarizimi i aseteve
      - Shlyerja e detyrimeve
      - Raporti përfundimtar

4. Detyrime të tjera:
   - Mbyllja e llogarive bankare
   - Çregjistrimi nga sigurimet shoqërore
   - Ndërprerja e kontratave të shërbimeve
   - Arkivimi i dokumentacionit

5. Afatet dhe vëmendja:
   - Publikimi i njoftimit: 30 ditë
   - Periudha e likuidimit: sipas nevojës
   - Ruajtja e dokumenteve: 10 vjet
   - Afati i ankimimit: 30 ditë

Këshilla të rëndësishme:
- Planifikoni procesin me kujdes
- Konsultohuni me ekspertë kontabël
- Ruani të gjithë dokumentacionin
- Verifikoni të gjitha detyrimet
- Informoni të gjithë kreditorët
- Mbani procesverbale të vendimeve`,
        category: 'Çregjistrimi i Biznesit',
        type: 'qa',
        url: 'qa-categories/cregjistrim-biznesit.html',
        keywords: ['çregjistrim', 'mbyllje', 'likuidim', 'biznes']
    },

    // Ndryshimi i Përgjegjësive Tatimore
    {
        id: 'qa-pergjegjesi-1',
        title: 'Si të ndryshoj përgjegjësitë tatimore të biznesit?',
        description: 'Udhëzues i detajuar për ndryshimin e përgjegjësive tatimore të biznesit',
        answer: `Ndryshimi i përgjegjësive tatimore të biznesit përfshin këto hapa:

1. Llojet e përgjegjësive tatimore:
   a) Përgjegjësitë kryesore:
      - TVSH
      - Tatim fitimi
      - Tatim i thjeshtuar mbi fitimin
      - Tatimi mbi të ardhurat personale
      - Kontributet e sigurimeve shoqërore dhe shëndetësore

   b) Kriteret për ndryshim:
      - Xhiro vjetore
      - Natyra e aktivitetit
      - Numri i punonjësve
      - Kërkesa specifike të biznesit

2. Procedura e ndryshimit në e-Albania:
   a) Përgatitja:
      - Hyni në portalin e-Albania
      - Identifikoni shërbimin përkatës
      - Përgatitni dokumentacionin

   b) Aplikimi:
      - Zgjidhni "Kërkesë për ndryshim përgjegjësie"
      - Plotësoni formularin
      - Specifikoni përgjegjësitë që doni të shtoni/hiqni
      - Ngarkoni dokumentet mbështetëse

3. Dokumentacioni i nevojshëm:
   - Ekstrakti i QKB-së
   - Bilanci i vitit të fundit
   - Deklaratat tatimore
   - Dokumentet justifikuese për ndryshimin

4. Afatet dhe procedurat:
   a) Për regjistrim në TVSH:
      - Detyrimisht: Kur xhiro kalon 10 milionë lekë
      - Vullnetarisht: Në çdo kohë
      - Efekti: Nga muaji pasardhës

   b) Për tatim fitimi:
      - Detyrimisht: Xhiro mbi 14 milionë lekë
      - Afati: Para fillimit të vitit fiskal
      - Efekti: Nga viti i ri fiskal

5. Detyrimet pas ndryshimit:
   - Përshtatja e sistemit të faturimit
   - Trajnimi i stafit
   - Përditësimi i dokumentacionit
   - Deklarime të reja periodike

Këshilla të rëndësishme:
- Analizoni impaktin financiar
- Konsultohuni me ekspertë
- Planifikoni kohën e ndryshimit
- Informoni partnerët tregtarë
- Ruani dokumentacionin
- Monitoroni afatet e deklarimit`,
        category: 'Përgjegjësitë Tatimore',
        type: 'qa',
        url: 'qa-categories/pergjegjesi-tatimore.html',
        keywords: ['përgjegjësi', 'tatimore', 'ndryshim', 'tvsh', 'tatim']
    },

    // Deklarimi i Punonjësve
    {
        id: 'qa-punonjes-1',
        title: 'Si të deklaroj një punonjës të ri?',
        description: 'Procedura e plotë për deklarimin e një punonjësi të ri në sistemin e tatimeve',
        answer: `Deklarimi i një punonjësi të ri përfshin këto hapa dhe procedura:

1. Përgatitja e dokumentacionit:
   a) Dokumentet e punonjësit:
      - Kartë identiteti
      - CV dhe diploma
      - Librezë shëndetësore (sipas pozicionit)
      - Libreza e punës (nëse ka)

   b) Dokumentet e punësimit:
      - Kontrata e punës
      - Përshkrimi i pozicionit
      - Formulari i deklarimit
      - Dokumentet e sigurimeve shoqërore

2. Procedura e deklarimit online:
   a) Në sistemin e tatimeve:
      - Hyni në e-filing
      - Zgjidhni "E-Sig 027"
      - Plotësoni të dhënat e punonjësit
      - Specifikoni datën e fillimit

   b) Të dhënat që duhen plotësuar:
      - Të dhënat personale
      - Pozicioni i punës
      - Paga bruto
      - Orari i punës
      - Kategoria e sigurimeve

3. Afatet dhe detyrimet:
   a) Afatet kohore:
      - Para fillimit të punës
      - Jo më vonë se 24 orë nga fillimi
      - Brenda muajit për listëpagesën

   b) Detyrimet financiare:
      - Llogaritja e pagës
      - Sigurimet shoqërore
      - Tatimi mbi të ardhurat
      - Sigurimet shëndetësore

4. Raste specifike:
   a) Punonjës me kohë të pjesshme:
      - Specifikimi i orëve
      - Llogaritja proporcionale
      - Dokumentimi i orarit

   b) Punonjës të huaj:
      - Leja e punës
      - Dokumentet e qëndrimit
      - Verifikimi i lejeve

5. Pas deklarimit:
   - Konfirmimi i regjistrimit
   - Printimi i formularit
   - Arkivimi i dokumenteve
   - Informimi i punonjësit

Këshilla të rëndësishme:
- Verifikoni saktësinë e të dhënave
- Respektoni afatet ligjore
- Ruani kopje të dokumenteve
- Informoni punonjësin për detyrimet
- Monitoroni periudhën e provës
- Mbani evidencë të ndryshimeve`,
        category: 'Deklarimi i Punonjësve',
        type: 'qa',
        url: 'qa-categories/deklarimi-punonjesve.html',
        keywords: ['punonjës', 'deklarim', 'sigurime', 'kontratë', 'punësim']
    },

    // Faturimi Elektronik
    {
        id: 'qa-faturim-1',
        title: 'Si të lëshoj fatura elektronike?',
        description: 'Udhëzues i detajuar për lëshimin e faturave elektronike',
        answer: `Lëshimi i faturave elektronike përfshin këto hapa dhe procedura:

1. Përgatitja për faturim elektronik:
   a) Regjistrimi në platformë:
      - Hyni në platformën e-Albania
      - Zgjidhni shërbimin e fiskalizimit
      - Plotësoni të dhënat e biznesit
      - Merrni kredencialet

   b) Zgjedhja e metodës së faturimit:
      - Platforma qendrore e faturimit
      - Softuer i certifikuar
      - Zgjidhje të integruara
      - Operatorë fiskalë

2. Procedura e lëshimit të faturës:
   a) Në platformën qendrore:
      - Hyni në platformë
      - Zgjidhni "Faturë e re"
      - Plotësoni të dhënat e blerësit
      - Shtoni artikujt/shërbimet
      - Aplikoni TVSH-në (nëse ka)
      - Gjeneroni faturën

   b) Elementët e detyrueshëm:
      - NIPT-i i shitësit dhe blerësit
      - Data dhe numri i faturës
      - Përshkrimi i mallrave/shërbimeve
      - Çmimi dhe sasia
      - TVSH-ja (nëse aplikohet)
      - Vlera totale

3. Raste specifike:
   a) Fatura për individë:
      - Plotësimi i NIPT-it të blerësit opsional
      - Kërkesa për NIPT personal
      - Ruajtja e të dhënave personale

   b) Fatura për eksport:
      - Specifikimi i llojit të furnizimit
      - Dokumentacioni shoqërues
      - Aplikimi i TVSH-së 0%

4. Korrigjimi dhe anulimi:
   - Procedura e korrigjimit
   - Afatet për korrigjim
   - Dokumentimi i ndryshimeve
   - Ruajtja e gjurmëve

5. Detyrime të tjera:
   - Ruajtja e faturave
   - Raportimi periodik
   - Backup i të dhënave
   - Monitorimi i statuseve

Këshilla të rëndësishme:
- Kontrolloni të dhënat para lëshimit
- Ruani kopje të faturave
- Monitoroni dërgesat
- Verifikoni konfirmimet
- Mbani evidencë të saktë
- Trajnoni stafin përkatës`,
        category: 'Faturimi Elektronik',
        type: 'qa',
        url: 'qa-categories/faturim-elektronik.html',
        keywords: ['faturë', 'elektronike', 'fiskalizim', 'tvsh']
    },

    // Ndryshimi i Adresës
    {
        id: 'qa-adrese-1',
        title: 'Si të ndryshoj adresën e biznesit?',
        description: 'Procedura e plotë për ndryshimin e adresës së biznesit',
        answer: `Ndryshimi i adresës së biznesit përfshin këto hapa:

1. Përgatitja e dokumentacionit:
   a) Dokumentet e nevojshme:
      - Kontrata e qirasë/pronësisë
      - Vërtetim nga pronari
      - Planimetria e ambientit
      - Fotografi të ambientit

   b) Dokumentet shtesë:
      - Leja e bashkisë (nëse kërkohet)
      - Licenca për aktivitetin
      - Dokumentet e sigurisë
      - Miratime specifike

2. Procedura në e-Albania:
   a) Aplikimi online:
      - Hyni në e-Albania
      - Zgjidhni "Aplikim për ndryshime"
      - Plotësoni formularin
      - Ngarkoni dokumentet

   b) Të dhënat që duhen plotësuar:
      - Adresa e re e plotë
      - Lloji i ndryshimit (kryesor/sekondar)
      - Arsyeja e ndryshimit
      - Data e fillimit

3. Njoftimet e nevojshme:
   a) Institucionet:
      - Drejtoria e Tatimeve
      - Bashkia
      - Banka
      - Sigurimet shoqërore

   b) Palët e treta:
      - Klientët
      - Furnitorët
      - Partnerët
      - Punonjësit

4. Veprime pas miratimit:
   - Përditësimi i dokumentacionit
   - Ndryshimi i vulave
   - Përditësimi i materialeve
   - Sistemimi i ambientit

5. Afatet dhe kostot:
   - Koha e procesimit: 2-3 ditë
   - Tarifa e aplikimit
   - Kostot noteriale
   - Shpenzime të tjera

Këshilla të rëndësishme:
- Planifikoni ndryshimin me kujdes
- Verifikoni përshtatshmërinë e lokalit
- Siguroni dokumentet e nevojshme
- Informoni të gjitha palët
- Ruani kopje të dokumenteve
- Monitoroni procesin`
    }
];

// Update ContentIndexer class
class ContentIndexer {
    constructor() {
        this.contentIndex = {
            videos: videoData,
            templates: templateData,
            qa: qaData,
            // Add more content types
            pages: [
                {
                    id: 'home',
                    title: 'Kreu',
                    description: 'Faqja kryesore e Edustation',
                    url: 'index.html',
                    type: 'page',
                    category: 'main'
                },
                {
                    id: 'tutorials',
                    title: 'Tutoriale',
                    description: 'Tutoriale dhe udhëzues për përdorimin e platformave të ndryshme',
                    url: 'tutorials.html',
                    type: 'page',
                    category: 'main'
                },
                {
                    id: 'qa',
                    title: 'Pyetje & Pergjigje',
                    description: 'Pyetje dhe përgjigje të shpeshta për tema të ndryshme',
                    url: 'q_and_a.html',
                    type: 'page',
                    category: 'main'
                },
                {
                    id: 'template',
                    title: 'Template',
                    description: 'Template të gatshme për bizneset',
                    url: 'template.html',
                    type: 'page',
                    category: 'main'
                },
                {
                    id: 'bilanci',
                    title: 'Bilanci',
                    description: 'Informacion dhe udhëzime për bilancin',
                    url: 'bilanci.html',
                    type: 'page',
                    category: 'main'
                },
                {
                    id: 'trajnime',
                    title: 'Trajnime',
                    description: 'Trajnime dhe kurse të ndryshme',
                    url: 'trajnime.html',
                    type: 'page',
                    category: 'main'
                }
            ],
            categories: [
                {
                    id: 'e-albania',
                    title: 'E-Albania',
                    description: 'Të gjitha shërbimet dhe udhëzimet për e-Albania',
                    type: 'category',
                    subcategories: ['aplikime', 'sherbime', 'dokumente']
                },
                {
                    id: 'tatime',
                    title: 'Tatime',
                    description: 'Informacione për tatimet dhe deklaratat tatimore',
                    type: 'category',
                    subcategories: ['tvsh', 'tatim-fitimi', 'sigurime']
                },
                {
                    id: 'biznese',
                    title: 'Biznese',
                    description: 'Informacione për menaxhimin e biznesit',
                    type: 'category',
                    subcategories: ['regjistrim', 'deklarime', 'raporte']
                }
            ]
        };
        this.initialize();
    }

    async initialize() {
        await this.indexContent();
        console.log('Content indexing completed');
    }

    async indexContent() {
        try {
            // Additional dynamic content indexing if needed
            const dynamicTutorials = document.querySelectorAll('.tutorial-item, [data-content-type="tutorial"]');
            const dynamicQA = document.querySelectorAll('.qa-item, [data-content-type="qa"]');
            const dynamicTemplates = document.querySelectorAll('.template-item, [data-content-type="template"]');

            // Add any dynamically found content to the existing data
            if (dynamicTutorials.length > 0) {
                dynamicTutorials.forEach(element => {
                    this.contentIndex.videos.push({
                        id: element.id || `tut-${this.contentIndex.videos.length + 1}`,
                        title: element.querySelector('h2, h3, .title')?.textContent || '',
                        description: element.querySelector('p, .description')?.textContent || '',
                        category: 'tutorials',
                        type: 'tutorial',
                        url: element.dataset.url || element.querySelector('a')?.href || '',
                        keywords: (element.dataset.keywords || '').split(',').map(k => k.trim())
                    });
                });
            }

            if (dynamicQA.length > 0) {
                dynamicQA.forEach(element => {
                    this.contentIndex.qa.push({
                        id: element.id || `qa-${this.contentIndex.qa.length + 1}`,
                        title: element.querySelector('h2, h3, .question')?.textContent || '',
                        description: element.querySelector('p, .answer')?.textContent || '',
                        category: 'q_and_a',
                        type: 'qa',
                        url: element.dataset.url || window.location.pathname + '#' + element.id,
                        keywords: (element.dataset.keywords || '').split(',').map(k => k.trim())
                    });
                });
            }

            if (dynamicTemplates.length > 0) {
                dynamicTemplates.forEach(element => {
                    this.contentIndex.templates.push({
                        id: element.id || `temp-${this.contentIndex.templates.length + 1}`,
                        title: element.querySelector('h2, h3, .title')?.textContent || '',
                        description: element.querySelector('p, .description')?.textContent || '',
                        category: 'templates',
                        type: 'template',
                        url: element.dataset.url || element.querySelector('a')?.href || '',
                        keywords: (element.dataset.keywords || '').split(',').map(k => k.trim())
                    });
                });
            }
        } catch (error) {
            console.error('Error indexing content:', error);
        }
    }

    // Calculate similarity between two strings
    calculateSimilarity(str1, str2) {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
        
        if (str1 === str2) return 1.0;
        if (str1.includes(str2) || str2.includes(str1)) return 0.8;
        
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        let matches = 0;
        words1.forEach(word1 => {
            words2.forEach(word2 => {
                if (this.levenshteinDistance(word1, word2) <= 2) {
                    matches++;
                }
            });
        });
        
        return matches / Math.max(words1.length, words2.length);
    }

    // Calculate Levenshtein distance between two strings
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j - 1] + 1,
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }

    // Get related terms for a given word
    getRelatedTerms(word) {
        const relatedTerms = {
            'albania': ['e-albania', 'ealbania', 'sherbime', 'portal', 'qeveritar'],
            'e': ['elektronik', 'electronic', 'online', 'digital', 'virtual'],
            'si': ['how', 'tutorial', 'guide', 'udhëzues', 'mënyrë', 'si duhet'],
            'aplikim': ['application', 'apply', 'submit', 'register', 'regjistrim', 'dërgoj'],
            'deklarim': ['declare', 'submit', 'report', 'file', 'raportim', 'dorëzim'],
            'biznes': ['business', 'company', 'firm', 'enterprise', 'kompani', 'ndërmarrje'],
            'tatim': ['tax', 'fiscal', 'payment', 'duty', 'taksë', 'pagesë'],
            'dokument': ['document', 'form', 'paper', 'file', 'formular', 'letër'],
            'punonjes': ['employee', 'worker', 'staff', 'personnel', 'punëtor', 'personel'],
            'pagese': ['payment', 'pay', 'fee', 'charge', 'pagesë', 'tarifë'],
            'adrese': ['address', 'location', 'place', 'vendndodhje', 'vend'],
            'fature': ['invoice', 'bill', 'receipt', 'faturë', 'kupon'],
            'certifikate': ['certificate', 'document', 'proof', 'vërtetim', 'dokument'],
            'regjistrim': ['registration', 'enroll', 'sign up', 'regjistrimi', 'abonim'],
            'ndryshim': ['change', 'modify', 'update', 'modifikim', 'përditësim'],
            'detyrim': ['obligation', 'duty', 'debt', 'borxh', 'pagesë'],
            'sigurime': ['insurance', 'security', 'coverage', 'mbulim', 'mbrojtje'],
            'sherbim': ['service', 'help', 'assistance', 'support', 'ndihmë'],
            'portal': ['website', 'platform', 'site', 'web', 'online']
        };

        const wordLower = word.toLowerCase();
        let related = new Set([wordLower]);

        // Add exact matches from the related terms
        Object.entries(relatedTerms).forEach(([key, values]) => {
            if (key === wordLower || values.includes(wordLower) || 
                key.includes(wordLower) || wordLower.includes(key)) {
                related.add(key);
                values.forEach(v => related.add(v));
            }
        });

        // Add similar terms based on Levenshtein distance
        Object.entries(relatedTerms).forEach(([key, values]) => {
            if (this.levenshteinDistance(key, wordLower) <= 2) {
                related.add(key);
                values.forEach(v => related.add(v));
            }
        });

        return Array.from(related);
    }

    search(query) {
        // Normalize the search query
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            return [];
        }

        let allResults = [];

        // Search through all content types
        Object.entries(this.contentIndex).forEach(([contentType, items]) => {
            const results = items.filter(item => {
                const titleLower = item.title?.toLowerCase() || '';
                const descriptionLower = item.description?.toLowerCase() || '';
                const categoryLower = item.category?.toLowerCase() || '';
                const subcategories = item.subcategories?.map(sub => sub.toLowerCase()) || [];
                const answer = item.answer?.toLowerCase() || '';
                
                // Search in all text fields
                return titleLower.includes(searchTerm) || 
                       descriptionLower.includes(searchTerm) ||
                       categoryLower.includes(searchTerm) ||
                       subcategories.some(sub => sub.includes(searchTerm)) ||
                       answer.includes(searchTerm);
            }).map(item => ({
                ...item,
                score: 100, // All matches get same score since we're doing basic matching
                contentType
            }));

            allResults = [...allResults, ...results];
        });

        // Add dynamic content from the page
        const dynamicContent = this.getDynamicContent();
        const dynamicResults = dynamicContent.filter(item => {
            const textLower = item.text.toLowerCase();
            return textLower.includes(searchTerm);
        }).map(item => ({
            ...item,
            score: 100,
            contentType: 'dynamic'
        }));

        allResults = [...allResults, ...dynamicResults];

        return allResults;
    }

    getDynamicContent() {
        // Get all text content from the current page
        const content = [];
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, .content');
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text) {
                content.push({
                    id: `dynamic-${content.length}`,
                    title: element.tagName === 'P' ? text.substring(0, 50) + '...' : text,
                    description: text,
                    text: text,
                    type: 'content',
                    category: 'dynamic',
                    url: window.location.pathname + '#' + (element.id || '')
                });
            }
        });

        return content;
    }
}

// Initialize content indexer
let contentIndexer;
document.addEventListener('DOMContentLoaded', () => {
    contentIndexer = new ContentIndexer();
});

// Modified search handler
function handleSearch(event) {
    if (event) {
        event.preventDefault();
    }
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm) {
        console.log('Search term:', searchTerm); // Debug log
        
        // Store the search term in sessionStorage
        sessionStorage.setItem('lastSearch', searchTerm);
        
        // Initialize content indexer if not already initialized
        if (!contentIndexer) {
            contentIndexer = new ContentIndexer();
        }
        
        // Perform search and store results
        const results = contentIndexer.search(searchTerm);
        console.log('Search results:', results); // Debug log
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        
        // Fix the URL path (remove leading slash)
        window.location.href = `search-results.html?q=${encodeURIComponent(searchTerm)}`;
    }
}

// Modified display results function
function displaySearchResults() {
    console.log('displaySearchResults called');
    
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) {
        console.error('searchResults element not found');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q')?.toLowerCase() || sessionStorage.getItem('lastSearch');
    console.log('Retrieved search term:', searchTerm);
    
    let results = [];
    try {
        const storedResults = sessionStorage.getItem('searchResults');
        console.log('Stored results:', storedResults);
        results = storedResults ? JSON.parse(storedResults) : [];
        
        if (!results.length && searchTerm) {
            console.log('No stored results, performing new search');
            if (!contentIndexer) {
                contentIndexer = new ContentIndexer();
            }
            results = contentIndexer.search(searchTerm);
        }
    } catch (error) {
        console.error('Error parsing search results:', error);
    }
    
    if (!searchTerm) {
        window.location.href = 'index.html';
        return;
    }
    
    const searchQueryElement = document.getElementById('searchQuery');
    if (searchQueryElement) {
        searchQueryElement.textContent = searchTerm;
    }

    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        if (results.length > 0) {
            countElement.textContent = `${results.length} rezultate u gjetën`;
        } else {
            countElement.textContent = `0 asnje resultat u gjet`;
        }
    }

    searchResults.innerHTML = '';

    // Display all results without grouping
    results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.setAttribute('data-type', result.type || 'content');
        
        let cardContent = '';
        if (result.thumbnail) {
            cardContent = `
                <div class="video-thumbnail">
                    <img src="${result.thumbnail}" alt="${result.title}">
                </div>`;
        } else {
            cardContent = `
                <div class="content-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>`;
        }

        resultCard.innerHTML = `
            ${cardContent}
            <div class="result-content">
                <h3>${result.title}</h3>
                <p class="result-description">${result.description}</p>
                <div class="result-meta">
                    <span class="result-type">${result.type || 'page'}</span>
                    ${result.category ? `<span class="result-category">${result.category}</span>` : ''}
                </div>
                ${result.type === 'qa' ? `
                    <div class="qa-answer" style="display: none;">
                        <hr>
                        <h4>Përgjigje e plotë:</h4>
                        <div class="answer-content">
                            ${result.answer || result.description}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        resultCard.addEventListener('click', () => {
            if (result.type === 'video' || !result.type) {
                const modal = document.querySelector('.video-modal');
                if (modal) {
                    const player = modal.querySelector('.youtube-player');
                    player.src = `https://www.youtube.com/embed/${result.id}?autoplay=1`;
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            } else if (result.type === 'qa') {
                const qaAnswer = resultCard.querySelector('.qa-answer');
                if (qaAnswer) {
                    qaAnswer.style.display = qaAnswer.style.display === 'none' ? 'block' : 'none';
                    resultCard.classList.toggle('expanded');
                }
            } else if (result.url) {
                window.location.href = result.url;
            }
        });
        
        searchResults.appendChild(resultCard);
    });
}

// Initialize search results if on search page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('search-results.html')) {
        displaySearchResults();
    }
});

// Matrix Animation
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixRain');
        this.ctx = this.canvas.getContext('2d');
        this.characters = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789'.split('');
        this.fontSize = 16;
        this.columns = 0;
        this.drops = [];
        this.init();
        window.addEventListener('resize', () => this.init());
        this.animate();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#0F0';
        this.ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.characters[Math.floor(Math.random() * this.characters.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            // Add white color for first character in each column
            if (Math.random() > 0.975) {
                this.ctx.fillStyle = '#FFF';
            } else {
                this.ctx.fillStyle = '#0F0';
            }

            this.ctx.fillText(text, x, y);

            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the matrix rain effect
document.addEventListener('DOMContentLoaded', () => {
    new MatrixRain();
});

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