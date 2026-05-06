"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentIntelligenceService = void 0;
const ai_document_intelligence_1 = __importDefault(require("@azure-rest/ai-document-intelligence"));
const core_auth_1 = require("@azure/core-auth");
const storage_blob_1 = require("@azure/storage-blob");
class DocumentIntelligenceService {
    constructor(documentIntelligenceEndpoint, documentIntelligenceKey, blobStorageConnectionString) {
        this.client = (0, ai_document_intelligence_1.default)(documentIntelligenceEndpoint, new core_auth_1.AzureKeyCredential(documentIntelligenceKey));
        this.blobClient = storage_blob_1.BlobServiceClient.fromConnectionString(blobStorageConnectionString);
    }
    async extractFromBlob(containerName, blobName) {
        try {
            const containerClient = this.blobClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlobClient(blobName);
            const blobUrl = blobClient.url;
            console.log(`Extracting document from: ${blobUrl}`);
            const poller = await this.client.beginAnalyzeDocumentFromUrl("prebuilt-read", blobUrl);
            const result = await poller.pollUntilDone();
            const extractedDocument = this.formatExtractedData(blobName, result);
            return extractedDocument;
        }
        catch (error) {
            console.error(`Error extracting document from blob: ${blobName}`, error);
            throw new Error(`Failed to extract document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async extractFromFile(filePath) {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const data = fs.readFileSync(filePath);
            console.log(`Extracting document from file: ${filePath}`);
            const poller = await this.client.beginAnalyzeDocument("prebuilt-read", data);
            const result = await poller.pollUntilDone();
            const extractedDocument = this.formatExtractedData(filePath, result);
            return extractedDocument;
        }
        catch (error) {
            console.error(`Error extracting document from file: ${filePath}`, error);
            throw new Error(`Failed to extract document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    formatExtractedData(documentName, result) {
        const pages = [];
        if (result.pages) {
            for (const page of result.pages) {
                const lines = [];
                const words = [];
                if (page.lines) {
                    for (const line of page.lines) {
                        const lineWords = [];
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
    normalizePolygonToBbox(polygon) {
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
    async listPdfsInContainer(containerName) {
        try {
            const containerClient = this.blobClient.getContainerClient(containerName);
            const pdfs = [];
            for await (const blob of containerClient.listBlobsFlat()) {
                if (blob.name.toLowerCase().endsWith(".pdf")) {
                    pdfs.push(blob.name);
                }
            }
            return pdfs;
        }
        catch (error) {
            console.error(`Error listing PDFs in container ${containerName}:`, error);
            throw new Error(`Failed to list PDFs: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.DocumentIntelligenceService = DocumentIntelligenceService;
