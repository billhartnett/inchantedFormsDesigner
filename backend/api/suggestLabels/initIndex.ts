import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { EmbeddingsService } from "../../src/acord/embeddingsService";

/**
 * Initialize Search Index - One-time setup function
 * Call this function once to populate the AI Search index with ACORD labels
 * 
 * Usage: POST /api/acord/init-index
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log("Initialize ACORD labels index - HTTP trigger");

  try {
    // Validate credentials
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

    context.log("Initializing ACORD labels search index...");

    const embeddingsService = new EmbeddingsService(
      openaiEndpoint!,
      openaiKey!,
      openaiDeploymentId!,
      searchEndpoint!,
      searchKey!,
      searchIndexName
    );

    await embeddingsService.initializeIndex();

    context.res = {
      status: 200,
      body: {
        success: true,
        message: "ACORD labels index initialized successfully",
        indexName: searchIndexName,
      },
    };
  } catch (error) {
    context.log.error(`Error initializing index: ${error}`);

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
