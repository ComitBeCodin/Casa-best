const { validationResult } = require('express-validator');

// Middleware to handle validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Custom validation functions
const isValidObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

const isValidPhoneNumber = (value) => {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const cleaned = value.replace(/\D/g, '');
  return phoneRegex.test(cleaned) || phoneRegex.test(`91${cleaned}`);
};

const isValidPrice = (value) => {
  return typeof value === 'number' && value >= 0 && value <= 1000000;
};

const isValidRating = (value) => {
  return typeof value === 'number' && value >= 1 && value <= 5;
};

const isValidColor = (value) => {
  // Check if it's a valid hex color or common color name
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const commonColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'black', 'white', 'gray', 'grey', 'navy', 'maroon', 'olive', 'lime',
    'aqua', 'teal', 'silver', 'fuchsia', 'beige', 'tan', 'gold'
  ];
  
  return hexRegex.test(value) || commonColors.includes(value.toLowerCase());
};

const isValidSize = (value) => {
  const validSizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
    '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48',
    '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
    'Free Size', 'One Size'
  ];
  
  return validSizes.includes(value);
};

// Sanitization functions
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => typeof item === 'string' ? sanitizeString(item) : item);
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeArray(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Middleware to sanitize request body
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Ensure reasonable limits
  req.query.page = Math.max(1, page);
  req.query.limit = Math.min(100, Math.max(1, limit));
  
  next();
};

// Sort validation
const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    const { sort } = req.query;
    
    if (!sort) {
      return next();
    }
    
    const sortFields = sort.split(',');
    const validSort = {};
    
    for (const field of sortFields) {
      const [fieldName, order] = field.trim().split(':');
      
      if (allowedFields.includes(fieldName)) {
        validSort[fieldName] = order === 'desc' ? -1 : 1;
      }
    }
    
    req.validSort = validSort;
    next();
  };
};

module.exports = {
  validateRequest,
  isValidObjectId,
  isValidPhoneNumber,
  isValidPrice,
  isValidRating,
  isValidColor,
  isValidSize,
  sanitizeString,
  sanitizeArray,
  sanitizeObject,
  sanitizeRequest,
  validatePagination,
  validateSort
};
