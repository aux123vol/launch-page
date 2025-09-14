/**
 * Performance optimizer for Genre AI website
 * Implements lazy loading and progressive media loading
 */

class MediaOptimizer {
  constructor() {
    this.observerOptions = {
      root: null,
      rootMargin: '50px 0px',
      threshold: 0.01
    };
    
    this.imageObserver = null;
    this.videoObserver = null;
    this.mutationObserver = null;
    this.currentlyPlayingVideo = null;
    this.processedVideos = new WeakSet();
    
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObservers());
    } else {
      this.setupObservers();
    }
  }
  
  setupObservers() {
    // Set up intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.setupImageObserver();
      this.setupVideoObserver();
      this.setupBackgroundImageObserver();
      this.setupMutationObserver();
    } else {
      // Fallback for older browsers - load everything
      this.loadAllMedia();
    }
    
    // Prepare all existing videos for lazy loading
    this.prepareAllVideosForLazyLoading();
    
    // Optimize existing media
    this.optimizeExistingMedia();
  }
  
  setupImageObserver() {
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.imageObserver.unobserve(entry.target);
        }
      });
    }, this.observerOptions);
    
    // Observe all lazy images
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    lazyImages.forEach(img => this.imageObserver.observe(img));
  }
  
  setupVideoObserver() {
    this.videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadVideo(entry.target);
        } else {
          this.pauseVideo(entry.target);
        }
      });
    }, { ...this.observerOptions, rootMargin: '100px 0px' });
    
    // Observe all videos
    const videos = document.querySelectorAll('video');
    videos.forEach(video => this.observeVideo(video));
  }
  
  setupBackgroundImageObserver() {
    const bgImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadBackgroundImage(entry.target);
          bgImageObserver.unobserve(entry.target);
        }
      });
    }, this.observerOptions);
    
    // Observe elements with background images
    const bgElements = document.querySelectorAll('[data-bg]');
    bgElements.forEach(el => bgImageObserver.observe(el));
  }
  
  setupMutationObserver() {
    // Watch for dynamically added videos (common with Webflow)
    if ('MutationObserver' in window) {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node is a video
              if (node.tagName === 'VIDEO') {
                this.prepareVideoForLazyLoading(node);
                this.observeVideo(node);
              }
              
              // Check for videos within the added node
              const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
              videos.forEach(video => {
                this.prepareVideoForLazyLoading(video);
                this.observeVideo(video);
              });
            }
          });
        });
      });
      
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  observeVideo(video) {
    // Only observe if not already processed
    if (!this.processedVideos.has(video) && this.videoObserver) {
      this.processedVideos.add(video);
      this.videoObserver.observe(video);
    }
  }
  
  prepareAllVideosForLazyLoading() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => this.prepareVideoForLazyLoading(video));
  }
  
  prepareVideoForLazyLoading(video) {
    // Skip if already processed
    if (video.dataset.lazyPrepared === 'true') {
      return;
    }
    
    // Handle videos that already have src attributes
    const sources = video.querySelectorAll('source');
    sources.forEach(source => {
      if (source.src && !source.dataset.src) {
        // Move src to data-src for lazy loading
        source.dataset.src = source.src;
        source.removeAttribute('src');
        console.log('Prepared source for lazy loading:', source.dataset.src);
      }
    });
    
    // Handle video element src
    if (video.src && !video.dataset.src) {
      video.dataset.src = video.src;
      video.removeAttribute('src');
      console.log('Prepared video for lazy loading:', video.dataset.src);
    }
    
    // Ensure preload is set to none
    video.preload = 'none';
    
    // Mark as prepared
    video.dataset.lazyPrepared = 'true';
    
    // Add placeholder if video has poster
    if (!video.style.backgroundImage && video.poster) {
      video.style.backgroundImage = `url(${video.poster})`;
      video.style.backgroundSize = 'cover';
      video.style.backgroundPosition = 'center';
    }
  }
  
  loadImage(img) {
    const src = img.dataset.src || img.src;
    const srcset = img.dataset.srcset;
    
    if (src && !img.src) {
      img.src = src;
    }
    if (srcset && !img.srcset) {
      img.srcset = srcset;
    }
    
    img.classList.add('loaded');
    
    // Remove loading placeholder
    img.style.filter = 'none';
    img.style.transition = 'filter 0.3s ease';
  }
  
  loadVideo(video) {
    // Skip if already loaded
    if (video.dataset.lazyLoaded === 'true') {
      return;
    }
    
    let hasVideoToLoad = false;
    
    // Load video sources with data-src
    const sources = video.querySelectorAll('source[data-src]');
    sources.forEach(source => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
      hasVideoToLoad = true;
    });
    
    // Load video with data-src
    if (video.dataset.src && !video.src) {
      video.src = video.dataset.src;
      video.removeAttribute('data-src');
      hasVideoToLoad = true;
    }
    
    // If we loaded any video sources, reload the video
    if (hasVideoToLoad) {
      video.load();
      video.dataset.lazyLoaded = 'true';
      console.log('Lazy loaded video:', video);
    }
  }
  
  pauseVideo(video) {
    if (video && !video.paused) {
      video.pause();
    }
  }
  
  loadBackgroundImage(element) {
    const bgUrl = element.dataset.bg;
    if (bgUrl) {
      element.style.backgroundImage = `url(${bgUrl})`;
      element.removeAttribute('data-bg');
      element.classList.add('bg-loaded');
    }
  }
  
  optimizeExistingMedia() {
    // Add loading states and transitions
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete) {
        img.style.filter = 'blur(5px)';
        img.addEventListener('load', () => {
          img.style.filter = 'none';
          img.style.transition = 'filter 0.3s ease';
        });
      }
    });
    
    // Ensure only one video plays at a time
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.addEventListener('play', () => {
        if (this.currentlyPlayingVideo && this.currentlyPlayingVideo !== video) {
          this.currentlyPlayingVideo.pause();
        }
        this.currentlyPlayingVideo = video;
      });
    });
  }
  
  // Cleanup method
  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    if (this.videoObserver) {
      this.videoObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
  
  loadAllMedia() {
    // Fallback for browsers without IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => this.loadImage(img));
    
    const lazyVideos = document.querySelectorAll('video[data-src]');
    lazyVideos.forEach(video => this.loadVideo(video));
    
    const bgElements = document.querySelectorAll('[data-bg]');
    bgElements.forEach(el => this.loadBackgroundImage(el));
  }
}

// Initialize the optimizer
const mediaOptimizer = new MediaOptimizer();