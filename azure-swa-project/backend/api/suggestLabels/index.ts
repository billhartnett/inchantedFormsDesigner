import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { EmbeddingsService } from "../shared/acord/embeddingsService";
import { LabelSuggestionService, SuggestionField } from "../shared/acord/labelSuggestionService";

export async function suggestLabels(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Suggest Labels function triggered");
  try {
    const body = await request.json();
    const { fields } = body as { fields: SuggestionField[] };
    if (!fields || !Array.isArray(fields)) {
      return { status: 400, jsonBody: { error: "fields array is required" } };
    }
    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const openaiKey = process.env.AZURE_OPENAI_KEY;
    if (!openaiEndpoint || !openaiKey) {
      return { status: 500, jsonBody: { error: "Missing Azure OpenAI configuration" } };
    }
    const embeddingsService = new EmbeddingsService(openaiEndpoint, openaiKey);
    const labelService = new LabelSuggestionService(embeddingsService);
    const result = await labelService.getSuggestionsWithAnalysis(fields);
    return { jsonBody: result };
  } catch (error) {
    context.error("Error in suggestLabels:", error);
    return { status: 500, jsonBody: { error: String(error) } };
  }
}
