/**
 * Shared utility to normalize phone numbers for the Mantra Puja Store.
 * Standardizes Indian numbers to 12-digit format (91XXXXXXXXXX) and
 * Saudi numbers to 966XXXXXXXXX format. Returns null for invalid numbers.
 *
 * @param {string|number} phone The raw phone number input
 * @returns {string|null} The normalized 12-digit phone number, or null if invalid
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all spaces, symbols, "+", "-", "()", and non-digit formatting characters
  const cleaned = String(phone).replace(/[^\d]/g, '');

  // Saudi Arabia checks
  if (cleaned.startsWith('966') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    return '966' + cleaned.substring(1);
  }
  if (cleaned.startsWith('5') && cleaned.length === 9) {
    return '966' + cleaned;
  }

  // India / general 10-digit checks
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return '91' + cleaned.slice(-10);
  }

  return null;
}
