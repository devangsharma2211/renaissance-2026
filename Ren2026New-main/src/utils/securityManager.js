/**
 * Security Utilities
 * Implements comprehensive security measures
 */

class SecurityManager {
  constructor() {
    this.suspiciousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\(/gi,
      /expression\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];
    
    this.sqlPatterns = [
      /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bexec\b)/gi,
      /('|"|`)+.*?(-{2}|\/\*|\*\/)/,
      /;.*?(drop|delete|update|insert)/gi,
    ];
  }

  /**
   * Disable DevTools and inspection
   */
  disableDevTools() {
    // Disable F12
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable Ctrl+Shift+I (Windows/Linux Inspector)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable Ctrl+Shift+J (Windows/Linux Console)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable Ctrl+Shift+C (Element Inspector)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable Cmd+Option+I (Mac Inspector)
    document.addEventListener('keydown', (e) => {
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable Cmd+Option+J (Mac Console)
    document.addEventListener('keydown', (e) => {
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable Cmd+Option+C (Mac Element Inspector)
    document.addEventListener('keydown', (e) => {
      if (e.metaKey && e.altKey && e.key === 'c') {
        e.preventDefault();
        console.warn('⚠️ Developer tools are disabled');
      }
    });

    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Detect DevTools open via console object
    this.detectDevToolsOpen();
  }

  /**
   * Detect if DevTools are open
   */
  detectDevToolsOpen() {
    const checkDevTools = setInterval(() => {
      const devToolsOpen = window.outerHeight - window.innerHeight > 200 ||
                           window.outerWidth - window.innerWidth > 200;

      if (devToolsOpen) {
        console.clear();
        console.log('%cAccess Denied', 'color: red; font-size: 20px; font-weight: bold;');
        // Could send alert to server about suspicious activity
        this.logSecurityEvent('devtools_open', { timestamp: new Date().toISOString() });
      }
    }, 1000);
  }

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // Remove dangerous patterns
    this.suspiciousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '');
    });

    // HTML encode
    const div = document.createElement('div');
    div.textContent = sanitized;
    return div.innerHTML;
  }

  /**
   * Validate input against SQL injection patterns
   */
  validateAgainstSQLInjection(input) {
    if (typeof input !== 'string') return true;

    for (let pattern of this.sqlPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent('sql_injection_attempt', { input: input.substring(0, 50) });
        return false;
      }
    }
    return true;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validate URL format
   */
  validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting - prevent fake traffic
   */
  initRateLimiting(maxRequests = 100, windowMs = 60000) {
    const requests = {};

    return (clientId) => {
      const now = Date.now();
      const clientRequests = requests[clientId] || [];

      // Remove old requests outside the window
      const validRequests = clientRequests.filter((time) => now - time < windowMs);

      if (validRequests.length >= maxRequests) {
        this.logSecurityEvent('rate_limit_exceeded', { clientId, requestCount: validRequests.length });
        return false;
      }

      validRequests.push(now);
      requests[clientId] = validRequests;
      return true;
    };
  }

  /**
   * Detect bot/suspicious user agent
   */
  detectSuspiciousBot() {
    const suspiciousBots = [
      /bot/gi,
      /crawler/gi,
      /spider/gi,
      /scraper/gi,
      /curl/gi,
      /wget/gi,
      /python/gi,
      /java(?!script)/gi,
    ];

    const userAgent = navigator.userAgent;
    for (let pattern of suspiciousBots) {
      if (pattern.test(userAgent)) {
        this.logSecurityEvent('suspicious_bot_detected', { userAgent });
        return true;
      }
    }
    return false;
  }

  /**
   * Detect headless browser (automated attacks)
   */
  detectHeadlessBrowser() {
    const headlessIndicators = [
      !window.chrome && !window.safari,
      navigator.webdriver === true,
      window.phantomjs,
      window.__nightmare,
      window.document.documentElement.getAttribute('webdriver'),
      navigator.userAgent.includes('HeadlessChrome'),
      navigator.userAgent.includes('PhantomJS'),
    ];

    if (headlessIndicators.some(Boolean)) {
      this.logSecurityEvent('headless_browser_detected', {
        userAgent: navigator.userAgent,
      });
      return true;
    }
    return false;
  }

  /**
   * Verify legitimate user with behavioral checks
   */
  verifyLegitimateUser() {
    const checks = {
      hasMouseMovement: false,
      hasClick: false,
      hasKeyboard: false,
      hasTouch: false,
    };

    // Track user interactions
    document.addEventListener('mousemove', () => {
      checks.hasMouseMovement = true;
    }, { once: true });

    document.addEventListener('click', () => {
      checks.hasClick = true;
    }, { once: true });

    document.addEventListener('keydown', () => {
      checks.hasKeyboard = true;
    }, { once: true });

    document.addEventListener('touchstart', () => {
      checks.hasTouch = true;
    }, { once: true });

    // Return verification after 5 seconds
    return new Promise((resolve) => {
      setTimeout(() => {
        const isLegitimate = Object.values(checks).some(Boolean);
        if (!isLegitimate) {
          this.logSecurityEvent('no_user_interaction', { timestamp: new Date().toISOString() });
        }
        resolve(isLegitimate);
      }, 5000);
    });
  }

  /**
   * Prevent iframe embedding (clickjacking)
   */
  preventClickjacking() {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
      this.logSecurityEvent('clickjacking_attempt_detected', {});
    }
  }

  /**
   * Add security headers via meta tags
   */
  addSecurityHeaders() {
    // CSP (Content Security Policy)
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:;";
    document.head.appendChild(cspMeta);

    // X-UA-Compatible
    const xUAMeta = document.createElement('meta');
    xUAMeta.httpEquiv = 'X-UA-Compatible';
    xUAMeta.content = 'IE=edge';
    document.head.appendChild(xUAMeta);

    // Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerMeta);
  }

  /**
   * Log security events for monitoring
   */
  logSecurityEvent(eventType, data = {}) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...data,
    };

    console.warn(`[SECURITY] ${eventType}:`, event);

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to your backend logging service
      // fetch('/api/security-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // }).catch(() => {});
    }
  }

  /**
   * Initialize all security measures
   */
  initializeAllSecurity() {
    console.log('🔒 Initializing security measures...');

    // Disable DevTools
    this.disableDevTools();

    // Prevent clickjacking
    this.preventClickjacking();

    // NOTE: Avoid injecting CSP via meta at runtime.
    // It can break external assets/videos and should be set on the server instead.

    // Detect suspicious activity
    if (this.detectSuspiciousBot()) {
      console.warn('⚠️ Suspicious bot activity detected');
    }

    if (this.detectHeadlessBrowser()) {
      console.warn('⚠️ Headless browser detected - potential automated attack');
    }

    // Verify user is legitimate
    this.verifyLegitimateUser().then((isLegit) => {
      if (!isLegit) {
        console.warn('⚠️ No user interaction detected');
      }
    });

    console.log('✅ Security measures initialized');
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.securityManager = securityManager;
}

export default securityManager;
