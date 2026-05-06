import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { LabelSuggestionService } from "../shared/acord/labelSuggestionService";
import { EmbeddingsService } from "../shared/acord/embeddingsService";
import { AcordSuggestionRequest } from "../shared/acord/acordModels";

async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Suggest ACORD labels HTTP trigger function received request");

  try {
    const openaiEndpoint = process.env.OPENAI_ENDPOINT;
    const openaiKey = process.env.OPENAI_KEY;
    const openaiDeploymentId = process.env.OPENAI_DEPLOYMENT_ID;
    const searchEndpoint = process.env.SEARCH_ENDPOINT;
    const searchKey = process.env.SEARCH_KEY;
    const searchIndexName = process.env.SEARCH_INDEX_NAME || "acord-labels";

    const requiredEnvVars = [
      "OPENAI_ENDPOINT",
      "OPENAI_KEY",
      "OPENAI_DEPLOYMENT_ID",
      "SEARCH_ENDPOINT",
      "SEARCH_KEY",
    ];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          error: `Missing required environment variables: ${missingVars.join(", ")}`,
        }),
      };
    }

    const requestBody: AcordSuggestionRequest = (await request.json()) as AcordSuggestionRequest;

    if (!requestBody.fields || !Array.isArray(requestBody.fields) || requestBody.fields.length === 0) {
      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: "Request must include 'fields' array with at least one field",
        }),
      };
    }

    for (const field of requestBody.fields) {
      if (!field.fieldName || !field.content) {
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            error: "Each field must have 'fieldName' and 'content' properties",
          }),
        };
      }
    }

    context.log(`Processing ${requestBody.fields.length} fields for label suggestions`);

    const embeddingsService = new EmbeddingsService(
      openaiEndpoint!,
      openaiKey!,
      openaiDeploymentId!,
      searchEndpoint!,
      searchKey!,
      searchIndexName
    );

    const labelService = new LabelSuggestionService(embeddingsService);
    const response = await labelService.suggestLabels(requestBody);

    context.log(`Successfully generated suggestions for ${response.suggestions.length} fields`);

    return {
      status: response.success ? 200 : 500,
      body: JSON.stringify(response),
    };
  } catch (error) {
    context.log(`Error processing request: ${error}`);

    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

export default httpTrigger;