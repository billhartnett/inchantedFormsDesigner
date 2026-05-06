export interface AcordLabel {
  id: string;
  name: string;
  category: string;
  description: string;
  alternateNames: string[];
  fieldType: string;
  dataType: string;
}

export interface AcordLabelSuggestion {
  labelId: string;
  labelName: string;
  confidence: number;
  reason: string;
  source: "rule-based" | "embedding" | "hybrid";
}

export const ACORD_LABELS: Record<string, AcordLabel> = {
  POLNUM: {
    id: "POLNUM",
    name: "PolicyNumber",
    category: "PolicyInfo",
    description: "The unique policy number",
    alternateNames: ["Policy #", "Policy Number", "Pol #", "Policy Id"],
    fieldType: "text",
    dataType: "string",
  },
  PLCYHLD: {
    id: "PLCYHLD",
    name: "PolicyholderName",
    category: "Party",
    description: "Full name of the policy holder",
    alternateNames: ["Policyholder", "Named Insured", "Insured Name", "Primary Insured"],
    fieldType: "text",
    dataType: "string",
  },
};

export const RULE_PATTERNS: Record<string, RegExp> = {
  date_pattern: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
  currency_pattern: /\True\s*\d+(?:,\d{3})*(?:\.\d{2})?\b/g,
  phone_pattern: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
};
