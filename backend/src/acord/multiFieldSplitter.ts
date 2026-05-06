/**
 * Multi-field Splitting Service
 * Breaks down complex field content into normalized components
 */

export interface SplitField {
  original: string;
  components: FieldComponent[];
  detectedPatterns: string[];
}

export interface FieldComponent {
  type: ComponentType;
  value: string;
  confidence: number;
  pattern?: string;
}

export enum ComponentType {
  NAME = "name",
  ADDRESS = "address",
  CITY = "city",
  STATE = "state",
  ZIP = "zip",
  PHONE = "phone",
  EMAIL = "email",
  DATE = "date",
  AMOUNT = "amount",
  NUMBER = "number",
  CHECKBOX = "checkbox",
  TEXT = "text",
}

export class MultiFieldSplitter {
  /**
   * Split complex field content into components
   */
  static splitField(content: string, fieldType?: string): SplitField {
    if (!content) {
      return { original: content, components: [], detectedPatterns: [] };
    }

    const trimmed = content.trim();
    const components: FieldComponent[] = [];
    const detectedPatterns: string[] = [];

    // Try address parsing
    const addressMatch = this.parseAddress(trimmed);
    if (addressMatch) {
      components.push(...addressMatch.components);
      detectedPatterns.push(...addressMatch.patterns);
    }

    // Try date parsing
    const dateMatch = this.parseDate(trimmed);
    if (dateMatch) {
      components.push(dateMatch);
      detectedPatterns.push("date");
    }

    // Try phone parsing
    const phoneMatch = this.parsePhone(trimmed);
    if (phoneMatch) {
      components.push(phoneMatch);
      detectedPatterns.push("phone");
    }

    // Try email parsing
    const emailMatch = this.parseEmail(trimmed);
    if (emailMatch) {
      components.push(emailMatch);
      detectedPatterns.push("email");
    }

    // Try monetary amount parsing
    const amountMatch = this.parseAmount(trimmed);
    if (amountMatch) {
      components.push(amountMatch);
      detectedPatterns.push("amount");
    }

    // Try numeric parsing
    const numberMatch = this.parseNumber(trimmed);
    if (numberMatch) {
      components.push(numberMatch);
      detectedPatterns.push("number");
    }

    // If no specific patterns matched, treat as text
    if (components.length === 0) {
      components.push({
        type: ComponentType.TEXT,
        value: trimmed,
        confidence: 0.8,
      });
      detectedPatterns.push("text");
    }

    return { original: content, components, detectedPatterns };
  }

  /**
   * Parse address components from text
   */
  private static parseAddress(content: string): { components: FieldComponent[]; patterns: string[] } | null {
    // Simple address parsing for: "123 Main St, City, ST 12345"
    const addressPattern =
      /^(\d+\s+[^,]+),?\s*([^,]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)?/;
    const match = content.match(addressPattern);

    if (match) {
      const components: FieldComponent[] = [];

      if (match[1]) {
        components.push({
          type: ComponentType.ADDRESS,
          value: match[1].trim(),
          confidence: 0.95,
          pattern: "street_address",
        });
      }
      if (match[2]) {
        components.push({
          type: ComponentType.CITY,
          value: match[2].trim(),
          confidence: 0.95,
          pattern: "city",
        });
      }
      if (match[3]) {
        components.push({
          type: ComponentType.STATE,
          value: match[3].trim(),
          confidence: 0.99,
          pattern: "state_code",
        });
      }
      if (match[4]) {
        components.push({
          type: ComponentType.ZIP,
          value: match[4].trim(),
          confidence: 0.99,
          pattern: "zip_code",
        });
      }

      return { components, patterns: ["address"] };
    }

    return null;
  }

  /**
   * Parse date from text
   */
  private static parseDate(content: string): FieldComponent | null {
    // Match: MM/DD/YYYY, MM-DD-YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
    const datePattern =
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}-\d{2}-\d{2})/;
    const match = content.match(datePattern);

    if (match) {
      return {
        type: ComponentType.DATE,
        value: match[1],
        confidence: 0.95,
        pattern: "date",
      };
    }

    return null;
  }

  /**
   * Parse phone number from text
   */
  private static parsePhone(content: string): FieldComponent | null {
    // Match: (123) 456-7890, 123-456-7890, 123.456.7890, etc.
    const phonePattern =
      /(?:\(?(\d{3})\)?[-.]?(\d{3})[-.]?(\d{4}))/;
    const match = content.match(phonePattern);

    if (match) {
      return {
        type: ComponentType.PHONE,
        value: match[0],
        confidence: 0.9,
        pattern: "phone",
      };
    }

    return null;
  }

  /**
   * Parse email from text
   */
  private static parseEmail(content: string): FieldComponent | null {
    const emailPattern =
      /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = content.match(emailPattern);

    if (match) {
      return {
        type: ComponentType.EMAIL,
        value: match[1],
        confidence: 0.95,
        pattern: "email",
      };
    }

    return null;
  }

  /**
   * Parse monetary amount from text
   */
  private static parseAmount(content: string): FieldComponent | null {
    // Match: $1,234.56, $1234.56, 1,234.56, etc.
    const amountPattern =
      /(\$?\s*[\d,]+\.?\d{0,2}(?:\s*(?:USD|dollars|cents))?)/i;
    const match = content.match(amountPattern);

    if (match) {
      const cleaned = match[1].replace(/[$,\s]/g, "").trim();
      if (!isNaN(Number(cleaned))) {
        return {
          type: ComponentType.AMOUNT,
          value: match[1].trim(),
          confidence: 0.9,
          pattern: "monetary_amount",
        };
      }
    }

    return null;
  }

  /**
   * Parse numeric value from text
   */
  private static parseNumber(content: string): FieldComponent | null {
    const numberPattern = /^[-]?\d+(?:\.\d+)?$/;

    if (numberPattern.test(content.trim())) {
      return {
        type: ComponentType.NUMBER,
        value: content.trim(),
        confidence: 0.95,
        pattern: "number",
      };
    }

    return null;
  }

  /**
   * Normalize and clean field content
   */
  static normalize(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/^\W+|\W+$/g, "") // Remove leading/trailing non-word chars
      .toLowerCase();
  }

  /**
   * Get semantic context from field content
   */
  static getContext(content: string): string[] {
    const split = this.splitField(content);
    return split.detectedPatterns;
  }
}
