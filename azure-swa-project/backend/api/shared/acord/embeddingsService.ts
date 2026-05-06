import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export class EmbeddingsService {
  private client: OpenAIClient;
  private deploymentId: string;

  constructor(endpoint: string, apiKey: string, deploymentId: string = "text-embedding-ada-002") {
    this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    this.deploymentId = deploymentId;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.client.getEmbeddings(this.deploymentId, texts);
    return response.data.map((item: any) => item.embedding);
  }

  calculateSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async findMostSimilar(query: string, options: string[], topK: number = 3) {
    const queryEmbed = await this.generateEmbedding(query);
    const optionEmbeds = await this.generateEmbeddings(options);
    const scores = optionEmbeds.map((embed, i) => ({
      option: options[i],
      score: this.calculateSimilarity(queryEmbed, embed),
    }));
    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
