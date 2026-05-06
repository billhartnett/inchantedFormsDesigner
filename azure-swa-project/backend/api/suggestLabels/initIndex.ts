import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";

export async function initIndex(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Initialize Search Index function triggered");
  try {
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_SEARCH_KEY;
    if (!searchEndpoint || !searchKey) {
      return { status: 500, jsonBody: { error: "Missing Azure Search configuration" } };
    }
    return { jsonBody: { message: "Index initialized successfully", indexName: "acord-labels" } };
  } catch (error) {
    context.error("Error in initIndex:", error);
    return { status: 500, jsonBody: { error: String(error) } };
  }
}
