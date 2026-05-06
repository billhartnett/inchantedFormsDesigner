# ACORD Label Suggestion - Azure Function Guide

Complete implementation of Azure Function that uses Azure OpenAI embeddings and Azure AI Search to suggest ACORD eLabels with multi-field splitting and rule-based post-processing.

## 📋 Overview

This solution provides intelligent label suggestions for insurance form fields using:

- **Azure OpenAI Embeddings**: Semantic understanding of field content
- **Azure AI Search**: Vector-based similarity search with hybrid capabilities
- **Multi-field Splitting**: Smart parsing of complex field values
- **Rule-Based Processing**: Post-processing with insurance domain knowledge

## 🎯 Key Features

### 1. Semantic Label Matching
- Uses Azure OpenAI embeddings to understand field semantics
- Performs vector similarity search against ACORD label database
- Hybrid search combining keyword and vector matching

### 2. Multi-Field Splitting
Automatically detects and extracts:
- **Address Components**: Street, city, state, ZIP
- **Date Formats**: MM/DD/YYYY, YYYY-MM-DD, etc.
- **Phone Numbers**: Various formats (xxx) xxx-xxxx, xxx-xxx-xxxx
- **Email Addresses**: Standard email format
- **Monetary Amounts**: $1,234.56 format with currency
- **Numbers**: Any numeric values

### 3. Rule-Based Post-Processing
Applies multiple layers of intelligent rules:

**Contextual Rules**:
- Address context detection (triggers address field grouping)
- Date context detection (triggers date field suggestions)
- Amount/monetary context (triggers coverage/deductible fields)
- Numeric/ID context (triggers policy/claim numbers)

**Component Rules**:
- Boosts suggestions based on detected field components
- Example: detected ZIP code boosts "ZIP Code" label suggestion

**Position-Based Bias**:
- First field bias: Boosts header elements (name, policy number)
- Last field bias: Boosts notes/comments fields

**Pattern Matching**:
- Regex pattern matching against field names
- Direct match on ACORD label patterns

**Priority Boosting**:
- Factors in label priority scores

**Category Consistency**:
- Groups similar fields (insured-related, producer-related, claim-related)

## 📁 File Structure

```
backend/src/acord/
├── acordModels.ts              (Data models and ACORD label database)
├── multiFieldSplitter.ts       (Field component extraction)
├── embeddingsService.ts        (OpenAI embeddings & AI Search)
├── ruleBasedProcessor.ts       (Rule-based post-processing)
└── labelSuggestionService.ts   (Main orchestration service)

backend/api/suggestLabels/
├── index.ts                    (HTTP trigger function)
└── function.json               (Function configuration)
```

## 🏗️ Architecture

```
HTTP Request
    ↓
[suggestLabels Function]
    ↓
[LabelSuggestionService]
    ├─→ [MultiFieldSplitter] (Split fields into components)
    ├─→ [EmbeddingsService] (Generate embeddings & vector search)
    ├─→ [RuleBasedProcessor] (Apply heuristic rules)
    └─→ [Score Aggregation] (Combine vector + rule scores)
    ↓
Ranked ACORD Label Suggestions
    ↓
HTTP Response
```

## 🚀 Quick Start

### 1. Environment Setup

Set environment variables in `local.settings.json`:

```json
{
  "Values": {
    "OPENAI_ENDPOINT": "https://YOUR_RESOURCE.openai.azure.com/",
    "OPENAI_KEY": "your-openai-key",
    "OPENAI_DEPLOYMENT_ID": "text-embedding-3-small",
    "SEARCH_ENDPOINT": "https://YOUR_RESOURCE.search.windows.net/",
    "SEARCH_KEY": "your-search-key",
    "SEARCH_INDEX_NAME": "acord-labels"
  }
}
```

### 2. Initialize Search Index

Before first use, initialize the search index:

```typescript
const service = new EmbeddingsService(...);
await service.initializeIndex();
```

### 3. Make Suggestions Request

```bash
curl -X POST http://localhost:7071/api/acord/suggest-labels \
  -H "Content-Type: application/json" \
  -d '{
    "fields": [
      {
        "fieldName": "Full Name",
        "content": "John Smith"
      },
      {
        "fieldName": "Address",
        "content": "123 Main St, Springfield, IL 62701"
      }
    ],
    "documentType": "homeowners",
    "topK": 3
  }'
```

## 📊 API Specification

### Request Format

```typescript
interface AcordSuggestionRequest {
  fields: FieldContent[];           // Array of fields to process
  documentType?: string;            // e.g., "homeowners", "commercial"
  topK?: number;                    // Suggestions per field (default: 3)
}

interface FieldContent {
  fieldName: string;                // Name/label of the field
  content: string;                  // Field value
  fieldType?: string;               // e.g., "text", "date", "numeric"
  position?: {                      // Optional field position on form
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### Response Format

```typescript
interface AcordSuggestionResponse {
  success: boolean;
  documentType?: string;
  suggestions: SuggestionResult[];   // Per-field suggestions
  metadata: {
    processedAt: string;             // ISO timestamp
    processingTimeMs: number;        // Execution time
    fieldsProcessed: number;         // Count of processed fields
    modelsUsed: string[];           // List of models used
  };
  error?: string;                    // Error message if failed
}

interface SuggestionResult {
  fieldName: string;
  suggestedLabels: LabelSuggestion[];
  confidence: number;                // 0-1 overall confidence
  reasoning: string[];              // Explanation of suggestions
}

interface LabelSuggestion {
  label: AcordLabel;
  score: number;                    // 0-1 combined score
  method: "vector" | "rule-based" | "pattern" | "hybrid";
  explanation: string;              // Why this label was suggested
}
```

### Example Response

```json
{
  "success": true,
  "suggestions": [
    {
      "fieldName": "Full Name",
      "confidence": 0.95,
      "suggestedLabels": [
        {
          "label": {
            "id": "acord_insured_name",
            "name": "Insured Name",
            "description": "Legal name of the insured",
            "category": "Insured",
            "fieldType": "text"
          },
          "score": 0.98,
          "method": "hybrid",
          "explanation": "Suggested as Insured Name based on semantic match (98%) and rule-based match (95%)"
        }
      ],
      "reasoning": [
        "Detected patterns: text",
        "Performing semantic search...",
        "Vector search returned 10 candidates",
        "Applying rule-based post-processing..."
      ]
    }
  ],
  "metadata": {
    "processedAt": "2024-01-15T10:30:00.000Z",
    "processingTimeMs": 245,
    "fieldsProcessed": 1,
    "modelsUsed": ["embeddings", "vector-search", "rules"]
  }
}
```

## 🔧 ACORD Labels Database

The system includes 20+ standard ACORD insurance labels:

### Insured Information
- `acord_insured_name` - Legal name of insured
- `acord_insured_address` - Mailing address
- `acord_insured_city` - City
- `acord_insured_state` - State/Province
- `acord_insured_zip` - ZIP/Postal code

### Producer/Agent
- `acord_producer_name` - Insurance agent/broker name
- `acord_producer_code` - Producer license number

### Policy
- `acord_policy_number` - Unique policy identifier
- `acord_effective_date` - Policy start date
- `acord_expiration_date` - Policy end date

### Coverage
- `acord_coverage_type` - Type of coverage
- `acord_coverage_limit` - Maximum covered amount
- `acord_deductible` - Amount insured pays first

### Loss/Claims
- `acord_loss_date` - Date loss occurred
- `acord_loss_description` - Description of loss
- `acord_loss_location` - Where loss occurred
- `acord_claim_number` - Claim identifier
- `acord_claim_status` - Current claim status

### Other
- `acord_notes` - Additional notes/comments

Each label includes:
- ID and name
- Description and field type
- Example field names
- Regex pattern for matching
- Priority score

## 🧠 Smart Rules System

### Multi-Field Component Detection

Automatically recognizes and extracts:

1. **Addresses** (confidence: 0.95)
   - Pattern: "123 Main St, City, ST 12345"
   - Extracts: street, city, state, ZIP separately

2. **Dates** (confidence: 0.95)
   - Formats: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD, etc.
   - Boost: Triggers date field suggestions

3. **Phone Numbers** (confidence: 0.9)
   - Formats: (123) 456-7890, 123-456-7890, 123.456.7890

4. **Emails** (confidence: 0.95)
   - Standard email format detection

5. **Monetary Amounts** (confidence: 0.9)
   - Formats: $1,234.56, $1234.56, 1,234.56
   - Boost: Triggers coverage/deductible suggestions

6. **Numbers** (confidence: 0.95)
   - Any numeric value
   - Boost: Triggers policy/claim number suggestions

### Scoring Pipeline

```
Initial Vector Score (0-1)
    ↓
+ Context-Based Adjustments (+0.1 to +0.2)
+ Component Bonus (up to +0.2)
+ Pattern Match Bonus (+0.3)
+ Priority Boost (0-0.1)
+ Position Bias (±0.05-0.1)
    ↓
= Final Score (capped at 1.0)
```

### Applied Rules

1. **POSITION_BIAS_FIRST** - Boost header elements in first field
2. **POSITION_BIAS_LAST** - Boost notes in last field
3. **ADDRESS_CONTEXT** - Trigger address field group
4. **DATE_CONTEXT** - Trigger date field suggestions
5. **AMOUNT_CONTEXT** - Trigger coverage/deductible
6. **NUMERIC_CONTEXT** - Trigger ID fields
7. **COMPONENT_DETECTION** - Boost based on detected parts
8. **PATTERN_MATCH** - Direct regex pattern matching
9. **PRIORITY_BOOST** - Apply label priority scores
10. **CATEGORY_CONSISTENCY** - Group related fields

## 💡 Usage Examples

### Example 1: Simple Field

```javascript
const request = {
  fields: [{
    fieldName: "Policy Number",
    content: "POL-2024-001234"
  }]
};

// Result: Suggests "acord_policy_number" with 0.99 confidence
```

### Example 2: Address Field with Splitting

```javascript
const request = {
  fields: [{
    fieldName: "Mailing Address",
    content: "123 Oak Street, Springfield, IL 62701"
  }]
};

// Result: Suggests multiple labels with component detection
// - "acord_insured_address" for street
// - "acord_insured_city" for city
// - "acord_insured_state" for state
// - "acord_insured_zip" for ZIP
```

### Example 3: Date Field

```javascript
const request = {
  fields: [{
    fieldName": "Effective Date",
    "content": "01/15/2024"
  }]
};

// Result: Suggests "acord_effective_date" with 0.95+ confidence
// Boosts because field name contains "Effective"
```

### Example 4: Full Form Processing

```javascript
const request = {
  fields: [
    { fieldName: "Name", content: "John Smith" },
    { fieldName: "Address", content: "123 Main St, Springfield, IL 62701" },
    { fieldName: "Policy #", content: "POL-123456" },
    { fieldName: "Coverage Limit", content: "$250,000" },
    { fieldName: "Deductible", content: "$1,000" }
  ],
  documentType: "homeowners",
  topK: 3
};

// Result: Suggests appropriate label for each field
```

## 🔐 Azure Setup

### Prerequisites
- Azure Subscription
- Azure OpenAI resource with text-embedding-3-small deployment
- Azure AI Search service

### Step 1: Create Azure OpenAI Resource

```bash
az cognitiveservices account create \
  --resource-group myResourceGroup \
  --name myOpenAI \
  --kind OpenAI \
  --sku s0 \
  --location eastus

# Deploy text-embedding-3-small model
```

### Step 2: Create Azure AI Search Resource

```bash
az search service create \
  --resource-group myResourceGroup \
  --name mySearchService \
  --sku standard
```

### Step 3: Create Search Index

Index schema includes fields for storing ACORD labels with vector embeddings:

```json
{
  "name": "acord-labels",
  "fields": [
    { "name": "id", "type": "Edm.String", "key": true },
    { "name": "labelId", "type": "Edm.String", "searchable": true },
    { "name": "labelName", "type": "Edm.String", "searchable": true },
    { "name": "description", "type": "Edm.String", "searchable": true },
    { "name": "category", "type": "Edm.String", "searchable": true },
    { "name": "examples", "type": "Edm.String", "searchable": true },
    {
      "name": "embedding",
      "type": "Collection(Edm.Single)",
      "searchable": true,
      "retrievable": true,
      "dimensions": 1536,
      "vectorSearchConfiguration": "default"
    }
  ]
}
```

### Step 4: Get Connection Strings

```bash
# OpenAI endpoint
az cognitiveservices account show \
  --name myOpenAI \
  --resource-group myResourceGroup \
  --query "properties.endpoint"

# Search endpoint
az search service show \
  --name mySearchService \
  --resource-group myResourceGroup \
  --query "apiVersion"
```

## 🚀 Deployment

### Local Testing
```bash
npm install
npm run build
npm run dev
```

### Deploy to Azure

```bash
# Publish to Function App
func azure functionapp publish myFunctionApp

# Or with Azure CLI
az functionapp deployment source config-zip \
  --resource-group myResourceGroup \
  --name myFunctionApp \
  --src-path dist.zip
```

## 📈 Performance

- **Processing Time**: ~200-400ms per request (varies with field complexity)
- **Vector Search**: ~100-150ms
- **Rule Processing**: ~50-100ms
- **Total Latency**: < 500ms typical

## 🧪 Testing

Test with curl:

```bash
curl -X POST http://localhost:7071/api/acord/suggest-labels \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "fields": [
    {
      "fieldName": "Policyholder",
      "content": "Jane Doe"
    },
    {
      "fieldName": "Premium Amount",
      "content": "$1,500.00"
    }
  ],
  "documentType": "homeowners",
  "topK": 3
}
EOF
```

## 📚 Related Services

This service works with:
- **extractText function** - Extracts text from PDFs
- **FormDesigner component** - Frontend form designer
- **Document Intelligence** - OCR for form fields

## 🔗 Integration

Use in FormDesigner to:

1. Extract form fields from PDF using OCR
2. Call suggest-labels endpoint
3. Populate form design with ACORD labels
4. Show confidence scores to user

## ❓ Troubleshooting

### "Missing required environment variables"
Check all environment variables are set in `local.settings.json`

### "Vector search returned 0 results"
Ensure search index is initialized with `await service.initializeIndex()`

### Low confidence scores
- Try more specific field names
- Provide more complete field content
- Check if label patterns match your fields

### Slow performance
- Vector search is slower on first call (model loading)
- Subsequent calls are faster with caching
- Adjust `topK` parameter to get fewer candidates
