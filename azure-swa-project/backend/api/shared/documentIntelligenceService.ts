import { DocumentAnalysisClient } from "@azure/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";
import { BlobClient } from "@azure/storage-blob";

export interface ExtractionResult {
  documentType: string;
  pages: any[];
  rawContent: string;
  metadata: { pageCount: number; extractedAt: string; };
}

export class DocumentIntelligenceService {
  private client: DocumentAnalysisClient;

  constructor(endpoint: string, key: string) {
    this.client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  }

  async extractFromBlob(blobClient: BlobClient): Promise<ExtractionResult> {
    const downloadBlockBlobResponse = await blobClient.download();
    const buffer = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody!);
    return this.extractFromBuffer(buffer);
  }

  async extractFromBuffer(buffer: Buffer): Promise<ExtractionResult> {
    const poller = await this.client.beginAnalyzeDocument("prebuilt-read", buffer);
    const result = await poller.pollUntilDone();
    
    return {
      documentType: result.documentType || "unknown",
      pages: result.pages || [],
      rawContent: result.content || "",
      metadata: {
        pageCount: result.pages?.length || 0,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  private async streamToBuffer(readableStream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on("data", (data: Buffer) => chunks.push(data));
      readableStream.on("end", () => resolve(Buffer.concat(chunks)));
      readableStream.on("error", reject);
    });
  }
}
