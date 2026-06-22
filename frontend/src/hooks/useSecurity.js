import { useEffect, useRef, useState } from 'react';
import securityManager from '../utils/securityManager';
import requestValidator from '../utils/requestValidator';

/**
 * Hook to protect forms from CSRF attacks
 */
export const useCSRFProtection = () => {
  const [csrfToken, setCSRFToken] = useState(null);

  useEffect(() => {
    const token = requestValidator.generateCSRFToken();
    setCSRFToken(token);
  }, []);

  return csrfToken;
};

/**
 * Hook to validate and submit forms securely
 */
export const useSecureFormSubmit = (onSubmit, validationRules = {}) => {
  const csrfToken = useCSRFProtection();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validation = requestValidator.validateFormData(formData, validationRules);

      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      // Verify CSRF token
      if (!requestValidator.verifyCSRFToken(csrfToken)) {
        throw new Error('CSRF token invalid');
      }

      // Sanitize data
      const sanitized = requestValidator.sanitizeFormData(formData);

      // Call parent handler
      await onSubmit(sanitized);
    } catch (error) {
      securityManager.logSecurityEvent('form_submission_error', {
        error: error.message,
      });
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    csrfToken,
    handleSubmit,
    errors,
    isSubmitting,
  };
};

/**
 * Hook to detect and respond to security threats
 */
export const useSecurityMonitor = () => {
  const monitorRef = useRef(null);

  useEffect(() => {
    // Check for suspicious activity periodically
    monitorRef.current = setInterval(() => {
      // Detect headless browser
      if (securityManager.detectHeadlessBrowser()) {
        console.warn('🚨 Security threat: Headless browser detected');
      }

      // Detect bot
      if (securityManager.detectSuspiciousBot()) {
        console.warn('🚨 Security threat: Bot detected');
      }
    }, 30000);

    return () => clearInterval(monitorRef.current);
  }, []);
};

/**
 * Hook to implement rate limiting
 */
export const useRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const rateLimitFn = useRef(requestValidator.createRateLimiter?.(maxRequests, windowMs));
  const [isRateLimited, setIsRateLimited] = useState(false);

  const checkLimit = (clientId = 'default') => {
    if (!rateLimitFn.current) {
      rateLimitFn.current = securityManager.initRateLimiting(maxRequests, windowMs);
    }

    const allowed = rateLimitFn.current(clientId);
    setIsRateLimited(!allowed);
    return allowed;
  };

  return { checkLimit, isRateLimited };
};

/**
 * Hook to sanitize user input in real-time
 */
export const useSanitizedInput = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  const [sanitized, setSanitized] = useState(initialValue);

  const handleChange = (input) => {
    setValue(input);
    setSanitized(securityManager.sanitizeInput(input));
  };

  return {
    value,
    sanitized,
    handleChange,
    setValue,
  };
};

/**
 * Hook for secure data fetching with timeout and validation
 */
export const useSecureFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestValidator.makeSecureRequest(url, {
        method: options.method || 'GET',
        body: options.body,
        validateRules: options.validationRules,
        timeout: options.timeout || 30000,
      });

      setData(result);
    } catch (err) {
      setError(err.message);
      securityManager.logSecurityEvent('secure_fetch_error', {
        url,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [url]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to validate user is legitimate (not bot)
 */
export const useLegitimateUserCheck = () => {
  const [isLegitimate, setIsLegitimate] = useState(null);
  const [isHeadless, setIsHeadless] = useState(false);
  const [isBot, setIsBot] = useState(false);

  useEffect(() => {
    // Check for headless browser
    setIsHeadless(securityManager.detectHeadlessBrowser());

    // Check for bot
    setIsBot(securityManager.detectSuspiciousBot());

    // Verify legitimate user through interaction
    securityManager.verifyLegitimateUser().then(setIsLegitimate);
  }, []);

  return {
    isLegitimate,
    isHeadless,
    isBot,
    isRealUser: isLegitimate === true && !isHeadless && !isBot,
  };
};

export default {
  useCSRFProtection,
  useSecureFormSubmit,
  useSecurityMonitor,
  useRateLimit,
  useSanitizedInput,
  useSecureFetch,
  useLegitimateUserCheck,
};
