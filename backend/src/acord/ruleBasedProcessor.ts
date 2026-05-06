/**
 * Rule-Based Post-Processing Service
 * Applies heuristics and rules to refine label suggestions
 */

import { AcordLabel, ACORD_LABELS, AcordCategory, AcordFieldType } from "./acordModels";
import { MultiFieldSplitter, ComponentType } from "./multiFieldSplitter";

export interface RuleResult {
  appliedRules: string[];
  adjustedScores: Map<string, number>;
  boostedLabels: string[];
  filteredLabels: string[];
  reasoning: string[];
}

export class RuleBasedProcessor {
  private static readonly RULES = {
    // Contextual rules
    ADDRESS_CONTEXT: /address|street|location|mailing|shipping|billing/i,
    DATE_CONTEXT: /date|effective|expiration|loss|birth|inception/i,
    AMOUNT_CONTEXT: /amount|limit|deductible|premium|cost|price|charge/i,
    NUMERIC_CONTEXT: /number|code|count|quantity|id|claim|policy/i,
    PHONE_CONTEXT: /phone|call|contact|number|tel|fax/i,
    EMAIL_CONTEXT: /email|mail|contact|message/i,

    // Field combination rules
    FIRST_FIELD_BIAS: 0.1, // Boost first fields
    LAST_FIELD_BIAS: 0.05, // Slight boost for last fields
    SEQUENTIAL_PENALTY: -0.05, // Penalty for non-sequential matches
  };

  /**
   * Apply all rules to refine suggestions
   */
  static processRules(
    fieldName: string,
    fieldContent: string,
    initialScores: Map<string, number>,
    fieldPosition?: number,
    totalFields?: number
  ): RuleResult {
    const result: RuleResult = {
      appliedRules: [],
      adjustedScores: new Map(initialScores),
      boostedLabels: [],
      filteredLabels: [],
      reasoning: [],
    };

    // Apply field position bias
    this.applyPositionBias(result, fieldPosition, totalFields);

    // Apply contextual rules
    this.applyContextualRules(result, fieldName, fieldContent);

    // Apply component-based rules
    this.applyComponentRules(result, fieldContent);

    // Apply consistency rules
    this.applyConsistencyRules(result, fieldName);

    // Apply category-specific rules
    this.applyCategoryRules(result, fieldName, fieldContent);

    return result;
  }

  /**
   * Apply position-based adjustments
   */
  private static applyPositionBias(
    result: RuleResult,
    fieldPosition?: number,
    totalFields?: number
  ): void {
    if (fieldPosition === 0) {
      // First field - boost likely header fields
      const headerLabels = ["acord_insured_name", "acord_policy_number"];
      headerLabels.forEach(label => {
        const current = result.adjustedScores.get(label) || 0;
        result.adjustedScores.set(label, current + this.RULES.FIRST_FIELD_BIAS);
      });
      result.appliedRules.push("position_bias_first");
      result.reasoning.push("Applied first-field boost for header elements");
    }

    if (totalFields && fieldPosition === totalFields - 1) {
      // Last field - slight boost for notes/comments
      const lastFieldLabels = ["acord_notes"];
      lastFieldLabels.forEach(label => {
        const current = result.adjustedScores.get(label) || 0;
        result.adjustedScores.set(label, current + this.RULES.LAST_FIELD_BIAS);
      });
      result.appliedRules.push("position_bias_last");
      result.reasoning.push("Applied last-field boost for notes/comments");
    }
  }

  /**
   * Apply contextual rules based on field name
   */
  private static applyContextualRules(
    result: RuleResult,
    fieldName: string,
    fieldContent: string
  ): void {
    const combined = `${fieldName} ${fieldContent}`.toLowerCase();

    // Address context
    if (this.RULES.ADDRESS_CONTEXT.test(fieldName)) {
      const addressLabels = [
        "acord_insured_address",
        "acord_insured_city",
        "acord_insured_state",
        "acord_insured_zip",
        "acord_loss_location",
      ];
      addressLabels.forEach(label => {
        const current = result.adjustedScores.get(label) || 0;
        result.adjustedScores.set(label, current + 0.15);
      });
      result.appliedRules.push("address_context");
      result.reasoning.push("Detected address-related context in field name");
    }

    // Date context
    if (this.RULES.DATE_CONTEXT.test(fieldName)) {
      const dateLabels = [
        "acord_effective_date",
        "acord_expiration_date",
        "acord_loss_date",
      ];
      dateLabels.forEach(label => {
        const current = result.adjustedScores.get(label) || 0;
        result.adjustedScores.set(label, current + 0.2);
      });
      result.appliedRules.push("date_context");
      result.reasoning.push("Detected date-related context in field name");
    }

    // Amount context
    if (this.RULES.AMOUNT_CONTEXT.test(fieldName)) {
      const amountLabels = [
        "acord_coverage_limit",
        "acord_deductible",
      ];
      amountLabels.forEach(label => {
        const current = result.adjustedScores.get(label) || 0;
        result.adjustedScores.set(label, current + 0.15);
      });
      result.appliedRules.push("amount_context");
      result.reasoning.push("Detected amount-related context in field name");
    }

    // Numeric/ID context
    if (this.RULES.NUMERIC_CONTEXT.test(fieldName)) {
      const idLabels = [
        "acord_policy_number",
        "acord_claim_number",
        "acord_producer_code",
      ];
      idLabels.forEach(label => {
        const current = result.adjustedScores.get(label) || 0;
        result.adjustedScores.set(label, current + 0.1);
      });
      result.appliedRules.push("numeric_context");
      result.reasoning.push("Detected numeric/ID context in field name");
    }
  }

  /**
   * Apply rules based on split field components
   */
  private static applyComponentRules(
    result: RuleResult,
    fieldContent: string
  ): void {
    const split = MultiFieldSplitter.splitField(fieldContent);

    split.components.forEach(component => {
      switch (component.type) {
        case ComponentType.ADDRESS:
          result.adjustedScores.set("acord_insured_address", 
            (result.adjustedScores.get("acord_insured_address") || 0) + 0.2);
          result.reasoning.push(`Detected address component: ${component.value}`);
          break;

        case ComponentType.CITY:
          result.adjustedScores.set("acord_insured_city",
            (result.adjustedScores.get("acord_insured_city") || 0) + 0.2);
          result.reasoning.push(`Detected city component: ${component.value}`);
          break;

        case ComponentType.STATE:
          result.adjustedScores.set("acord_insured_state",
            (result.adjustedScores.get("acord_insured_state") || 0) + 0.2);
          result.reasoning.push(`Detected state component: ${component.value}`);
          break;

        case ComponentType.ZIP:
          result.adjustedScores.set("acord_insured_zip",
            (result.adjustedScores.get("acord_insured_zip") || 0) + 0.2);
          result.reasoning.push(`Detected ZIP code: ${component.value}`);
          break;

        case ComponentType.DATE:
          result.adjustedScores.set("acord_effective_date",
            (result.adjustedScores.get("acord_effective_date") || 0) + 0.15);
          result.adjustedScores.set("acord_expiration_date",
            (result.adjustedScores.get("acord_expiration_date") || 0) + 0.1);
          result.reasoning.push(`Detected date component: ${component.value}`);
          break;

        case ComponentType.PHONE:
          result.reasoning.push(`Detected phone number: ${component.value}`);
          break;

        case ComponentType.EMAIL:
          result.reasoning.push(`Detected email: ${component.value}`);
          break;

        case ComponentType.AMOUNT:
          result.adjustedScores.set("acord_coverage_limit",
            (result.adjustedScores.get("acord_coverage_limit") || 0) + 0.15);
          result.adjustedScores.set("acord_deductible",
            (result.adjustedScores.get("acord_deductible") || 0) + 0.1);
          result.reasoning.push(`Detected amount: ${component.value}`);
          break;

        case ComponentType.NUMBER:
          result.adjustedScores.set("acord_policy_number",
            (result.adjustedScores.get("acord_policy_number") || 0) + 0.1);
          result.adjustedScores.set("acord_claim_number",
            (result.adjustedScores.get("acord_claim_number") || 0) + 0.1);
          result.reasoning.push(`Detected numeric value: ${component.value}`);
          break;
      }
    });

    if (split.detectedPatterns.length > 0) {
      result.appliedRules.push("component_detection");
    }
  }

  /**
   * Apply consistency and validation rules
   */
  private static applyConsistencyRules(
    result: RuleResult,
    fieldName: string
  ): void {
    const normalized = MultiFieldSplitter.normalize(fieldName);

    // Check for exact pattern matches
    ACORD_LABELS.forEach(label => {
      if (label.pattern && label.pattern.test(fieldName)) {
        const current = result.adjustedScores.get(label.id) || 0;
        result.adjustedScores.set(label.id, current + 0.3);
        result.boostedLabels.push(label.id);
        result.reasoning.push(
          `Pattern match for "${label.name}": ${label.pattern}`
        );
        result.appliedRules.push("pattern_match");
      }
    });

    // Boost by priority
    ACORD_LABELS.forEach(label => {
      const current = result.adjustedScores.get(label.id) || 0;
      const priorityBoost = label.priority / 1000; // Normalize priority
      result.adjustedScores.set(label.id, current + priorityBoost);
    });

    result.appliedRules.push("priority_boost");
  }

  /**
   * Apply category-specific rules
   */
  private static applyCategoryRules(
    result: RuleResult,
    fieldName: string,
    fieldContent: string
  ): void {
    const combined = `${fieldName} ${fieldContent}`.toLowerCase();

    // Insured-related fields should cluster together
    if (combined.includes("insured") || combined.includes("policyholder")) {
      const insuredLabels = ACORD_LABELS.filter(
        l => l.category === AcordCategory.INSURED
      );
      insuredLabels.forEach(label => {
        const current = result.adjustedScores.get(label.id) || 0;
        result.adjustedScores.set(label.id, current + 0.1);
      });
      result.appliedRules.push("insured_category");
    }

    // Producer-related fields
    if (combined.includes("producer") || combined.includes("agent")) {
      const producerLabels = ACORD_LABELS.filter(
        l => l.category === AcordCategory.PRODUCER
      );
      producerLabels.forEach(label => {
        const current = result.adjustedScores.get(label.id) || 0;
        result.adjustedScores.set(label.id, current + 0.1);
      });
      result.appliedRules.push("producer_category");
    }

    // Claim-related fields
    if (combined.includes("claim") || combined.includes("loss")) {
      const claimLabels = ACORD_LABELS.filter(
        l => l.category === AcordCategory.CLAIMS || l.category === AcordCategory.LOSS
      );
      claimLabels.forEach(label => {
        const current = result.adjustedScores.get(label.id) || 0;
        result.adjustedScores.set(label.id, current + 0.15);
      });
      result.appliedRules.push("claim_loss_category");
    }
  }

  /**
   * Filter out irrelevant suggestions based on field type
   */
  static filterByFieldType(
    suggestions: Map<string, number>,
    fieldType?: string
  ): Map<string, number> {
    if (!fieldType) return suggestions;

    const filtered = new Map<string, number>();
    const fieldTypeEnum = this.parseFieldType(fieldType);

    suggestions.forEach((score, labelId) => {
      const label = ACORD_LABELS.find(l => l.id === labelId);
      if (!label) {
        filtered.set(labelId, score);
        return;
      }

      // Check field type compatibility
      if (this.isTypeCompatible(label.fieldType, fieldTypeEnum)) {
        filtered.set(labelId, score);
      }
    });

    return filtered;
  }

  /**
   * Check if label field type is compatible with actual field type
   */
  private static isTypeCompatible(
    labelType: AcordFieldType,
    actualType?: AcordFieldType
  ): boolean {
    if (!actualType) return true;

    // Some flexibility in type matching
    const compatible: { [key in AcordFieldType]: AcordFieldType[] } = {
      [AcordFieldType.TEXT]: [
        AcordFieldType.TEXT,
        AcordFieldType.TEXTAREA,
        AcordFieldType.DROPDOWN,
      ],
      [AcordFieldType.NUMERIC]: [
        AcordFieldType.NUMERIC,
        AcordFieldType.TEXT,
      ],
      [AcordFieldType.DATE]: [
        AcordFieldType.DATE,
        AcordFieldType.TEXT,
      ],
      [AcordFieldType.CHECKBOX]: [
        AcordFieldType.CHECKBOX,
      ],
      [AcordFieldType.DROPDOWN]: [
        AcordFieldType.DROPDOWN,
        AcordFieldType.TEXT,
      ],
      [AcordFieldType.TEXTAREA]: [
        AcordFieldType.TEXTAREA,
        AcordFieldType.TEXT,
      ],
    };

    return compatible[labelType]?.includes(actualType) ?? true;
  }

  /**
   * Parse field type string to enum
   */
  private static parseFieldType(fieldType: string): AcordFieldType | undefined {
    const lower = fieldType.toLowerCase();
    if (lower.includes("date")) return AcordFieldType.DATE;
    if (lower.includes("check")) return AcordFieldType.CHECKBOX;
    if (lower.includes("drop")) return AcordFieldType.DROPDOWN;
    if (lower.includes("text") || lower.includes("area")) return AcordFieldType.TEXTAREA;
    if (lower.includes("number") || lower.includes("numeric")) return AcordFieldType.NUMERIC;
    return undefined;
  }
}
