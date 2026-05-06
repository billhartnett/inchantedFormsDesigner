# Deployment Guide - Document Intelligence Azure Function

Complete guide for deploying the Document Intelligence OCR Azure Function.

## 📋 Prerequisites

- Azure Subscription
- Azure CLI installed
- Node.js 18+
- Azure Functions Core Tools v4+
- Visual Studio Code (recommended)

## 🛠️ Step 1: Create Azure Resources

### 1.1 Create Resource Group

```bash
az group create \
  --name inchanted-rg \
  --location eastus
```

### 1.2 Create Storage Account

```bash
az storage account create \
  --resource-group inchanted-rg \
  --name inchangedstg$(date +%s) \
  --location eastus \
  --sku Standard_LRS
```

### 1.3 Create Document Intelligence Resource

```bash
az cognitiveservices account create \
  --resource-group inchanted-rg \
  --name inchanted-di \
  --kind DocumentIntelligence \
  --sku S0 \
  --location eastus \
  --yes
```

### 1.4 Create Function App

```bash
az functionapp create \
  --resource-group inchanted-rg \
  --consumption-plan-name inchanted-plan \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name inchanted-functions-$(date +%s) \
  --storage-account inchangedstg$(date +%s)
```

## 🔑 Step 2: Get Credentials

### 2.1 Get Storage Connection String

```bash
az storage account show-connection-string \
  --resource-group inchanted-rg \
  --name YOUR_STORAGE_ACCOUNT_NAME \
  --query connectionString \
  --output tsv
```

### 2.2 Get Document Intelligence Endpoint and Key

```bash
# Get endpoint
az cognitiveservices account show \
  --resource-group inchanted-rg \
  --name inchanted-di \
  --query "properties.endpoint" \
  --output tsv

# Get key
az cognitiveservices account keys list \
  --resource-group inchanted-rg \
  --name inchanted-di \
  --query "key1" \
  --output tsv
```

## 🔧 Step 3: Configure Function App

### 3.1 Set Application Settings

```bash
az functionapp config appsettings set \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --settings \
    DOCUMENT_INTELLIGENCE_ENDPOINT="https://YOUR_RESOURCE.cognitiveservices.azure.com/" \
    DOCUMENT_INTELLIGENCE_KEY="YOUR_KEY" \
    AZURE_STORAGE_CONNECTION_STRING="YOUR_CONNECTION_STRING"
```

### 3.2 Enable Managed Identity (Optional but Recommended)

```bash
az functionapp identity assign \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME
```

## 📦 Step 4: Build and Deploy

### 4.1 Build Locally

```bash
cd backend
npm install
npm run build
```

### 4.2 Deploy to Azure

```bash
func azure functionapp publish YOUR_FUNCTION_APP_NAME --build remote
```

Or with Azure CLI:

```bash
az functionapp deployment source config-zip \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --src-path ./backend/dist.zip
```

## ✅ Step 5: Verify Deployment

### 5.1 Check Function Logs

```bash
az functionapp log tail \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME
```

### 5.2 Test the Function

```bash
FUNCTION_URL=$(az functionapp function show \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --function-name extractText \
  --query "invokeUrlTemplate" \
  --output tsv)

# Get function key
FUNCTION_KEY=$(az functionapp keys list \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --query "functionKeys.default" \
  --output tsv)

# Test endpoint
curl -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -H "x-functions-key: ${FUNCTION_KEY}" \
  -d '{
    "containerName": "pdfs",
    "blobName": "test.pdf"
  }'
```

## 🔐 Step 6: Secure Your Function (Recommended)

### 6.1 Enable Function Authentication

```bash
az functionapp config set \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --generic-api-enabled false
```

### 6.2 Restrict to Azure AD

```bash
az functionapp config appsettings set \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --settings WEBSITE_AUTH_AAD_ENABLED=true
```

### 6.3 Configure CORS (if calling from web)

```bash
az functionapp cors add \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --allowed-origins "*"
```

## 📊 Step 7: Monitor and Scale

### 7.1 Enable Application Insights

```bash
az monitor app-insights component create \
  --resource-group inchanted-rg \
  --app inchanted-insights

# Link to Function App
INSIGHTS_KEY=$(az monitor app-insights component show \
  --resource-group inchanted-rg \
  --app inchanted-insights \
  --query "instrumentationKey" \
  --output tsv)

az functionapp config appsettings set \
  --resource-group inchanted-rg \
  --name YOUR_FUNCTION_APP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="${INSIGHTS_KEY}"
```

### 7.2 Create Alerts

```bash
# Alert on function errors
az monitor metrics alert create \
  --resource-group inchanted-rg \
  --name function-errors \
  --scopes "/subscriptions/{subscription-id}/resourceGroups/inchanted-rg/providers/Microsoft.Web/sites/{function-app-name}" \
  --condition "total Errors > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action myActionGroup
```

## 🐛 Troubleshooting

### Issue: "Missing required environment variables"

**Solution:** Verify all settings are configured in Azure Portal:
1. Function App → Configuration
2. Check DOCUMENT_INTELLIGENCE_ENDPOINT, DOCUMENT_INTELLIGENCE_KEY, AZURE_STORAGE_CONNECTION_STRING

### Issue: "Unauthorized - Cannot authenticate with provided credentials"

**Solution:** Verify credentials are correct:
```bash
# Test Document Intelligence
curl -X POST "https://YOUR_RESOURCE.cognitiveservices.azure.com/documentintelligence/document-models/prebuilt-read/analyze?api-version=2024-02-29-preview" \
  -H "Content-Type: application/octet-stream" \
  -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
  --data-binary "@test.pdf"
```

### Issue: "Container not found"

**Solution:** Create blob container:
```bash
az storage container create \
  --account-name YOUR_STORAGE_ACCOUNT \
  --name pdfs
```

## 📈 Performance Optimization

### 1. Use Premium Plan for Production

```bash
az functionapp plan create \
  --resource-group inchanted-rg \
  --name inchanted-premium-plan \
  --sku EP1
```

### 2. Enable Caching (if processing same PDFs)

Add Redis Cache:
```bash
az redis create \
  --resource-group inchanted-rg \
  --name inchanted-cache \
  --sku basic \
  --vm-size c0
```

### 3. Implement Batch Processing

Use Durable Functions for large PDF batches:
- More about: [Azure Durable Functions](https://learn.microsoft.com/en-us/azure/azure-functions/durable/)

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Document Intelligence Function

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Build
        run: |
          cd backend
          npm run build
      
      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: YOUR_FUNCTION_APP_NAME
          package: 'backend'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

## 📚 Additional Resources

- [Azure Functions Documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Document Intelligence Documentation](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/)
- [Azure Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)

## ✅ Deployment Checklist

- [ ] Azure resources created
- [ ] Credentials obtained
- [ ] Application settings configured
- [ ] Code built locally
- [ ] Function deployed successfully
- [ ] Endpoint tested
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Documentation updated
