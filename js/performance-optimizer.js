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
    this.currentlyPlayingVideo = null;
    
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
    } else {
      // Fallback for older browsers - load everything
      this.loadAllMedia();
    }
    
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
    videos.forEach(video => this.videoObserver.observe(video));
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
    if (video.dataset.src && !video.src) {
      // Load video sources
      const sources = video.querySelectorAll('source[data-src]');
      sources.forEach(source => {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
      });
      
      if (video.dataset.src) {
        video.src = video.dataset.src;
        video.removeAttribute('data-src');
      }
      
      video.load();
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