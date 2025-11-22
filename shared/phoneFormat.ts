/**
 * Format a US phone number for display as (XXX) XXX-XXXX
 */
export function formatUSPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different lengths
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // Remove leading 1 and format
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 10) {
    // For international or longer numbers, try to format the last 10 digits
    const last10 = cleaned.slice(-10);
    return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
  }
  
  // If we can't format it properly, return the cleaned version
  return cleaned || phoneNumber;
}

/**
 * Clean a phone number for tel: links (remove all non-numeric except +)
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  // Keep only digits and leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it; otherwise just return digits
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // For US numbers without country code, add +1
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
    return `+${digitsOnly}`;
  }
  
  return digitsOnly;
}
