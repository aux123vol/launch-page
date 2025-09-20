// Mission Signup Functionality
class MissionSignup {
  constructor() {
    this.apiBaseUrl = window.location.origin;
    this.signupCount = 0;
    this.init();
  }

  async init() {
    await this.loadSignupCount();
    this.setupEventListeners();
    this.updateCountDisplay();
  }

  async loadSignupCount() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/mission/count`);
      if (response.ok) {
        const data = await response.json();
        this.signupCount = data.count || 0;
      }
    } catch (error) {
      console.error('Failed to load signup count:', error);
      this.signupCount = 47; // Fallback number to create some FOMO
    }
  }

  updateCountDisplay() {
    // Update all elements with signup count
    const countElements = document.querySelectorAll('[data-signup-count]');
    countElements.forEach(el => {
      el.textContent = this.signupCount;
    });

    // Update FOMO messages
    const fomoElements = document.querySelectorAll('[data-fomo-message]');
    fomoElements.forEach(el => {
      el.innerHTML = `🚀 <strong>${this.signupCount} creators</strong> have already joined the mission!`;
    });
  }

  setupEventListeners() {
    // Find all Join Mission forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Look for forms with Join Mission submit buttons
      const submitBtn = form.querySelector('input[value*="Join mission"], input[value*="join mission"], button[data-mission-signup]');
      if (submitBtn) {
        form.addEventListener('submit', (e) => this.handleFormSubmit(e, form));
      }
    });

    // Handle standalone Join Mission buttons
    const joinButtons = document.querySelectorAll('a[href="#"], .button[href="#"]');
    joinButtons.forEach(btn => {
      if (btn.textContent.toLowerCase().includes('join') || btn.textContent.toLowerCase().includes('mission')) {
        btn.addEventListener('click', (e) => this.handleJoinButtonClick(e));
      }
    });
  }

  async handleFormSubmit(event, form) {
    event.preventDefault();
    
    const formData = new FormData(form);
    const email = formData.get('email-2') || formData.get('email') || formData.get('Email');
    
    if (!email) {
      this.showMessage('Please enter a valid email address.', 'error');
      return;
    }

    await this.submitSignup(email, form);
  }

  handleJoinButtonClick(event) {
    event.preventDefault();
    // Create a simple email prompt for standalone buttons
    const email = prompt('Enter your email to join the mission:');
    if (email && email.includes('@')) {
      this.submitSignup(email);
    }
  }

  async submitSignup(email, form = null) {
    try {
      // Show loading state
      const submitBtn = form?.querySelector('input[type="submit"], button[type="submit"]');
      const originalText = submitBtn?.value || submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.tagName === 'INPUT') {
          submitBtn.value = 'Joining...';
        } else {
          submitBtn.textContent = 'Joining...';
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/api/mission/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        // Success!
        this.signupCount = data.signupCount || this.signupCount + 1;
        this.updateCountDisplay();
        
        this.showMessage(`🎉 Welcome to the mission! You're creator #${this.signupCount}`, 'success');
        
        // Hide form and show success state
        if (form) {
          form.style.display = 'none';
          this.showSuccessMessage(form);
        }
        
        // Track analytics if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'mission_signup', {
            event_category: 'engagement',
            event_label: 'email_signup'
          });
        }
      } else if (response.status === 409) {
        // Already signed up
        this.showMessage('You\'re already part of the mission! Check your email for updates.', 'info');
      } else {
        throw new Error(data.message || 'Failed to join mission');
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.showMessage('Oops! Something went wrong. Please try again.', 'error');
    } finally {
      // Restore button
      const submitBtn = form?.querySelector('input[type="submit"], button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitBtn.tagName === 'INPUT') {
          submitBtn.value = originalText || 'Join Mission';
        } else {
          submitBtn.textContent = originalText || 'Join Mission';
        }
      }
    }
  }

  showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('mission-signup-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'mission-signup-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(messageEl);
    }

    // Style based on type
    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      info: '#3b82f6'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;
    messageEl.innerHTML = message;
    messageEl.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
      if (messageEl) {
        messageEl.style.display = 'none';
      }
    }, 5000);
  }

  showSuccessMessage(form) {
    const successEl = document.createElement('div');
    successEl.innerHTML = `
      <div style="text-align: center; padding: 30px; background: #f0fdf4; border-radius: 8px; border: 2px solid #22c55e;">
        <h3 style="color: #15803d; margin: 0 0 10px 0;">🎉 Welcome to the Mission!</h3>
        <p style="color: #166534; margin: 0;">You're now part of an exclusive community of <strong>${this.signupCount} creators</strong> shaping the future of storytelling!</p>
        <p style="color: #166534; margin: 10px 0 0 0; font-size: 14px;">Check your email for next steps.</p>
      </div>
    `;
    form.parentNode.insertBefore(successEl, form.nextSibling);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MissionSignup());
} else {
  new MissionSignup();
}