// Instagram-style Progressive Image Loading
class ProgressiveImageLoader {
  constructor() {
    // Prevent multiple instances
    if (window.progressiveLoaderInitialized) return;
    window.progressiveLoaderInitialized = true;
    
    this.images = document.querySelectorAll('.progressive-img');
    this.imageObserver = null;
    this.init();
  }

  init() {
    // Use IntersectionObserver for efficient viewport detection
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver(
        this.loadImages.bind(this),
        { 
          rootMargin: '200px 0px', // Start loading 200px before entering viewport
          threshold: 0.01
        }
      );
      
      this.images.forEach(img => {
        // Skip if image is already loaded or if src equals fullsrc
        if (img.complete && img.dataset.fullsrc === img.src) return;
        
        // Add blur effect only to placeholder images
        const fullSrc = img.dataset.fullsrc;
        if (fullSrc && fullSrc !== img.src) {
          img.classList.add('loading');
          this.imageObserver.observe(img);
        }
      });
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }
  }

  loadImages(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.imageObserver.unobserve(entry.target);
      }
    });
  }

  loadImage(img) {
    const fullSrc = img.dataset.fullsrc;
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;
    
    if (!fullSrc || fullSrc === img.src) return;
    
    // Preload the full image
    const fullImg = new Image();
    
    fullImg.onload = () => {
      // Smoothly transition from blurred placeholder to sharp image
      img.src = fullSrc;
      if (srcset) {
        img.srcset = srcset;
      }
      if (sizes) {
        img.sizes = sizes;
      }
      
      // Remove blur effect
      img.classList.remove('loading');
      img.classList.add('loaded');
    };
    
    fullImg.onerror = () => {
      // Fallback if image fails to load
      img.classList.remove('loading');
      img.classList.add('error');
    };
    
    // Start loading the full image
    fullImg.src = fullSrc;
    if (srcset) {
      fullImg.srcset = srcset;
    }
  }

  loadAllImages() {
    // Fallback for browsers without IntersectionObserver
    this.images.forEach(img => {
      this.loadImage(img);
    });
  }
}

// Initialize once when DOM is ready
function initializeProgressiveLoader() {
  if (!window.progressiveLoaderInitialized) {
    new ProgressiveImageLoader();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProgressiveLoader);
} else {
  initializeProgressiveLoader();
}