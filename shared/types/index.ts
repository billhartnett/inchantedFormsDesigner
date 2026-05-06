/**
 * Shared types for inchantedFormsDesigner
 * Used by both frontend and backend
 */

// Document Intelligence extraction results

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WordOCR {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
}

export interface TextLineOCR {
  text: string;
  boundingBox: BoundingBox;
  words: WordOCR[];
}

export interface PageOCR {
  pageNumber: number;
  width: number;
  height: number;
  angle: number;
  unit: string;
  lines: TextLineOCR[];
  words: WordOCR[];
}

export interface ExtractedDocumentOCR {
  documentName: string;
  pageCount: number;
  language: string;
  pages: PageOCR[];
  extractedAt: string;
  confidence: number;
}

// API Request/Response types

export interface ExtractTextRequest {
  containerName: string;
  blobName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ExtractTextResponse = ApiResponse<ExtractedDocumentOCR>;

// Form Designer types (from FormDesigner component)

export interface TextFieldConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  placeholder?: string;
  name?: string;
}

export interface CheckboxConfig {
  id: string;
  x: number;
  y: number;
  size: number;
  checked: boolean;
  label: string;
  name?: string;
}

export interface FormDesignerData {
  version: string;
  backgroundImage?: string;
  textFields: TextFieldConfig[];
  checkboxes: CheckboxConfig[];
  stageWidth: number;
  stageHeight: number;
}

// Combined form with OCR data

export interface FormWithOCR {
  formLayout: FormDesignerData;
  ocrData: ExtractedDocumentOCR;
  createdAt: string;
  updatedAt: string;
}
