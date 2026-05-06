import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";
import { BlobServiceClient } from "@azure/storage-blob";

export interface Word {
  text: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface TextLine {
  text: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  words: Word[];
}

export interface DocumentPage {
  pageNumber: number;
  width: number;
  height: number;
  angle: number;
  unit: string;
  lines: TextLine[];
  words: Word[];
}

export interface ExtractedDocument {
  documentName: string;
  pageCount: number;
  language: string;
  pages: DocumentPage[];
  extractedAt: string;
  confidence: number;
}

export class DocumentIntelligenceService {
  private client: any;
  private blobClient: BlobServiceClient;

  constructor(
    documentIntelligenceEndpoint: string,
    documentIntelligenceKey: string,
    blobStorageConnectionString: string
  ) {
    this.client = DocumentIntelligence(
      documentIntelligenceEndpoint,
      new AzureKeyCredential(documentIntelligenceKey)
    );
    this.blobClient = BlobServiceClient.fromConnectionString(blobStorageConnectionString);
  }

  async extractFromBlob(containerName: string, blobName: string): Promise<ExtractedDocument> {
    try {
      const containerClient = this.blobClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);
      const blobUrl = blobClient.url;

      console.log(`Extracting document from: ${blobUrl}`);

      const poller = await this.client.beginAnalyzeDocumentFromUrl("prebuilt-read", blobUrl);
      const result = await poller.pollUntilDone();

      const extractedDocument = this.formatExtractedData(blobName, result);
      return extractedDocument;
    } catch (error) {
      console.error(`Error extracting document from blob: ${blobName}`, error);
      throw new Error(`Failed to extract document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async extractFromFile(filePath: string): Promise<ExtractedDocument> {
    try {
      const fs = await import("fs");
      const data = fs.readFileSync(filePath);

      console.log(`Extracting document from file: ${filePath}`);

      const poller = await this.client.beginAnalyzeDocument("prebuilt-read", data);
      const result = await poller.pollUntilDone();

      const extractedDocument = this.formatExtractedData(filePath, result);
      return extractedDocument;
    } catch (error) {
      console.error(`Error extracting document from file: ${filePath}`, error);
      throw new Error(`Failed to extract document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private formatExtractedData(documentName: string, result: any): ExtractedDocument {
    const pages: DocumentPage[] = [];

    if (result.pages) {
      for (const page of result.pages) {
        const lines: TextLine[] = [];
        const words: Word[] = [];

        if (page.lines) {
          for (const line of page.lines) {
            const lineWords: Word[] = [];

            if (line.words) {
              for (const word of line.words) {
                const bbox = this.normalizePolygonToBbox(word.polygon);
                lineWords.push({
                  text: word.content,
                  boundingBox: bbox,
                  confidence: word.confidence || 0.95,
                });
              }
            }

            const lineBbox = this.normalizePolygonToBbox(line.polygon);
            lines.push({
              text: line.content,
              boundingBox: lineBbox,
              words: lineWords,
            });

            words.push(...lineWords);
          }
        }

        pages.push({
          pageNumber: page.pageNumber,
          width: page.width,
          height: page.height,
          angle: page.angle || 0,
          unit: page.unit || "pixel",
          lines,
          words,
        });
      }
    }

    const allWords = pages.flatMap(p => p.words);
    const averageConfidence = allWords.length > 0
      ? allWords.reduce((sum, w) => sum + w.confidence, 0) / allWords.length
      : 0;

    return {
      documentName,
      pageCount: result.pages?.length || 0,
      language: result.languages?.[0]?.locale || "unknown",
      pages,
      extractedAt: new Date().toISOString(),
      confidence: averageConfidence,
    };
  }

  private normalizePolygonToBbox(polygon: number[]): { x: number; y: number; width: number; height: number } {
    if (!polygon || polygon.length < 4) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = [];
    const ys = [];

    for (let i = 0; i < polygon.length; i += 2) {
      xs.push(polygon[i]);
      ys.push(polygon[i + 1]);
    }

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  async listPdfsInContainer(containerName: string): Promise<string[]> {
    try {
      const containerClient = this.blobClient.getContainerClient(containerName);
      const pdfs: string[] = [];

      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.toLowerCase().endsWith(".pdf")) {
          pdfs.push(blob.name);
        }
      }

      return pdfs;
    } catch (error) {
      console.error(`Error listing PDFs in container ${containerName}:`, error);
      throw new Error(`Failed to list PDFs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
