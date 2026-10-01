import { describe, it, expect } from "vitest";
import { ContactMasker } from "../../modules/chat/contact-masker";

describe("Phase 6 - Anti-Disintermediation Contact Masker Unit Tests", () => {
  it("masks standard email addresses", () => {
    const input = "Send details to amine.boumediene@gmail.com please";
    const result = ContactMasker.mask(input);

    expect(result.hasContactInfo).toBe(true);
    expect(result.maskedContent).toContain("[CONTACT_PROTECTED]");
    expect(result.maskedContent).not.toContain("amine.boumediene@gmail.com");
  });

  it("masks Algerian and international phone numbers", () => {
    const input = "Call me directly at +213 555 123 456 to bypass fees";
    const result = ContactMasker.mask(input);

    expect(result.hasContactInfo).toBe(true);
    expect(result.maskedContent).toContain("[PHONE_PROTECTED]");
  });

  it("masks WhatsApp and off-platform attempts", () => {
    const input = "Reach me on whatsapp for a cheaper deal";
    const result = ContactMasker.mask(input);

    expect(result.hasContactInfo).toBe(true);
    expect(result.maskedContent).toContain("[OFF_PLATFORM_FILTERED]");
  });

  it("leaves legitimate product discussion unmasked", () => {
    const input = "The Sony WH-1000XM5 headphones cost 280 EUR in Paris Fnac";
    const result = ContactMasker.mask(input);

    expect(result.hasContactInfo).toBe(false);
    expect(result.maskedContent).toBe(input);
  });
});
