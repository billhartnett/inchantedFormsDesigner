/**
 * Azure OpenAI Embeddings and AI Search Integration Service
 * Generates embeddings and performs semantic search for ACORD labels
 */

import {
  OpenAIClient,
  AzureKeyCredential,
} from "@azure/openai";
import { SearchClient } from "@azure/search-documents";
import {
  AcordLabel,
  ACORD_LABELS,
  LabelSuggestion,
  SuggestionResult,
} from "./acordModels";

export interface SearchIndex {
  id: string;
  labelId: string;
  labelName: string;
  description: string;
  category: string;
  examples: string;
  embedding: number[];
}

export class EmbeddingsService {
  private openaiClient: OpenAIClient;
  private searchClient: SearchClient<SearchIndex>;
  private deploymentId: string;
  private indexName: string;

  constructor(
    openaiEndpoint: string,
    openaiKey: string,
    openaiDeploymentId: string,
    searchEndpoint: string,
    searchKey: string,
    searchIndexName: string
  ) {
    this.openaiClient = new OpenAIClient(openaiEndpoint, new AzureKeyCredential(openaiKey));
    this.deploymentId = openaiDeploymentId;

    // Initialize search client
    this.searchClient = new SearchClient<SearchIndex>(
      searchEndpoint,
      searchIndexName,
      new AzureKeyCredential(searchKey)
    );
    this.indexName = searchIndexName;
  }

  /**
   * Initialize search index with ACORD labels
   * Call this once to populate the index
   */
  async initializeIndex(): Promise<void> {
    try {
      console.log("Initializing search index with ACORD labels...");

      // Generate embeddings for all labels
      const labelTexts = ACORD_LABELS.map(
        label => `${label.name} ${label.description} ${label.examples.join(" ")}`
      );

      const embeddings = await this.generateEmbeddings(labelTexts);

      // Create index documents
      const documents: SearchIndex[] = ACORD_LABELS.map((label, idx) => ({
        id: label.id,
        labelId: label.id,
        labelName: label.name,
        description: label.description,
        category: label.category,
        examples: label.examples.join("; "),
        embedding: embeddings[idx],
      }));

      // Upload documents to index
      await this.searchClient.uploadDocuments(documents);
      console.log(`Successfully indexed ${documents.length} ACORD labels`);
    } catch (error) {
      console.error("Error initializing search index:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text using Azure OpenAI
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];

      // Process in batches
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const response = await this.openaiClient.getEmbeddings(
          this.deploymentId,
          batch,
          {
            dimensions: 1536, // text-embedding-3-small dimensions
          }
        );

        response.data.forEach(item => {
          embeddings.push(item.embedding);
        });
      }

      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  /**
   * Search for similar labels using vector search
   */
  async searchSimilarLabels(
    query: string,
    topK: number = 5
  ): Promise<{ label: AcordLabel; score: number }[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings([query]);
      const queryVector = queryEmbedding[0];

      // Perform vector search
      const results = await this.searchClient.search("*", {
        vectorSearchOptions: {
          queries: [
            {
              kind: "vector",
              k: topK,
              fields: ["embedding"],
              vector: queryVector,
            },
          ],
        },
      });

      const labels = ACORD_LABELS.map(l => ({ label: l, id: l.id }));
      const matches: { label: AcordLabel; score: number }[] = [];

      for await (const result of results.results) {
        const doc = result.document as SearchIndex;
        const label = labels.find(l => l.id === doc.labelId)?.label;

        if (label) {
          matches.push({
            label,
            score: result.score || 0,
          });
        }
      }

      return matches;
    } catch (error) {
      console.error("Error searching similar labels:", error);
      throw error;
    }
  }

  /**
   * Perform hybrid search (vector + keyword)
   */
  async hybridSearch(
    query: string,
    topK: number = 5
  ): Promise<{ label: AcordLabel; score: number }[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings([query]);
      const queryVector = queryEmbedding[0];

      // Perform hybrid search
      const results = await this.searchClient.search(query, {
        top: topK,
        vectorSearchOptions: {
          queries: [
            {
              kind: "vector",
              k: topK,
              fields: ["embedding"],
              vector: queryVector,
            },
          ],
        },
      });

      const labels = ACORD_LABELS.map(l => ({ label: l, id: l.id }));
      const matches: { label: AcordLabel; score: number }[] = [];

      for await (const result of results.results) {
        const doc = result.document as SearchIndex;
        const label = labels.find(l => l.id === doc.labelId)?.label;

        if (label) {
          matches.push({
            label,
            score: result.score || 0,
          });
        }
      }

      return matches;
    } catch (error) {
      console.error("Error performing hybrid search:", error);
      throw error;
    }
  }

  /**
   * Rank labels by semantic similarity
   */
  async rankLabels(
    fieldName: string,
    fieldContent: string,
    topK: number = 10
  ): Promise<Map<string, number>> {
    try {
      // Combine field name and content for better context
      const query = `${fieldName}: ${fieldContent}`;

      // Perform hybrid search
      const matches = await this.hybridSearch(query, topK);

      // Create score map
      const scores = new Map<string, number>();
      matches.forEach((match, index) => {
        // Normalize score to 0-1 range and apply ranking decay
        const normalizedScore = Math.max(0, match.score / 10); // Adjust divisor based on actual scores
        const decayedScore = normalizedScore * (1 - index * 0.05); // Decay based on rank
        scores.set(match.label.id, decayedScore);
      });

      return scores;
    } catch (error) {
      console.error("Error ranking labels:", error);
      throw error;
    }
  }

  /**
   * Get label information by ID
   */
  getLabelById(labelId: string): AcordLabel | undefined {
    return ACORD_LABELS.find(l => l.id === labelId);
  }
}
