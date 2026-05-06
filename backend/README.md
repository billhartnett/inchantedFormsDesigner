# Backend - inchantedFormsDesigner

Backend API and services for the inchantedFormsDesigner monorepo, built with Azure Functions and TypeScript.

## 📁 Structure

```
backend/
├── src/
│   └── documentIntelligenceService.ts    (Document Intelligence service)
│
├── api/
│   └── extractText/
│       ├── index.ts                     (HTTP trigger function)
│       └── function.json                (Function configuration)
│
├── package.json                         (Dependencies)
├── tsconfig.json                        (TypeScript config)
├── local.settings.json                  (Local development settings)
└── README.md
```

## 🚀 Features

### Document Intelligence Integration

- ✅ Extract text from PDFs using Azure AI Document Intelligence (Read OCR)
- ✅ Extract bounding boxes for all text elements
- ✅ Per-word confidence scores
- ✅ Language detection
- ✅ Multi-page document support
- ✅ Blob Storage integration

## 📦 Dependencies

```json
{
  "@azure/storage-blob": "^3.23.0",
  "@azure/ai-document-intelligence": "^1.0.0",
  "azure-functions-core-tools": "^4.0.5248"
}
```

## 🔧 Setup

### Prerequisites

- Node.js 18+
- Azure Storage Account
- Azure AI Document Intelligence resource
- Azure Functions Core Tools

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `local.settings.json.template` to `local.settings.json` and fill in your Azure credentials:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "your_storage_connection_string",
    "DOCUMENT_INTELLIGENCE_ENDPOINT": "https://your-resource.cognitiveservices.azure.com/",
    "DOCUMENT_INTELLIGENCE_KEY": "your_document_intelligence_key",
    "AZURE_STORAGE_CONNECTION_STRING": "your_storage_connection_string",
    "FUNCTIONS_WORKER_RUNTIME": "node"
  }
}
```

### 3. Build

```bash
npm run build
```

### 4. Run Locally

```bash
npm run dev
# or
func start
```

## 📝 API Endpoints

### POST /api/ocr/extract-text

Extract text and bounding boxes from a PDF.

**Request:**
```json
{
  "containerName": "pdfs",
  "blobName": "document.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully extracted text from 1 page(s)",
  "data": {
    "documentName": "document.pdf",
    "pageCount": 1,
    "language": "en",
    "confidence": 0.98,
    "extractedAt": "2024-01-15T10:30:00.000Z",
    "pages": [
      {
        "pageNumber": 1,
        "width": 612,
        "height": 792,
        "angle": 0,
        "unit": "pixel",
        "lines": [
          {
            "text": "Sample text line",
            "boundingBox": {
              "x": 50,
              "y": 100,
              "width": 200,
              "height": 20
            },
            "words": [
              {
                "text": "Sample",
                "boundingBox": {
                  "x": 50,
                  "y": 100,
                  "width": 45,
                  "height": 20
                },
                "confidence": 0.99
              },
              {
                "text": "text",
                "boundingBox": {
                  "x": 100,
                  "y": 100,
                  "width": 35,
                  "height": 20
                },
                "confidence": 0.99
              }
            ]
          }
        ],
        "words": [
          {
            "text": "Sample",
            "boundingBox": { "x": 50, "y": 100, "width": 45, "height": 20 },
            "confidence": 0.99
          }
        ]
      }
    ]
  }
}
```

## 🔍 DocumentIntelligenceService API

### Methods

#### `extractFromBlob(containerName, blobName): Promise<ExtractedDocument>`

Extract text and bounding boxes from a PDF in Azure Blob Storage.

```typescript
const service = new DocumentIntelligenceService(
  endpoint,
  key,
  connectionString
);

const result = await service.extractFromBlob("pdfs", "document.pdf");
console.log(result);
```

#### `extractFromFile(filePath): Promise<ExtractedDocument>`

Extract text and bounding boxes from a local PDF file.

```typescript
const result = await service.extractFromFile("/path/to/document.pdf");
console.log(result);
```

#### `listPdfsInContainer(containerName): Promise<string[]>`

List all PDFs in a blob container.

```typescript
const pdfs = await service.listPdfsInContainer("pdfs");
console.log(pdfs); // ["document1.pdf", "document2.pdf"]
```

## 📊 Data Structures

### ExtractedDocument

```typescript
interface ExtractedDocument {
  documentName: string;           // Name of the PDF
  pageCount: number;              // Total pages extracted
  language: string;               // Detected language (e.g., "en")
  pages: DocumentPage[];           // Array of extracted pages
  extractedAt: string;            // ISO timestamp of extraction
  confidence: number;             // Average confidence score (0-1)
}
```

### DocumentPage

```typescript
interface DocumentPage {
  pageNumber: number;             // 1-indexed page number
  width: number;                  // Page width in pixels
  height: number;                 // Page height in pixels
  angle: number;                  // Rotation angle (0, 90, 180, 270)
  unit: string;                   // "pixel" or other unit
  lines: TextLine[];              // Extracted text lines
  words: Word[];                  // All words on page
}
```

### TextLine

```typescript
interface TextLine {
  text: string;                   // Full line text
  boundingBox: {
    x: number;                    // X coordinate
    y: number;                    // Y coordinate
    width: number;                // Width of bounding box
    height: number;               // Height of bounding box
  };
  words: Word[];                  // Individual words in line
}
```

### Word

```typescript
interface Word {
  text: string;                   // Word text
  boundingBox: {
    x: number;                    // X coordinate
    y: number;                    // Y coordinate
    width: number;                // Width of bounding box
    height: number;               // Height of bounding box
  };
  confidence: number;             // Confidence score (0-1)
}
```

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCUMENT_INTELLIGENCE_ENDPOINT` | Azure Document Intelligence endpoint | `https://myresource.cognitiveservices.azure.com/` |
| `DOCUMENT_INTELLIGENCE_KEY` | Document Intelligence API key | `abcd1234...` |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob Storage connection string | `DefaultEndpointsProtocol=https;...` |
| `AzureWebJobsStorage` | Azure Storage for Functions | (same as above) |
| `FUNCTIONS_WORKER_RUNTIME` | Node.js runtime | `node` |

## 🧪 Testing

### Local Testing

1. Add a PDF to your local blob storage or use the Azure Storage Emulator
2. Call the function via HTTP:

```bash
curl -X POST http://localhost:7071/api/ocr/extract-text \
  -H "Content-Type: application/json" \
  -d '{
    "containerName": "pdfs",
    "blobName": "test.pdf"
  }'
```

### Production Deployment

```bash
# Build
npm run build

# Deploy to Azure
func azure functionapp publish <FunctionAppName>
```

## 📚 Usage Examples

### JavaScript/TypeScript

```typescript
import { DocumentIntelligenceService } from './services/documentIntelligenceService';

const service = new DocumentIntelligenceService(
  process.env.DOCUMENT_INTELLIGENCE_ENDPOINT!,
  process.env.DOCUMENT_INTELLIGENCE_KEY!,
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

// Extract from blob
const result = await service.extractFromBlob('pdfs', 'invoice.pdf');

// Process the results
result.pages.forEach(page => {
  console.log(`Page ${page.pageNumber}:`);
  page.lines.forEach(line => {
    console.log(`  Line: ${line.text}`);
    console.log(`  Position: (${line.boundingBox.x}, ${line.boundingBox.y})`);
    console.log(`  Size: ${line.boundingBox.width}x${line.boundingBox.height}`);
  });
});
```

### HTTP Request

```bash
curl -X POST https://your-function-app.azurewebsites.net/api/ocr/extract-text \
  -H "Content-Type: application/json" \
  -d '{
    "containerName": "documents",
    "blobName": "form.pdf"
  }' \
  -H "x-functions-key: YOUR_FUNCTION_KEY"
```

## 🔄 Integration with Frontend

The frontend (FormDesigner) can call this function to extract text from uploaded PDFs:

```typescript
async function extractTextFromPDF(containerName: string, blobName: string) {
  const response = await fetch('/api/ocr/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      containerName,
      blobName
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Use extracted text and bounding boxes
    console.log(result.data);
  }
}
```

## 🚀 Deployment

### Azure Portal

1. Create an Azure Function App
2. Configure with Node.js runtime
3. Add Application Settings from `local.settings.json`
4. Deploy from Git or using `func azure functionapp publish`

### Azure CLI

```bash
# Create Function App
az functionapp create \
  --resource-group myResourceGroup \
  --consumption-plan-name myAppServicePlan \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name myFunctionApp

# Deploy
func azure functionapp publish myFunctionApp
```

## 📖 Documentation

- [Azure Document Intelligence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/)

## ✅ Status

✅ Extraction service: Complete  
✅ Azure Function: Complete  
✅ Blob Storage integration: Complete  
✅ Error handling: Complete  
✅ TypeScript support: Complete  

## 📝 Future Enhancements

- [ ] Form field recognition
- [ ] Table extraction
- [ ] Handwriting detection
- [ ] Document classification
- [ ] Batch processing
- [ ] Webhook support for async processing
- [ ] Queue-based triggers
- [ ] Result caching
