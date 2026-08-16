export interface PDFFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount: number;
  thumbnailUrls: string[];
  createdAt: Date;
}

export type TargetFormat =
  | "pdf"
  | "txt"
  | "jpeg"
  | "png"
  | "doc"
  | "docx"
  | "docm"
  | "xml"
  | "html"
  | "dotx"
  | "dotm"
  | "xps";

export interface ConversionOptions {
  targetFormat: TargetFormat;
  quality?: "low" | "medium" | "high";
  dpi?: number;
  preserveLayout?: boolean;
  ocrEnabled?: boolean;
  password?: string;
}

export type OperationType =
  | "ADD_TEXT"
  | "ADD_IMAGE"
  | "DELETE_PAGE"
  | "ROTATE_PAGE"
  | "REORDER_PAGE"
  | "ADD_ANNOTATION"
  | "HIGHLIGHT_TEXT"
  | "ADD_WATERMARK"
  | "COMPRESS"
  | "ENCRYPT"
  | "DECRYPT"
  | "ADD_PAGE_NUMBERS"
  | "SPLIT"
  | "MERGE";

export interface PdfOperation {
  id: string;
  type: OperationType;
  payload: unknown;
  timestamp: Date;
  reversible: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  data: ArrayBuffer;
  createdAt: Date;
}

export interface ConvertedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  format: TargetFormat | "zip";
  createdAt: Date;
}

export interface Annotation {
  id: string;
  page: number;
  text: string;
  createdAt: Date;
}