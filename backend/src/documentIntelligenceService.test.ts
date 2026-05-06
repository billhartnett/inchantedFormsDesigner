/**
 * Example test file for DocumentIntelligenceService
 * 
 * To run tests:
 * npm test
 */

import { DocumentIntelligenceService } from "../src/documentIntelligenceService";

describe("DocumentIntelligenceService", () => {
  let service: DocumentIntelligenceService;

  beforeAll(() => {
    // Initialize service with environment variables
    service = new DocumentIntelligenceService(
      process.env.DOCUMENT_INTELLIGENCE_ENDPOINT || "",
      process.env.DOCUMENT_INTELLIGENCE_KEY || "",
      process.env.AZURE_STORAGE_CONNECTION_STRING || ""
    );
  });

  describe("extractFromBlob", () => {
    it("should extract text from a PDF in blob storage", async () => {
      // This test requires actual Azure resources
      // Comment out or skip in CI/CD if running without Azure credentials
      
      const result = await service.extractFromBlob(
        "test-container",
        "test-document.pdf"
      );

      expect(result).toBeDefined();
      expect(result.documentName).toBe("test-document.pdf");
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.pages.length).toBe(result.pageCount);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should extract words with bounding boxes", async () => {
      const result = await service.extractFromBlob(
        "test-container",
        "test-document.pdf"
      );

      const firstPage = result.pages[0];
      expect(firstPage.words.length).toBeGreaterThan(0);

      const firstWord = firstPage.words[0];
      expect(firstWord.text).toBeDefined();
      expect(firstWord.boundingBox).toBeDefined();
      expect(firstWord.boundingBox.x).toBeGreaterThanOrEqual(0);
      expect(firstWord.boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(firstWord.boundingBox.width).toBeGreaterThan(0);
      expect(firstWord.boundingBox.height).toBeGreaterThan(0);
      expect(firstWord.confidence).toBeGreaterThan(0);
    });
  });

  describe("listPdfsInContainer", () => {
    it("should list all PDFs in a container", async () => {
      const pdfs = await service.listPdfsInContainer("test-container");

      expect(Array.isArray(pdfs)).toBe(true);
      pdfs.forEach(pdf => {
        expect(pdf.toLowerCase().endsWith(".pdf")).toBe(true);
      });
    });
  });
});
