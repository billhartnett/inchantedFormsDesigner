import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DocumentIntelligenceService } from "../../src/documentIntelligenceService";

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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log("Extract text HTTP trigger function received request");

  try {
    const documentIntelligenceEndpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
    const documentIntelligenceKey = process.env.DOCUMENT_INTELLIGENCE_KEY;
    const blobStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!documentIntelligenceEndpoint || !documentIntelligenceKey || !blobStorageConnectionString) {
      context.res = {
        status: 500,
        body: {
          success: false,
          error: "Missing required environment variables",
        } as ExtractTextResponse,
      };
      return;
    }

    const requestBody: ExtractTextRequest = req.body;

    if (!requestBody.containerName || !requestBody.blobName) {
      context.res = {
        status: 400,
        body: {
          success: false,
          error: "Missing required fields: containerName and blobName",
        } as ExtractTextResponse,
      };
      return;
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

    context.res = {
      status: 200,
      body: {
        success: true,
        data: extractedDocument,
        message: `Successfully extracted text from ${extractedDocument.pageCount} page(s)`,
      } as ExtractTextResponse,
    };
  } catch (error) {
    context.log.error(`Error processing request: ${error}`);

    context.res = {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as ExtractTextResponse,
    };
  }
};

export default httpTrigger;
