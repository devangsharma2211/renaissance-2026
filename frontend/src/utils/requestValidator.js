import securityManager from './securityManager';

/**
 * Request Validation & Protection
 * Validates and sanitizes all user inputs
 */

class RequestValidator {
  constructor() {
    this.csrfTokens = new Map();
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    
    const expiresAt = Date.now() + 3600000; // 1 hour
    this.csrfTokens.set(token, expiresAt);
    return token;
  }

  /**
   * Verify CSRF token
   */
  verifyCSRFToken(token) {
    if (!this.csrfTokens.has(token)) return false;

    const expiresAt = this.csrfTokens.get(token);
    if (Date.now() > expiresAt) {
      this.csrfTokens.delete(token);
      return false;
    }

    this.csrfTokens.delete(token); // One-time use
    return true;
  }

  /**
   * Validate form data
   */
  validateFormData(formData, rules) {
    const errors = {};

    for (const [field, value] of Object.entries(formData)) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;

      // Check required
      if (fieldRules.required && (!value || value.toString().trim() === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Check length
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
      }

      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors[field] = `${field} must not exceed ${fieldRules.maxLength} characters`;
      }

      // Check pattern
      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
      }

      // Check email
      if (fieldRules.email && !securityManager.validateEmail(value)) {
        errors[field] = `${field} must be a valid email`;
      }

      // Check URL
      if (fieldRules.url && !securityManager.validateURL(value)) {
        errors[field] = `${field} must be a valid URL`;
      }

      // Check against SQL injection
      if (fieldRules.checkSQL && !securityManager.validateAgainstSQLInjection(value)) {
        errors[field] = `${field} contains invalid characters`;
        securityManager.logSecurityEvent('sql_injection_attempt_blocked', { field });
      }

      // Custom validator
      if (fieldRules.custom && typeof fieldRules.custom === 'function') {
        const customError = fieldRules.custom(value);
        if (customError) {
          errors[field] = customError;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Sanitize form data before submission
   */
  sanitizeFormData(formData) {
    const sanitized = {};

    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitized[key] = securityManager.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create secure API headers
   */
  createSecureHeaders(csrfToken = null) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-API-Version': '1.0',
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  /**
   * Make secure API request
   */
  async makeSecureRequest(url, options = {}) {
    const {
      method = 'GET',
      body = null,
      validateRules = null,
      timeout = 30000,
    } = options;

    // Validate request body if rules provided
    if (body && validateRules) {
      const validation = this.validateFormData(body, validateRules);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }
    }

    // Sanitize body
    const sanitizedBody = body ? this.sanitizeFormData(body) : null;

    // Generate CSRF token
    const csrfToken = this.generateCSRFToken();

    // Create request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.createSecureHeaders(csrfToken),
        body: sanitizedBody ? JSON.stringify(sanitizedBody) : null,
        credentials: 'same-origin',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      securityManager.logSecurityEvent('api_request_failed', {
        url,
        method,
        error: error.message,
      });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Validate URL parameter to prevent open redirects
   */
  validateRedirectURL(url, allowedHosts = []) {
    try {
      const urlObj = new URL(url, window.location.origin);

      // Only allow same-origin redirects or whitelist
      if (
        urlObj.origin === window.location.origin ||
        allowedHosts.includes(urlObj.hostname)
      ) {
        return urlObj.toString();
      }

      securityManager.logSecurityEvent('open_redirect_attempt', { url });
      return window.location.origin;
    } catch {
      return window.location.origin;
    }
  }

  /**
   * Encode output to prevent XSS
   */
  encodeOutput(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export const requestValidator = new RequestValidator();

if (typeof window !== 'undefined') {
  window.requestValidator = requestValidator;
}

export default requestValidator;
