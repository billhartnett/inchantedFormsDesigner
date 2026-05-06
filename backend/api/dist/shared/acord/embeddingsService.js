"use strict";
/**
 * Azure OpenAI Embeddings and AI Search Integration Service
 * Generates embeddings and performs semantic search for ACORD labels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const openai_1 = require("openai");
const core_auth_1 = require("@azure/core-auth");
const search_documents_1 = require("@azure/search-documents");
const acordModels_1 = require("./acordModels");
class EmbeddingsService {
    constructor(openaiEndpoint, openaiKey, openaiDeploymentId, searchEndpoint, searchKey, searchIndexName) {
        this.openaiClient = new openai_1.AzureOpenAI({
            endpoint: openaiEndpoint,
            apiKey: openaiKey,
            apiVersion: "2024-10-21",
        });
        this.deploymentId = openaiDeploymentId;
        // Initialize search client
        this.searchClient = new search_documents_1.SearchClient(searchEndpoint, searchIndexName, new core_auth_1.AzureKeyCredential(searchKey));
        this.indexName = searchIndexName;
    }
    /**
     * Initialize search index with ACORD labels
     * Call this once to populate the index
     */
    async initializeIndex() {
        try {
            console.log("Initializing search index with ACORD labels...");
            // Generate embeddings for all labels
            const labelTexts = acordModels_1.ACORD_LABELS.map(label => `${label.name} ${label.description} ${label.examples.join(" ")}`);
            const embeddings = await this.generateEmbeddings(labelTexts);
            // Create index documents
            const documents = acordModels_1.ACORD_LABELS.map((label, idx) => ({
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
        }
        catch (error) {
            console.error("Error initializing search index:", error);
            throw error;
        }
    }
    /**
     * Generate embeddings for text using Azure OpenAI
     */
    async generateEmbeddings(texts) {
        try {
            const embeddings = [];
            // Process in batches
            const batchSize = 10;
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const response = await this.openaiClient.embeddings.create({
                    model: this.deploymentId,
                    input: batch,
                    dimensions: 1536, // text-embedding-3-small dimensions
                });
                response.data.forEach((item) => {
                    embeddings.push(item.embedding);
                });
            }
            return embeddings;
        }
        catch (error) {
            console.error("Error generating embeddings:", error);
            throw error;
        }
    }
    /**
     * Search for similar labels using vector search
     */
    async searchSimilarLabels(query, topK = 5) {
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
                            kNearestNeighborsCount: topK,
                            fields: ["embedding"],
                            vector: queryVector,
                        },
                    ],
                },
            });
            const labels = acordModels_1.ACORD_LABELS.map(l => ({ label: l, id: l.id }));
            const matches = [];
            for await (const result of results.results) {
                const doc = result.document;
                const label = labels.find(l => l.id === doc.labelId)?.label;
                if (label) {
                    matches.push({
                        label,
                        score: result.score || 0,
                    });
                }
            }
            return matches;
        }
        catch (error) {
            console.error("Error searching similar labels:", error);
            throw error;
        }
    }
    /**
     * Perform hybrid search (vector + keyword)
     */
    async hybridSearch(query, topK = 5) {
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
                            kNearestNeighborsCount: topK,
                            fields: ["embedding"],
                            vector: queryVector,
                        },
                    ],
                },
            });
            const labels = acordModels_1.ACORD_LABELS.map(l => ({ label: l, id: l.id }));
            const matches = [];
            for await (const result of results.results) {
                const doc = result.document;
                const label = labels.find(l => l.id === doc.labelId)?.label;
                if (label) {
                    matches.push({
                        label,
                        score: result.score || 0,
                    });
                }
            }
            return matches;
        }
        catch (error) {
            console.error("Error performing hybrid search:", error);
            throw error;
        }
    }
    /**
     * Rank labels by semantic similarity
     */
    async rankLabels(fieldName, fieldContent, topK = 10) {
        try {
            // Combine field name and content for better context
            const query = `${fieldName}: ${fieldContent}`;
            // Perform hybrid search
            const matches = await this.hybridSearch(query, topK);
            // Create score map
            const scores = new Map();
            matches.forEach((match, index) => {
                // Normalize score to 0-1 range and apply ranking decay
                const normalizedScore = Math.max(0, match.score / 10); // Adjust divisor based on actual scores
                const decayedScore = normalizedScore * (1 - index * 0.05); // Decay based on rank
                scores.set(match.label.id, decayedScore);
            });
            return scores;
        }
        catch (error) {
            console.error("Error ranking labels:", error);
            throw error;
        }
    }
    /**
     * Get label information by ID
     */
    getLabelById(labelId) {
        return acordModels_1.ACORD_LABELS.find(l => l.id === labelId);
    }
}
exports.EmbeddingsService = EmbeddingsService;
