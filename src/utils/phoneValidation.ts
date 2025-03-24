export function formatPhoneNumber(number: string): string {
  // Remove all non-digit characters
  const cleaned = number.replace(/[^0-9]/g, '');
  
  // If it starts with '966', verify it's exactly 12 digits
  if (cleaned.startsWith('966')) {
    return cleaned.length === 12 && cleaned.charAt(3) === '5' ? cleaned : '';
  }
  
  // If it starts with '05', verify it's exactly 10 digits
  if (cleaned.startsWith('05')) {
    return cleaned.length === 10 ? `966${cleaned.slice(1)}` : '';
  }
  
  // If it starts with '5', verify it's exactly 9 digits
  if (cleaned.startsWith('5')) {
    return cleaned.length === 9 ? `966${cleaned}` : '';
  }
  
  return '';
}

export function validateSaudiNumber(number: string): boolean {
  const formatted = formatPhoneNumber(number);
  // Must be exactly 12 digits starting with 9665
  return /^9665[0-9]{8}$/.test(formatted);
}