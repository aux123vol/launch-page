// Lazy loading implementation for images
(function() {
    'use strict';

    // Check if browser supports Intersection Observer
    if ('IntersectionObserver' in window) {
        // Use native Intersection Observer for better performance
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            // Load images when they're 50px from entering viewport
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observe all images with loading="lazy"
        function observeImages() {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => {
                img.classList.add('loading');
                imageObserver.observe(img);
            });
        }

        // Load image function
        function loadImage(img) {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            
            img.onload = () => {
                img.classList.remove('loading');
                img.classList.add('loaded');
                if (img.parentElement.classList.contains('img-container')) {
                    img.parentElement.classList.add('loaded');
                }
            };
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeImages);
        } else {
            observeImages();
        }

        // Also observe new images added dynamically
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const newImages = node.querySelectorAll ? node.querySelectorAll('img[loading="lazy"]') : [];
                        newImages.forEach(img => {
                            img.classList.add('loading');
                            imageObserver.observe(img);
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

    } else {
        // Fallback for older browsers
        function loadAllImages() {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                img.removeAttribute('loading');
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadAllImages);
        } else {
            loadAllImages();
        }
    }

    // Preload critical images (above the fold)
    function preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');
        criticalImages.forEach(img => {
            if (img.dataset.src) {
                const preloadImg = new Image();
                preloadImg.onload = () => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                };
                preloadImg.src = img.dataset.src;
            }
        });
    }

    // Preload critical images immediately
    preloadCriticalImages();

})();