/**
 * Phone Number Normalization & Formatting Utilities
 * Standardized for Sri Lankan E.164 (+94) telecommunication networks
 * and reliable international WhatsApp routing.
 */

/**
 * Normalizes any phone number into canonical E.164 format (+94XXXXXXXXX for Sri Lanka).
 * Handles:
 * - Local mobile: '077 123 4567', '077-1234567', '0771234567' -> '+94771234567'
 * - Local landline: '027 222 0000', '011 234 5678' -> '+94272220000'
 * - 9-digit omission of leading 0: '771234567' -> '+94771234567'
 * - International prefix with 00: '0094771234567' -> '+94771234567'
 * - Redundant 0 after country code: '+94 077 123 4567', '940771234567' -> '+94771234567'
 * - Already canonical: '+94771234567' -> '+94771234567'
 * - Non-LK International: '+971501234567', '+447911123456' -> preserves international code
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";

  // 1. Remove bracketed annotations e.g. "+94 27 222 0000 [Placeholder to Confirm]"
  const cleanedText = rawPhone.replace(/\[.*?\]|\(.*?\)/g, "").trim();

  // 2. Check if it explicitly starts with a non-94 international country code
  const isExplicitInternational =
    cleanedText.startsWith("+") && !cleanedText.startsWith("+94");

  // 3. Strip all non-digit characters except leading plus if international
  const digitsOnly = cleanedText.replace(/[^0-9]/g, "");

  if (!digitsOnly) return "";

  // If explicit foreign international number (e.g. +971, +44, +1, +81)
  if (isExplicitInternational && digitsOnly.length >= 8) {
    return `+${digitsOnly}`;
  }

  // Handle Sri Lankan phone logic
  let coreDigits = digitsOnly;

  // Case A: Starts with '0094' (international dialing prefix)
  if (coreDigits.startsWith("0094")) {
    coreDigits = coreDigits.slice(4);
  }
  // Case B: Starts with '94'
  else if (coreDigits.startsWith("94")) {
    coreDigits = coreDigits.slice(2);
  }

  // If user entered a leading 0 after country code (e.g. 94077... or 077...)
  if (coreDigits.startsWith("0")) {
    coreDigits = coreDigits.slice(1);
  }

  // Sri Lankan local numbers have exactly 9 digits (mobile e.g. 7XXXXXXXX, or landline e.g. 27XXXXXXX)
  if (coreDigits.length === 9) {
    return `+94${coreDigits}`;
  }

  // If more or fewer digits, return with +94 if plausible or fallback to E.164
  if (coreDigits.length > 9 && digitsOnly.startsWith("94")) {
    // If it had extra digits or country code embedded
    return `+${digitsOnly}`;
  }

  return `+94${coreDigits}`;
}

/**
 * Formats a normalized or raw phone number for executive UI display.
 * Example:
 * - '+94771234567' -> '+94 77 123 4567' (Mobile)
 * - '+94272220000' -> '+94 27 222 0000' (Polonnaruwa Landline)
 * - '+94112345678' -> '+94 11 234 5678' (Colombo Landline)
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";
  const normalized = normalizePhoneNumber(phone);

  if (normalized.startsWith("+94") && normalized.length === 12) {
    const area = normalized.slice(3, 5); // e.g. '77', '71', '27'
    const part1 = normalized.slice(5, 8); // e.g. '123'
    const part2 = normalized.slice(8, 12); // e.g. '4567'
    return `+94 ${area} ${part1} ${part2}`;
  }

  return normalized || phone;
}

/**
 * Extracts raw digits suitable for direct WhatsApp API deep links.
 * WhatsApp requires digits only without leading '+' or whitespace.
 * Example: '+94 77 123 4567' -> '94771234567'
 */
export function getWhatsAppNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return normalized.replace(/[^0-9]/g, "");
}

/**
 * Builds a reliable, pre-filled WhatsApp click-to-chat URL.
 * Guaranteed to never fail from spaces, dashes, or leading zeros.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const cleanNumber = getWhatsAppNumber(phone);
  if (!cleanNumber) return "#";
  const baseUrl = `https://wa.me/${cleanNumber}`;
  if (!message) return baseUrl;
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

/**
 * Checks whether two phone inputs point to the same physical phone line.
 */
export function isSamePhoneNumber(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  return normA.length >= 10 && normA === normB;
}
