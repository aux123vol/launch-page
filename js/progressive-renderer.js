/**
 * Instagram-style Progressive Rendering System
 * Renders top content first, then progressively loads sections as user scrolls toward them
 */

class ProgressiveRenderer {
  constructor() {
    this.rendered = new Set();
    this.loading = new Set();
    this.sections = [];
    this.preloadDistance = 200; // Load content 200px before it's visible
    this.renderDistance = 300; // Render sections 300px before visible
    this.observersEnabled = false; // Don't enable until user scrolls
    
    this.init();
  }
  
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupProgressiveRendering());
    } else {
      this.setupProgressiveRendering();
    }
  }
  
  setupProgressiveRendering() {
    console.log('🚀 Progressive Renderer: Starting Instagram-style rendering');
    
    // Define sections to render progressively
    this.identifySections();
    
    // Render only the hero section initially
    this.renderHeroSection();
    
    // Hide all non-hero sections initially (BEFORE setting up observers)
    this.hideNonHeroSections();
    
    // Setup intersection observers for progressive loading (AFTER placeholders exist)
    this.setupObservers();
    
    // Enable observers only after user starts scrolling
    this.enableObserversOnScroll();
  }
  
  identifySections() {
    // Get all sections in order and create progressive sections
    const allSections = document.querySelectorAll('section');
    this.sections = [];
    
    // First section is hero (immediate)
    if (allSections[0]) {
      this.sections.push({
        id: 'hero',
        elements: [allSections[0]],
        priority: 'immediate',
        rendered: false,
        placeholder: this.createPlaceholder({ id: 'hero' })
      });
    }
    
    // Everything else gets progressive loading
    for (let i = 1; i < allSections.length; i++) {
      const section = allSections[i];
      this.sections.push({
        id: `section-${i}`,
        elements: [section],
        priority: i < 3 ? 'high' : 'medium',
        rendered: false,
        placeholder: this.createPlaceholder({ id: `section-${i}` })
      });
    }
    
    // Also handle heavy image containers separately
    const imageContainers = document.querySelectorAll('.utility-aspect-3x2-2, .section-image-wrapper-2, .card-body-4');
    imageContainers.forEach((container, index) => {
      if (index > 2) { // Skip first few
        this.sections.push({
          id: `images-${index}`,
          elements: [container],
          priority: 'low',
          rendered: false,
          placeholder: this.createPlaceholder({ id: `images-${index}` })
        });
      }
    });
    
    console.log(`📋 Identified ${this.sections.length} sections for progressive rendering`);
  }
  
  createPlaceholder(section) {
    const placeholder = document.createElement('div');
    placeholder.className = `progressive-placeholder placeholder-${section.id}`;
    placeholder.style.cssText = `
      min-height: 400px;
      background: linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%);
      background-size: 400% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
    `;
    placeholder.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid #f0f0f0; border-top: 3px solid #999; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
        Loading ${section.id} content...
      </div>
    `;
    return placeholder;
  }
  
  renderHeroSection() {
    console.log('📍 Rendering hero section immediately');
    
    // First, hide ALL images and videos except hero
    this.hideAllMediaExceptHero();
    
    const heroSection = this.sections.find(s => s.id === 'hero');
    if (heroSection && heroSection.elements.length > 0) {
      this.renderSection(heroSection);
    }
    
    // Ensure hero images load immediately
    const heroImages = document.querySelectorAll('section:first-of-type img, .hero img, .hero-section img');
    heroImages.forEach(img => {
      if (img.loading === 'lazy') {
        img.loading = 'eager';
      }
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    });
  }
  
  hideAllMediaExceptHero() {
    console.log('🚫 Hiding all media except hero section');
    
    // Hide all images except essential nav/logo images
    const allImages = document.querySelectorAll('img');
    allImages.forEach((img) => {
      const isInHero = img.closest('section:first-of-type');
      const isNavIcon = img.closest('.nav-logo, .nav, header, .logo');
      const isSmallIcon = img.offsetWidth < 50 && img.offsetHeight < 50;
      
      // Only keep hero images and essential nav icons
      if (!isInHero && !isNavIcon && !isSmallIcon) {
        img.style.visibility = 'hidden';
        img._originalSrc = img.src;
        img._originalSrcset = img.srcset;
        img._originalSizes = img.sizes;
        
        // Replace with transparent data URI
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.dataset.hiddenForProgressive = 'true';
      }
    });
    
    // Hide all videos and remove sources
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
      video.style.visibility = 'hidden';
      video.dataset.hiddenForProgressive = 'true';
      video.preload = 'none';
      
      // Save and remove video sources
      if (video.src) {
        video.dataset.originalSrc = video.src;
        video.removeAttribute('src');
      }
      
      const sources = video.querySelectorAll('source');
      sources.forEach(source => {
        if (source.src) {
          source.dataset.originalSrc = source.src;
          source.removeAttribute('src');
        }
      });
    });
  }
  
  hideNonHeroSections() {
    this.sections.forEach(section => {
      if (section.id !== 'hero' && section.elements.length > 0) {
        section.elements.forEach(element => {
          // Store original display style
          section.originalDisplay = element.style.display || '';
          
          // Replace with placeholder
          const placeholder = section.placeholder.cloneNode(true);
          element.style.display = 'none';
          element.parentNode.insertBefore(placeholder, element);
          
          // Store reference for later removal
          element._placeholder = placeholder;
        });
      }
    });
  }
  
  setupObservers() {
    // Observer for rendering sections (further out)
    this.renderObserver = new IntersectionObserver((entries) => {
      if (!this.observersEnabled) return; // Don't render until enabled
      
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.dataset.sectionId;
          const section = this.sections.find(s => s.id === sectionId);
          if (section && !this.rendered.has(sectionId)) {
            this.scheduleRender(section);
          }
        }
      });
    }, {
      rootMargin: `${this.renderDistance}px 0px`,
      threshold: 0.01
    });
    
    // Observer for preloading content (closer)
    this.preloadObserver = new IntersectionObserver((entries) => {
      if (!this.observersEnabled) return; // Don't preload until enabled
      
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.dataset.sectionId;
          const section = this.sections.find(s => s.id === sectionId);
          if (section && !this.loading.has(sectionId)) {
            this.preloadSection(section);
          }
        }
      });
    }, {
      rootMargin: `${this.preloadDistance}px 0px`,
      threshold: 0.01
    });
    
    // Setup placeholders with observers (but they won't trigger until enabled)
    this.sections.forEach(section => {
      if (section.id !== 'hero' && section.elements.length > 0) {
        section.elements.forEach(element => {
          if (element._placeholder) {
            element._placeholder.dataset.sectionId = section.id;
            this.renderObserver.observe(element._placeholder);
            this.preloadObserver.observe(element._placeholder);
          }
        });
      }
    });
  }
  
  enableObserversOnScroll() {
    console.log('⏳ Observers disabled initially - waiting for user scroll');
    
    let scrollTimeout;
    const enableOnFirstScroll = () => {
      if (this.observersEnabled) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        console.log('📍 User scrolled - enabling progressive rendering');
        this.observersEnabled = true;
        
        // Trigger a check of current viewport to render what's visible
        window.requestAnimationFrame(() => {
          // Force a scroll event to trigger observers
          window.dispatchEvent(new Event('scroll'));
        });
      }, 100);
    };
    
    window.addEventListener('scroll', enableOnFirstScroll, { passive: true });
    window.addEventListener('wheel', enableOnFirstScroll, { passive: true });
    window.addEventListener('touchmove', enableOnFirstScroll, { passive: true });
    window.addEventListener('touchstart', enableOnFirstScroll, { passive: true });
    window.addEventListener('pointerdown', enableOnFirstScroll, { passive: true });
    window.addEventListener('keydown', enableOnFirstScroll, { passive: true });
  }
  
  scheduleRender(section) {
    if (this.rendered.has(section.id)) return;
    
    console.log(`📦 Scheduling render for section: ${section.id}`);
    
    // Use requestIdleCallback for smooth rendering
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => this.renderSection(section), { timeout: 1000 });
    } else {
      setTimeout(() => this.renderSection(section), 16);
    }
  }
  
  renderSection(section) {
    if (this.rendered.has(section.id)) return;
    
    console.log(`✨ Rendering section: ${section.id}`);
    this.rendered.add(section.id);
    
    section.elements.forEach(element => {
      // Remove placeholder and show content
      if (element._placeholder) {
        element._placeholder.remove();
        delete element._placeholder;
      }
      
      // Restore element visibility
      element.style.display = section.originalDisplay;
      
      // Add smooth fade-in animation
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });
    });
    
    // Load media in this section
    this.loadSectionMedia(section);
  }
  
  preloadSection(section) {
    if (this.loading.has(section.id)) return;
    
    console.log(`🔄 Preloading section: ${section.id}`);
    this.loading.add(section.id);
    
    // Preload critical resources without rendering
    section.elements.forEach(element => {
      const images = element.querySelectorAll('img[data-src]');
      images.forEach(img => {
        if (img.dataset.src) {
          const preloadImage = new Image();
          preloadImage.src = img.dataset.src;
        }
      });
    });
  }
  
  loadSectionMedia(section) {
    console.log(`🖼️ Loading media for section: ${section.id}`);
    
    // Load images in this section
    section.elements.forEach(element => {
      const hiddenImages = element.querySelectorAll('img[data-hidden-for-progressive="true"]');
      hiddenImages.forEach(img => {
        // Restore original src, srcset, sizes
        if (img._originalSrc) {
          img.src = img._originalSrc;
          delete img._originalSrc;
        }
        if (img._originalSrcset) {
          img.srcset = img._originalSrcset;
          delete img._originalSrcset;
        }
        if (img._originalSizes) {
          img.sizes = img._originalSizes;
          delete img._originalSizes;
        }
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        img.style.visibility = 'visible';
        img.loading = 'eager';
        delete img.dataset.hiddenForProgressive;
      });
      
      const lazyImages = element.querySelectorAll('img[data-src], img[loading="lazy"]');
      lazyImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        img.style.visibility = 'visible';
        img.loading = 'eager';
      });
      
      // Load videos in this section
      const hiddenVideos = element.querySelectorAll('video[data-hidden-for-progressive="true"]');
      hiddenVideos.forEach(video => {
        // Restore original video sources
        if (video.dataset.originalSrc) {
          video.src = video.dataset.originalSrc;
          delete video.dataset.originalSrc;
        }
        
        const sources = video.querySelectorAll('source[data-original-src]');
        sources.forEach(source => {
          source.src = source.dataset.originalSrc;
          delete source.dataset.originalSrc;
        });
        
        video.style.visibility = 'visible';
        delete video.dataset.hiddenForProgressive;
        video.load();
      });
      
      const videos = element.querySelectorAll('video[data-src]');
      videos.forEach(video => {
        if (video.dataset.src) {
          video.src = video.dataset.src;
          delete video.dataset.src;
          video.load();
        }
        
        const sources = video.querySelectorAll('source[data-src]');
        sources.forEach(source => {
          if (source.dataset.src) {
            source.src = source.dataset.src;
            delete source.dataset.src;
          }
        });
        
        if (sources.length > 0) {
          video.load();
        }
        
        video.style.visibility = 'visible';
      });
    });
  }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .progressive-placeholder {
    margin: 20px 0;
    border-radius: 8px;
  }
`;
document.head.appendChild(style);

// Initialize the progressive renderer
const progressiveRenderer = new ProgressiveRenderer();