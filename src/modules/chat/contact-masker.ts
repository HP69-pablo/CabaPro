export interface MaskResult {
  hasContactInfo: boolean;
  maskedContent: string;
  detectedPatterns: string[];
}

export class ContactMasker {
  // Regex patterns for international phone numbers, email addresses, external URLs, and WhatsApp handles
  private static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  private static URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  private static PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  private static WHATSAPP_KEYWORDS = /\b(whatsapp|wa\.me|viber|telegram|insta|instagram|fb|facebook|call me on|numéro|tel|telephone)\b/gi;

  static mask(content: string): MaskResult {
    let masked = content;
    const detectedPatterns: string[] = [];

    // Mask emails
    if (this.EMAIL_REGEX.test(masked)) {
      detectedPatterns.push("EMAIL");
      masked = masked.replace(this.EMAIL_REGEX, "[CONTACT_PROTECTED]");
    }

    // Mask URLs
    if (this.URL_REGEX.test(masked)) {
      detectedPatterns.push("URL");
      masked = masked.replace(this.URL_REGEX, "[LINK_PROTECTED]");
    }

    // Mask WhatsApp / social keywords
    if (this.WHATSAPP_KEYWORDS.test(masked)) {
      detectedPatterns.push("OFF_PLATFORM_KEYWORD");
      masked = masked.replace(this.WHATSAPP_KEYWORDS, "[OFF_PLATFORM_FILTERED]");
    }

    // Mask phone numbers (minimum 7 digits total)
    const phoneMatches = masked.match(this.PHONE_REGEX);
    if (phoneMatches) {
      for (const match of phoneMatches) {
        const digitsOnly = match.replace(/\D/g, "");
        if (digitsOnly.length >= 7) {
          detectedPatterns.push("PHONE_NUMBER");
          masked = masked.replace(match, "[PHONE_PROTECTED]");
        }
      }
    }

    return {
      hasContactInfo: detectedPatterns.length > 0,
      maskedContent: masked,
      detectedPatterns,
    };
  }
}
