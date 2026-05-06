import { ACORD_LABELS, AcordLabel, RULE_PATTERNS } from "./acordModels";

export class RuleBasedProcessor {
  processField(fieldName: string, fieldValue: string): AcordLabel[] {
    const suggestions: AcordLabel[] = [];
    const nameMatches = this.applyNameRules(fieldName);
    suggestions.push(...nameMatches);
    const typeMatches = this.applyTypeRules(fieldValue);
    suggestions.push(...typeMatches);
    const uniqueSuggestions = Array.from(new Map(suggestions.map((s) => [s.id, s])).values());
    return uniqueSuggestions;
  }

  private applyNameRules(fieldName: string): AcordLabel[] {
    const suggestions: AcordLabel[] = [];
    const lowerName = fieldName.toLowerCase();
    for (const [, label] of Object.entries(ACORD_LABELS)) {
      const allNames = [label.name.toLowerCase(), ...label.alternateNames.map((n) => n.toLowerCase())];
      if (allNames.some((name) => lowerName.includes(name) || name.includes(lowerName))) {
        suggestions.push(label);
      }
    }
    return suggestions;
  }

  private applyTypeRules(fieldValue: string): AcordLabel[] {
    const suggestions: AcordLabel[] = [];
    if (RULE_PATTERNS.date_pattern.test(fieldValue)) {
      suggestions.push(ACORD_LABELS.POLNUM);
    }
    if (RULE_PATTERNS.currency_pattern.test(fieldValue)) {
      suggestions.push(ACORD_LABELS.PLCYHLD);
    }
    return suggestions;
  }
}
