import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { DocumentIntelligenceService } from "../shared/documentIntelligenceService";

export async function extractText(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("HTTP trigger function processed a request.");
  try {
    const body = await request.json() as any;
    const { containerName, blobName } = body;
    if (!containerName || !blobName) {
      return { status: 400, jsonBody: { error: "containerName and blobName are required" } };
    }
    const docIntelligenceEndpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
    const docIntelligenceKey = process.env.DOCUMENT_INTELLIGENCE_KEY;
    const blobStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!docIntelligenceEndpoint || !docIntelligenceKey || !blobStorageConnectionString) {
      return { status: 500, jsonBody: { error: "Missing required environment variables" } };
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(blobStorageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const service = new DocumentIntelligenceService(docIntelligenceEndpoint, docIntelligenceKey);
    const result = await service.extractFromBlob(blobClient);
    return { jsonBody: result };
  } catch (error) {
    context.error("Error in extractText:", error);
    return { status: 500, jsonBody: { error: String(error) } };
  }
}
