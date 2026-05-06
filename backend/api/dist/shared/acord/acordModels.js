"use strict";
/**
 * ACORD eLabels Data Models and Definitions
 * Standard insurance form field labels and metadata
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACORD_LABELS = exports.AcordFieldType = exports.AcordCategory = void 0;
var AcordCategory;
(function (AcordCategory) {
    AcordCategory["INSURED"] = "Insured";
    AcordCategory["PRODUCER"] = "Producer";
    AcordCategory["POLICY"] = "Policy";
    AcordCategory["COVERAGE"] = "Coverage";
    AcordCategory["LOSS"] = "Loss";
    AcordCategory["CLAIMS"] = "Claims";
    AcordCategory["PARTIES"] = "Parties";
    AcordCategory["DATES"] = "Dates";
    AcordCategory["AMOUNTS"] = "Amounts";
    AcordCategory["OTHER"] = "Other";
})(AcordCategory || (exports.AcordCategory = AcordCategory = {}));
var AcordFieldType;
(function (AcordFieldType) {
    AcordFieldType["TEXT"] = "text";
    AcordFieldType["NUMERIC"] = "numeric";
    AcordFieldType["DATE"] = "date";
    AcordFieldType["CHECKBOX"] = "checkbox";
    AcordFieldType["DROPDOWN"] = "dropdown";
    AcordFieldType["TEXTAREA"] = "textarea";
})(AcordFieldType || (exports.AcordFieldType = AcordFieldType = {}));
// ACORD Standard Labels Database
exports.ACORD_LABELS = [
    // Insured Information
    {
        id: "acord_insured_name",
        name: "Insured Name",
        description: "Legal name of the insured",
        category: AcordCategory.INSURED,
        fieldType: AcordFieldType.TEXT,
        examples: ["Named Insured", "Policyholder Name", "Insured", "Name of Insured"],
        pattern: /insured\s+name|named\s+insured|policyholder|policy\s+holder/i,
        priority: 100,
    },
    {
        id: "acord_insured_address",
        name: "Insured Address",
        description: "Mailing address of the insured",
        category: AcordCategory.INSURED,
        fieldType: AcordFieldType.TEXT,
        examples: ["Insured Address", "Address", "Mailing Address", "Street Address"],
        pattern: /address|street|location|mailing\s+address/i,
        priority: 95,
    },
    {
        id: "acord_insured_city",
        name: "City",
        description: "City of the insured address",
        category: AcordCategory.INSURED,
        fieldType: AcordFieldType.TEXT,
        examples: ["City", "City/Town", "Municipality"],
        pattern: /\bcity\b|municipality|town/i,
        priority: 85,
    },
    {
        id: "acord_insured_state",
        name: "State/Province",
        description: "State or province of the insured address",
        category: AcordCategory.INSURED,
        fieldType: AcordFieldType.TEXT,
        examples: ["State", "State/Province", "Province", "ST"],
        pattern: /state|province|st\b/i,
        priority: 85,
    },
    {
        id: "acord_insured_zip",
        name: "ZIP/Postal Code",
        description: "ZIP or postal code",
        category: AcordCategory.INSURED,
        fieldType: AcordFieldType.TEXT,
        examples: ["ZIP Code", "Postal Code", "ZIP", "Zip Code"],
        pattern: /zip|postal\s+code|postcode/i,
        priority: 80,
    },
    // Producer/Agent Information
    {
        id: "acord_producer_name",
        name: "Producer Name",
        description: "Name of the insurance producer or agent",
        category: AcordCategory.PRODUCER,
        fieldType: AcordFieldType.TEXT,
        examples: ["Producer", "Agent Name", "Insurance Agent", "Broker Name"],
        pattern: /producer|agent|broker|representative/i,
        priority: 90,
    },
    {
        id: "acord_producer_code",
        name: "Producer Code",
        description: "Code or license number of the producer",
        category: AcordCategory.PRODUCER,
        fieldType: AcordFieldType.TEXT,
        examples: ["Producer Code", "Agent Code", "License Number", "Code"],
        pattern: /producer\s+code|agent\s+code|license\s+number|code\b/i,
        priority: 75,
    },
    // Policy Information
    {
        id: "acord_policy_number",
        name: "Policy Number",
        description: "Unique identifier for the insurance policy",
        category: AcordCategory.POLICY,
        fieldType: AcordFieldType.TEXT,
        examples: ["Policy Number", "Policy #", "Policy No", "Pol #"],
        pattern: /policy\s+(?:number|no|#)|pol\s+#|policy\b/i,
        priority: 100,
    },
    {
        id: "acord_effective_date",
        name: "Effective Date",
        description: "Date the policy becomes effective",
        category: AcordCategory.POLICY,
        fieldType: AcordFieldType.DATE,
        examples: ["Effective Date", "Eff Date", "From Date", "Start Date"],
        pattern: /effective\s+date|eff\s+date|from\s+date|start\s+date/i,
        priority: 95,
    },
    {
        id: "acord_expiration_date",
        name: "Expiration Date",
        description: "Date the policy expires",
        category: AcordCategory.POLICY,
        fieldType: AcordFieldType.DATE,
        examples: ["Expiration Date", "Exp Date", "To Date", "End Date"],
        pattern: /expiration\s+date|exp\s+date|to\s+date|end\s+date/i,
        priority: 95,
    },
    // Coverage Information
    {
        id: "acord_coverage_type",
        name: "Coverage Type",
        description: "Type of insurance coverage",
        category: AcordCategory.COVERAGE,
        fieldType: AcordFieldType.TEXT,
        examples: ["Coverage", "Coverage Type", "Type of Coverage", "Peril"],
        pattern: /coverage|peril|type\s+of\s+coverage|coverage\s+type/i,
        priority: 90,
    },
    {
        id: "acord_coverage_limit",
        name: "Coverage Limit",
        description: "Maximum amount covered",
        category: AcordCategory.COVERAGE,
        fieldType: AcordFieldType.NUMERIC,
        examples: ["Limit", "Coverage Limit", "Limit of Liability", "Maximum"],
        pattern: /limit|maximum|limit\s+of\s+liability|coverage\s+limit/i,
        priority: 85,
    },
    {
        id: "acord_deductible",
        name: "Deductible",
        description: "Amount insured must pay before coverage",
        category: AcordCategory.COVERAGE,
        fieldType: AcordFieldType.NUMERIC,
        examples: ["Deductible", "Ded", "Deductible Amount"],
        pattern: /deductible|ded\b/i,
        priority: 85,
    },
    // Loss Information
    {
        id: "acord_loss_date",
        name: "Loss Date",
        description: "Date the loss occurred",
        category: AcordCategory.LOSS,
        fieldType: AcordFieldType.DATE,
        examples: ["Loss Date", "Date of Loss", "Date Loss Occurred"],
        pattern: /loss\s+date|date\s+of\s+loss|date\s+loss\s+occurred/i,
        priority: 95,
    },
    {
        id: "acord_loss_description",
        name: "Loss Description",
        description: "Description of the loss or claim",
        category: AcordCategory.LOSS,
        fieldType: AcordFieldType.TEXTAREA,
        examples: ["Loss Description", "Description", "Claim Description"],
        pattern: /loss\s+description|description\s+of\s+loss|claim\s+description/i,
        priority: 85,
    },
    {
        id: "acord_loss_location",
        name: "Loss Location",
        description: "Location where the loss occurred",
        category: AcordCategory.LOSS,
        fieldType: AcordFieldType.TEXT,
        examples: ["Loss Location", "Location of Loss", "Where"],
        pattern: /loss\s+location|location\s+of\s+loss|where\s+loss/i,
        priority: 80,
    },
    // Claims Information
    {
        id: "acord_claim_number",
        name: "Claim Number",
        description: "Unique identifier for the claim",
        category: AcordCategory.CLAIMS,
        fieldType: AcordFieldType.TEXT,
        examples: ["Claim Number", "Claim #", "Claim No", "Reference Number"],
        pattern: /claim\s+(?:number|no|#)|claim\b|reference\s+number/i,
        priority: 95,
    },
    {
        id: "acord_claim_status",
        name: "Claim Status",
        description: "Current status of the claim",
        category: AcordCategory.CLAIMS,
        fieldType: AcordFieldType.TEXT,
        examples: ["Status", "Claim Status", "Status of Claim"],
        pattern: /status|claim\s+status/i,
        priority: 75,
    },
    // Other
    {
        id: "acord_notes",
        name: "Notes/Comments",
        description: "Additional notes or comments",
        category: AcordCategory.OTHER,
        fieldType: AcordFieldType.TEXTAREA,
        examples: ["Notes", "Comments", "Remarks", "Additional Information"],
        pattern: /notes|comments|remarks|additional\s+information/i,
        priority: 60,
    },
];
