import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { LabelSuggestionService } from "../../src/acord/labelSuggestionService";
import { EmbeddingsService } from "../../src/acord/embeddingsService";
import { AcordSuggestionRequest } from "../../src/acord/acordModels";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log("Suggest ACORD labels HTTP trigger function received request");

  try {
    // Validate environment variables
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
      context.res = {
        status: 500,
        body: {
          success: false,
          error: `Missing required environment variables: ${missingVars.join(", ")}`,
        },
      };
      return;
    }

    // Parse request
    const request: AcordSuggestionRequest = req.body;

    if (!request.fields || !Array.isArray(request.fields) || request.fields.length === 0) {
      context.res = {
        status: 400,
        body: {
          success: false,
          error: "Request must include 'fields' array with at least one field",
        },
      };
      return;
    }

    // Validate field structure
    for (const field of request.fields) {
      if (!field.fieldName || !field.content) {
        context.res = {
          status: 400,
          body: {
            success: false,
            error: "Each field must have 'fieldName' and 'content' properties",
          },
        };
        return;
      }
    }

    context.log(`Processing ${request.fields.length} fields for label suggestions`);

    // Initialize services
    const embeddingsService = new EmbeddingsService(
      openaiEndpoint!,
      openaiKey!,
      openaiDeploymentId!,
      searchEndpoint!,
      searchKey!,
      searchIndexName
    );

    const labelService = new LabelSuggestionService(embeddingsService);

    // Get suggestions
    const response = await labelService.suggestLabels(request);

    context.log(`Successfully generated suggestions for ${response.suggestions.length} fields`);

    context.res = {
      status: response.success ? 200 : 500,
      body: response,
    };
  } catch (error) {
    context.log.error(`Error processing request: ${error}`);

    context.res = {
      status: 500,
      body: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
};

export default httpTrigger;
