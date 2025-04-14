document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const setNavHeight = () => {
            const navHeight = navbar.offsetHeight;
            document.documentElement.style.setProperty('--navbar-height', `${navHeight}px`);
        };
        setNavHeight();
        window.addEventListener('resize', setNavHeight);
    }

    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        const main = document.querySelector('main');

        if (window.scrollY > 50) {
            navbar.classList.add('navbar-small');
            main.style.marginTop = '100px';
        } else {
            navbar.classList.remove('navbar-small');
            main.style.removeProperty('margin-top');
        }

        if (window.innerWidth > 768) {
            const adElement = document.querySelector('aside ins.adsbygoogle');
            if (adElement) {
                if (window.scrollY) {
                    adElement.style.position = 'fixed';
                    adElement.style.top = '114px';
                } else {
                    adElement.style.position = 'relative';
                }
            }
        }
    });

    // Custom Carousel Implementation
    const carousel = document.getElementById('videoCarousel');
    if (carousel) {
        const track = carousel.querySelector('.carousel-track');
        const items = carousel.getElementsByClassName('carousel-item');
        const dots = carousel.getElementsByClassName('dot');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const slideCount = dots.length;
        let currentIndex = 0;
        let isAnimating = false;

        // Add lazy loading functions
        function createIframe(url) {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.title = 'Video content';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            return iframe;
        }

        function lazyLoadVideo(slide) {
            const placeholder = slide.querySelector('.video-placeholder');
            if (!placeholder) return;

            const videoUrl = placeholder.dataset.videoUrl;
            if (!videoUrl || placeholder.querySelector('iframe')) return;

            const iframe = createIframe(videoUrl);
            iframe.addEventListener('load', () => {
                iframe.classList.add('loaded');
                placeholder.querySelector('.loading-spinner')?.remove();
            });
            
            placeholder.appendChild(iframe);
        }

        function showTitle(slide, show = true, immediate = false) {
            const title = slide.querySelector('.video-title');
            if (title) {
                if (immediate) {
                    title.style.transition = 'none';
                }
                title.style.opacity = show ? '1' : '0';
                title.style.transform = show ? 'translateX(0)' : 'translateX(-20px)';
                if (immediate) {
                    void title.offsetWidth; // Force reflow
                    title.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                }
            }
        }

        function updateUI(index) {
            const normalizedIndex = ((index % slideCount) + slideCount) % slideCount;
            
            // Update dots
            Array.from(dots).forEach(dot => dot.classList.remove('active'));
            dots[normalizedIndex].classList.add('active');

            // Update slides and handle lazy loading
            Array.from(items).forEach((item, i) => {
                item.classList.remove('active');
                showTitle(item, false);
                
                if (i === index + 1) { // Current slide
                    item.classList.add('active');
                    showTitle(item, true);
                    lazyLoadVideo(item);
                } else if (i === index + 2 || i === index) { // Adjacent slides
                    lazyLoadVideo(item);
                }
            });
        }

        function initializeCarousel() {
            // Set initial transform without transition
            track.style.transition = 'none';
            track.style.transform = 'translateX(-100%)';
            
            // Initialize first slide
            const firstSlide = items[1]; // First real slide (after clone)
            if (firstSlide) {
                firstSlide.classList.add('active');
                showTitle(firstSlide, true, true); // true for immediate effect
                lazyLoadVideo(firstSlide);
            }

            // Preload adjacent slides
            if (items[0]) lazyLoadVideo(items[0]); // Last clone
            if (items[2]) lazyLoadVideo(items[2]); // Second slide

            // Re-enable transitions after initial setup
            void track.offsetWidth; // Force reflow
            track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        function resetSlidePosition(index, immediate = false) {
            const newPosition = -(index + 1) * 100;
            if (immediate) {
                track.style.transition = 'none';
                track.style.transform = `translateX(${newPosition}%)`;
                void track.offsetWidth; // Force reflow
                track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            } else {
                track.style.transform = `translateX(${newPosition}%)`;
            }
        }

        function showSlide(index) {
            if (isAnimating) return;
            isAnimating = true;

            updateUI(index);
            resetSlidePosition(index);

            const handleTransitionEnd = () => {
                track.removeEventListener('transitionend', handleTransitionEnd);
                
                if (index >= slideCount) {
                    currentIndex = 0;
                    resetSlidePosition(currentIndex, true);
                    
                    // Update UI for first slide
                    requestAnimationFrame(() => {
                        const firstSlide = items[1];
                        Array.from(items).forEach(item => {
                            item.classList.remove('active');
                            showTitle(item, false, true);
                        });
                        firstSlide.classList.add('active');
                        showTitle(firstSlide, true, true);
                        updateUI(0);
                    });
                } else if (index < 0) {
                    currentIndex = slideCount - 1;
                    resetSlidePosition(currentIndex, true);
                    
                    // Update UI for last slide
                    requestAnimationFrame(() => {
                        const lastSlide = items[slideCount];
                        Array.from(items).forEach(item => {
                            item.classList.remove('active');
                            showTitle(item, false, true);
                        });
                        lastSlide.classList.add('active');
                        showTitle(lastSlide, true, true);
                        updateUI(slideCount - 1);
                    });
                } else {
                    currentIndex = index;
                }
                
                isAnimating = false;
            };

            track.addEventListener('transitionend', handleTransitionEnd);
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        // Event Listeners
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);

        // Dot navigation
        Array.from(dots).forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (!isAnimating && index !== currentIndex) {
                    showSlide(index);
                }
            });
        });

        // Initialize carousel immediately after setup
        initializeCarousel();
        let autoAdvanceTimer = null;

        // Start auto-advance after a delay
        setTimeout(() => {
            autoAdvanceTimer = setInterval(() => {
                if (!isAnimating) {
                    nextSlide();
                }
            }, 3000);
        }, 1000);

        // Cleanup on page unload
        window.addEventListener('unload', () => {
            if (autoAdvanceTimer) {
                clearInterval(autoAdvanceTimer);
            }
        });
    }
});
