// Microprediction Book Website - Audio Player and Mobile Experience
class AudioBookPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isPaused = false;

        this.initializePlayer();
        this.setupEventListeners();
        this.buildPlaylist();
        this.setupMobileOptimizations();
    }

    initializePlayer() {
        // Get DOM elements
        this.playPauseButton = document.getElementById('playPauseButton');
        this.prevButton = document.getElementById('prevButton');
        this.nextButton = document.getElementById('nextButton');
        this.progressSlider = document.getElementById('progressSlider');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.speedSelect = document.getElementById('speedSelect');
        this.trackTitle = document.getElementById('currentTrackTitle');
        this.trackSubtitle = document.getElementById('currentTrackSubtitle');

        // Audio settings
        this.audio.volume = 0.8;
        this.audio.preload = 'metadata';
    }

    buildPlaylist() {
        const chapterCards = document.querySelectorAll('.chapter-card[data-audio]');
        this.playlist = Array.from(chapterCards).map((card, index) => {
            const audioSrc = card.dataset.audio;
            const title = card.querySelector('.chapter-content h3')?.textContent || `Chapter ${index + 1}`;
            const description = card.querySelector('.chapter-content p')?.textContent || '';

            return {
                src: audioSrc,
                title: title,
                description: description,
                element: card
            };
        });

        // Add quick listen buttons to playlist
        const quickButtons = document.querySelectorAll('.quick-chapter-btn[data-audio]');
        quickButtons.forEach(button => {
            const audioSrc = button.dataset.audio;
            const title = button.textContent;

            // Check if not already in playlist
            if (!this.playlist.find(item => item.src === audioSrc)) {
                this.playlist.push({
                    src: audioSrc,
                    title: title,
                    description: 'Quick listen',
                    element: button
                });
            }
        });
    }

    setupEventListeners() {
        // Audio element events
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.onError(e));

        // Player controls
        this.playPauseButton?.addEventListener('click', () => this.togglePlayPause());
        this.prevButton?.addEventListener('click', () => this.previousTrack());
        this.nextButton?.addEventListener('click', () => this.nextTrack());

        // Progress control
        this.progressSlider?.addEventListener('input', () => this.seek());

        // Volume control
        this.volumeSlider?.addEventListener('input', () => this.updateVolume());

        // Speed control
        this.speedSelect?.addEventListener('change', () => this.updatePlaybackRate());

        // Chapter cards
        document.querySelectorAll('.chapter-card').forEach(card => {
            card.addEventListener('click', () => this.playFromCard(card));
        });

        // Chapter play buttons
        document.querySelectorAll('.chapter-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.chapter-card');
                if (card) this.playFromCard(card);
            });
        });

        // Quick chapter buttons
        document.querySelectorAll('.quick-chapter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.playFromButton(btn));
        });

        // Navbar audio controls
        document.getElementById('playButton')?.addEventListener('click', () => this.resumeOrPlay());
        document.getElementById('pauseButton')?.addEventListener('click', () => this.pause());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupMobileOptimizations() {
        // Add touch gestures for mobile
        this.setupTouchGestures();

        // Optimize for mobile Safari
        this.optimizeForMobileSafari();

        // Add mobile-specific controls
        this.addMobileControls();
    }

    setupTouchGestures() {
        let startX = 0;
        let startY = 0;

        this.audio.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        this.audio.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // Horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.nextTrack(); // Swipe right = next
                } else {
                    this.previousTrack(); // Swipe left = previous
                }
            }

            startX = 0;
            startY = 0;
        });
    }

    optimizeForMobileSafari() {
        // Handle iOS audio restrictions
        const enableAudioOnInteraction = () => {
            if (this.audio.paused) {
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.audio.pause();
                    }).catch(() => {
                        // Ignore autoplay restrictions
                    });
                }
            }
            document.removeEventListener('touchstart', enableAudioOnInteraction);
            document.removeEventListener('click', enableAudioOnInteraction);
        };

        document.addEventListener('touchstart', enableAudioOnInteraction);
        document.addEventListener('click', enableAudioOnInteraction);
    }

    addMobileControls() {
        // Show/hide controls based on interaction
        let controlsTimeout;
        const audioSection = document.getElementById('audio');

        const showControls = () => {
            audioSection?.classList.add('controls-visible');
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(() => {
                audioSection?.classList.remove('controls-visible');
            }, 3000);
        };

        document.addEventListener('touchstart', showControls);
        document.addEventListener('mousemove', showControls);
    }

    playFromCard(card) {
        const audioSrc = card.dataset.audio;
        if (!audioSrc) return;

        const trackIndex = this.playlist.findIndex(track => track.src === audioSrc);
        if (trackIndex !== -1) {
            this.loadTrack(trackIndex);
            this.play();
            this.updateActiveCard();
        }
    }

    playFromButton(button) {
        const audioSrc = button.dataset.audio;
        if (!audioSrc) return;

        const trackIndex = this.playlist.findIndex(track => track.src === audioSrc);
        if (trackIndex !== -1) {
            this.loadTrack(trackIndex);
            this.play();
        }
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        const track = this.playlist[index];
        this.currentTrackIndex = index;

        // Update audio source
        this.audio.src = track.src;
        this.audio.load();

        // Update UI
        if (this.trackTitle) this.trackTitle.textContent = track.title;
        if (this.trackSubtitle) this.trackSubtitle.textContent = track.description;

        // Update navigation buttons
        this.updateNavigationButtons();

        // Update active state
        this.updateActiveCard();

        // Show notification
        this.showNotification(`Loading: ${track.title}`);
    }

    play() {
        if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
            this.loadTrack(0);
        }

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.isPaused = false;
            }).catch((error) => {
                console.error('Error playing audio:', error);
                this.showNotification('Unable to play audio. Please try again.');
            });
        }
    }

    pause() {
        this.audio.pause();
        this.isPaused = true;
        this.isPlaying = false;
    }

    togglePlayPause() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    resumeOrPlay() {
        if (this.isPaused) {
            this.play();
        } else if (this.currentTrackIndex === -1) {
            this.loadTrack(0);
            this.play();
        }
    }

    previousTrack() {
        if (this.currentTrackIndex > 0) {
            this.loadTrack(this.currentTrackIndex - 1);
            if (this.isPlaying) this.play();
        }
    }

    nextTrack() {
        if (this.currentTrackIndex < this.playlist.length - 1) {
            this.loadTrack(this.currentTrackIndex + 1);
            if (this.isPlaying) this.play();
        }
    }

    seek() {
        if (this.audio.duration) {
            const time = (this.progressSlider.value / 100) * this.audio.duration;
            this.audio.currentTime = time;
        }
    }

    updateVolume() {
        this.audio.volume = this.volumeSlider.value / 100;
    }

    updatePlaybackRate() {
        this.audio.playbackRate = parseFloat(this.speedSelect.value);
    }

    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;

            if (this.progressFill) {
                this.progressFill.style.width = `${progress}%`;
            }

            if (this.progressSlider) {
                this.progressSlider.value = progress;
            }

            if (this.currentTimeDisplay) {
                this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
            }
        }
    }

    updateDuration() {
        if (this.durationDisplay && this.audio.duration) {
            this.durationDisplay.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateNavigationButtons() {
        if (this.prevButton) {
            this.prevButton.disabled = this.currentTrackIndex <= 0;
        }

        if (this.nextButton) {
            this.nextButton.disabled = this.currentTrackIndex >= this.playlist.length - 1;
        }
    }

    updateActiveCard() {
        // Remove active state from all cards
        document.querySelectorAll('.chapter-card').forEach(card => {
            card.classList.remove('playing');
        });

        // Add active state to current card
        if (this.currentTrackIndex !== -1) {
            const currentTrack = this.playlist[this.currentTrackIndex];
            if (currentTrack.element && currentTrack.element.classList.contains('chapter-card')) {
                currentTrack.element.classList.add('playing');
            }
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.isPaused = false;

        // Update play button
        if (this.playPauseButton) {
            this.playPauseButton.textContent = '⏸️';
        }

        // Update navbar buttons
        const playBtn = document.getElementById('playButton');
        const pauseBtn = document.getElementById('pauseButton');
        if (playBtn) playBtn.classList.add('hidden');
        if (pauseBtn) pauseBtn.classList.remove('hidden');
    }

    onPause() {
        this.isPlaying = false;

        // Update play button
        if (this.playPauseButton) {
            this.playPauseButton.textContent = '▶️';
        }

        // Update navbar buttons
        const playBtn = document.getElementById('playButton');
        const pauseBtn = document.getElementById('pauseButton');
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (playBtn) playBtn.classList.remove('hidden');
    }

    onTrackEnded() {
        // Auto-play next track
        if (this.currentTrackIndex < this.playlist.length - 1) {
            this.nextTrack();
        } else {
            // Playlist ended
            this.isPlaying = false;
            this.isPaused = false;
            this.showNotification('Playlist completed');
        }
    }

    onError(error) {
        console.error('Audio error:', error);
        this.showNotification('Error loading audio. Please try again.');

        // Try next track if available
        if (this.currentTrackIndex < this.playlist.length - 1) {
            setTimeout(() => this.nextTrack(), 1000);
        }
    }

    handleKeyboardShortcuts(event) {
        // Don't trigger if user is typing in an input
        if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;

        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.nextTrack();
                break;
            case 'KeyM':
                event.preventDefault();
                this.audio.muted = !this.audio.muted;
                break;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'audio-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-size: 0.875rem;
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Smooth scrolling for navigation
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Intersection Observer for scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Observe elements that should animate in
    document.querySelectorAll('.chapter-card, .award-card, .testimonial-card, .press-link').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    // Create mobile menu button
    const navContainer = document.querySelector('.nav-container');
    const navLinks = document.querySelector('.nav-links');

    if (navContainer && navLinks && window.innerWidth <= 768) {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '☰';
        mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');

        mobileMenuBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-primary);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            display: none;
        `;

        navContainer.appendChild(mobileMenuBtn);

        // Mobile menu styles
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            @media (max-width: 768px) {
                .mobile-menu-btn {
                    display: block !important;
                }
                .nav-links.mobile-open {
                    display: flex !important;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: rgba(15, 23, 42, 0.98);
                    flex-direction: column;
                    padding: 1rem;
                    border-top: 1px solid var(--border);
                    backdrop-filter: blur(16px);
                }
                .nav-links.mobile-open .nav-link {
                    padding: 0.75rem;
                    text-align: center;
                    border-bottom: 1px solid var(--border);
                }
                .nav-links.mobile-open .nav-link:last-child {
                    border-bottom: none;
                }
            }
        `;
        document.head.appendChild(mobileStyles);

        // Event listeners
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navContainer.contains(e.target)) {
                navLinks.classList.remove('mobile-open');
            }
        });

        // Close menu when clicking on a link
        navLinks.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                navLinks.classList.remove('mobile-open');
            }
        });
    }
}

// Progressive Web App functionality
function setupPWA() {
    // Service worker registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swCode = `
                const CACHE_NAME = 'microprediction-book-v1';
                const urlsToCache = [
                    '/',
                    '/styles.css',
                    '/script.js',
                    '/assets/images/cotton_microprediction_3d_side.png',
                    '/assets/audio/01_front_matter.mp3',
                    '/assets/audio/Microprediction_Chapter_1.mp3'
                ];

                self.addEventListener('install', (event) => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.addAll(urlsToCache))
                    );
                });

                self.addEventListener('fetch', (event) => {
                    event.respondWith(
                        caches.match(event.request)
                            .then((response) => response || fetch(event.request))
                    );
                });
            `;

            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);

            navigator.serviceWorker.register(swUrl)
                .then(() => console.log('ServiceWorker registered'))
                .catch(() => console.log('ServiceWorker registration failed'));
        });
    }
}

// Performance monitoring
function setupPerformanceMonitoring() {
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
        }
    });
}

// Initialize everything
let audioPlayer;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize main components
    audioPlayer = new AudioBookPlayer();
    setupSmoothScrolling();
    setupScrollAnimations();
    setupMobileMenu();
    setupPWA();
    setupPerformanceMonitoring();

    // Add loading complete class
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Handle resize for mobile menu
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.remove('mobile-open');
        }
    });
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioBookPlayer };
}