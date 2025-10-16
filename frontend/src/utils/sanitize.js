/**
 * Input sanitization utilities
 * Protects against XSS and injection attacks
 */

/**
 * Sanitize a single string input
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove leading/trailing whitespace
  let sanitized = input.trim();
  
  // Escape HTML special characters
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
  
  // Remove any potential script tags or event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
};

/**
 * Sanitize an object's string values recursively
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Sanitize email address
 * @param {string} email - Email address to sanitize
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

/**
 * Sanitize phone number (remove non-numeric characters except +)
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url.trim());
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
};

/**
 * Validate and sanitize numeric input
 * @param {any} value - Value to validate as number
 * @param {Object} options - Validation options (min, max, decimals)
 * @returns {number|null} - Sanitized number or null if invalid
 */
export const sanitizeNumber = (value, options = {}) => {
  const { min, max, decimals = 2 } = options;
  
  const num = parseFloat(value);
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  // Round to specified decimal places
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Sanitize integer input
 * @param {any} value - Value to validate as integer
 * @param {Object} options - Validation options (min, max)
 * @returns {number|null} - Sanitized integer or null if invalid
 */
export const sanitizeInteger = (value, options = {}) => {
  const { min, max } = options;
  
  const num = parseInt(value, 10);
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
};

/**
 * Sanitize form data before submission
 * @param {Object} formData - Form data object
 * @returns {Object} - Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    // Special handling for email
    if (key === 'email') {
      sanitized[key] = sanitizeEmail(value);
    }
    // Special handling for phone
    else if (key === 'phone') {
      sanitized[key] = sanitizePhone(value);
    }
    // Special handling for URLs
    else if (key.includes('url') || key.includes('link')) {
      sanitized[key] = sanitizeUrl(value);
    }
    // Special handling for numbers
    else if (key === 'price' || key === 'amount') {
      sanitized[key] = sanitizeNumber(value, { min: 0 });
    }
    else if (key === 'quantity' || key === 'stock') {
      sanitized[key] = sanitizeInteger(value, { min: 0 });
    }
    // Regular string sanitization
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    }
    // Recursive sanitization for nested objects
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Check if string contains potential XSS
 * @param {string} input - Input to check
 * @returns {boolean} - True if potential XSS detected
 */
export const containsXSS = (input) => {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitize SQL-like input (for search terms)
 * @param {string} input - Search term to sanitize
 * @returns {string} - Sanitized search term
 */
export const sanitizeSearchTerm = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove SQL injection patterns
  let sanitized = input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .trim();
  
  return sanitized;
};

export default {
  sanitizeInput,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeFormData,
  containsXSS,
  sanitizeSearchTerm,
};