/**
 * Form Validation Utilities
 * 
 * Reusable validation functions for form fields
 */

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

/**
 * Validates name field - only alphabetic characters (letters, spaces, hyphens, apostrophes)
 * No numbers allowed
 */
export function validateName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }

  // Only letters, spaces, hyphens, and apostrophes allowed - NO NUMBERS
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes. Numbers are not allowed.' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates phone number - only digits, maximum 10 digits
 * No alphabetic characters allowed
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, parentheses, plus signs for validation
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

  // Check if contains any non-numeric characters
  if (!/^\d+$/.test(cleanPhone)) {
    return { isValid: false, error: 'Phone number can only contain digits. Letters are not allowed.' };
  }

  // Check length (exactly 10 digits)
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates age - only digits, maximum 2 digits (1-99)
 * No alphabetic characters allowed
 */
export function validateAge(age: string): ValidationResult {
  if (!age || !age.trim()) {
    return { isValid: false, error: 'Age is required' };
  }

  const trimmedAge = age.trim();

  // Check if contains any non-numeric characters
  if (!/^\d+$/.test(trimmedAge)) {
    return { isValid: false, error: 'Age can only contain digits. Letters are not allowed.' };
  }

  const ageNum = parseInt(trimmedAge, 10);

  if (isNaN(ageNum)) {
    return { isValid: false, error: 'Age must be a valid number' };
  }

  if (ageNum < 1) {
    return { isValid: false, error: 'Age must be at least 1' };
  }

  if (ageNum > 99) {
    return { isValid: false, error: 'Age must be less than 100 (maximum 2 digits)' };
  }

  // Check if more than 2 digits
  if (trimmedAge.length > 2) {
    return { isValid: false, error: 'Age must be maximum 2 digits (1-99)' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates email - requires proper domain format (e.g., gmail.com, yahoo.com)
 * Rejects invalid formats like "name.com" or "name.in" without @ symbol
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 255) {
    return { isValid: false, error: 'Email must be less than 255 characters' };
  }

  // Check for @ symbol - must be present
  if (!trimmedEmail.includes('@')) {
    return { isValid: false, error: 'Email must contain @ symbol (e.g., name@gmail.com)' };
  }

  // Check that @ is not at the start or end
  if (trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@')) {
    return { isValid: false, error: 'Email format is invalid. Use format: name@domain.com' };
  }

  // Split by @ to check domain part
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email must have exactly one @ symbol' };
  }

  const [localPart, domainPart] = parts;

  // Validate local part (before @)
  if (!localPart || localPart.trim() === '') {
    return { isValid: false, error: 'Email must have a name before @ (e.g., name@gmail.com)' };
  }

  // Validate domain part (after @)
  if (!domainPart || domainPart.trim() === '') {
    return { isValid: false, error: 'Email must have a domain after @ (e.g., name@gmail.com)' };
  }

  // Check that domain has a dot (.) for TLD
  if (!domainPart.includes('.')) {
    return { isValid: false, error: 'Email domain must include a domain extension (e.g., .com, .in, .org)' };
  }

  // Check that domain doesn't start or end with dot
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, error: 'Email domain format is invalid (e.g., name@gmail.com)' };
  }

  // Check that there's text before and after the dot in domain
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2 || domainParts.some(part => part.trim() === '')) {
    return { isValid: false, error: 'Email domain must have a valid extension (e.g., .com, .in, .org)' };
  }

  // Final regex validation for proper email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@gmail.com)' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates address - alphanumeric characters allowed
 */
export function validateAddress(address: string): ValidationResult {
  // Address is optional, so empty is valid
  if (!address || !address.trim()) {
    return { isValid: true, error: '' };
  }

  if (address.length > 500) {
    return { isValid: false, error: 'Address must be less than 500 characters' };
  }

  // Alphanumeric, spaces, and common address characters allowed
  // This allows numbers, letters, spaces, commas, periods, hyphens, etc.
  if (!/^[a-zA-Z0-9\s.,'-/#]+$/.test(address)) {
    return { isValid: false, error: 'Address contains invalid characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Handles input change for name field - prevents numbers from being entered
 */
export function handleNameInput(value: string): string {
  // Remove any numbers from the input
  return value.replace(/[0-9]/g, '');
}

/**
 * Handles input change for phone field - only allows digits, max 10
 */
export function handlePhoneInput(value: string): string {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  // Limit to 10 digits
  return digitsOnly.slice(0, 10);
}

/**
 * Formats phone number for display (removes +91 prefix if present)
 * Used when loading data from backend to show in input field
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  // Remove +91 or 91 prefix if present
  let cleaned = phone.trim();
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3).trim();
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2).trim();
  }
  // Return only digits (max 10)
  return cleaned.replace(/\D/g, '').slice(0, 10);
}

/**
 * Formats phone number for API submission (adds 91 prefix, no plus sign)
 * Used when submitting data to backend
 */
export function formatPhoneForApi(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '').slice(0, 10);
  // If already has +91 or 91, return with 91 prefix (no plus)
  if (phone.trim().startsWith('+91') || phone.trim().startsWith('91')) {
    return `91${digitsOnly}`;
  }
  // Add 91 prefix (no plus sign)
  return `91${digitsOnly}`;
}

/**
 * Handles input change for age field - only allows digits, max 2
 */
export function handleAgeInput(value: string): string {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  // Limit to 2 digits
  return digitsOnly.slice(0, 2);
}

/**
 * Handles input change for email/address - allows alphanumeric and common characters
 */
export function handleAlphanumericInput(value: string, maxLength?: number): string {
  let result = value;
  
  // For email, allow alphanumeric and email-specific characters
  // For address, allow alphanumeric and address-specific characters
  // This is handled by the validation function, so we just limit length here
  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }
  
  return result;
}

