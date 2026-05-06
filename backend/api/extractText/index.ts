import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DocumentIntelligenceService } from "../shared/documentIntelligenceService";

interface ExtractTextRequest {
  containerName: string;
  blobName: string;
}

interface ExtractTextResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Extract text HTTP trigger function received request");

  try {
    const documentIntelligenceEndpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
    const documentIntelligenceKey = process.env.DOCUMENT_INTELLIGENCE_KEY;
    const blobStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!documentIntelligenceEndpoint || !documentIntelligenceKey || !blobStorageConnectionString) {
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          error: "Missing required environment variables",
        } as ExtractTextResponse),
      };
    }

    const requestBody: ExtractTextRequest = (await request.json()) as ExtractTextRequest;

    if (!requestBody.containerName || !requestBody.blobName) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: "Missing required fields: containerName and blobName",
        } as ExtractTextResponse),
      };
    }

    context.log(`Processing PDF: ${requestBody.containerName}/${requestBody.blobName}`);

    const service = new DocumentIntelligenceService(
      documentIntelligenceEndpoint,
      documentIntelligenceKey,
      blobStorageConnectionString
    );

    const extractedDocument = await service.extractFromBlob(
      requestBody.containerName,
      requestBody.blobName
    );

    context.log(`Successfully extracted document with ${extractedDocument.pageCount} pages`);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: extractedDocument,
        message: `Successfully extracted text from ${extractedDocument.pageCount} page(s)`,
      } as ExtractTextResponse),
    };
  } catch (error) {
    context.log(`Error processing request: ${error}`);

    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as ExtractTextResponse),
    };
  }
}

export default httpTrigger;