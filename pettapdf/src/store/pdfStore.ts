import { create } from "zustand";
import type { PDFFile, PdfOperation } from "@/types";

export type ToolId =
  | "select"
  | "text"
  | "image"
  | "highlight"
  | "annotate"
  | "rotate"
  | "delete";

interface PdfState {
  currentPdf: PDFFile | null;
  allPdfs: PDFFile[];
  currentPage: number;
  zoomLevel: number;
  selectedTool: ToolId;
  operations: PdfOperation[];
  setCurrentPdf: (pdf: PDFFile | null) => void;
  addPdf: (pdf: PDFFile) => void;
  updateCurrentPdf: (data: ArrayBuffer, pageCount: number, thumbnailUrls: string[]) => void;
  removePdf: (id: string) => void;
  setPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setTool: (tool: ToolId) => void;
  addOperation: (op: PdfOperation) => void;
  undoLastOperation: () => void;
  clearOperations: () => void;
}

export const usePdfStore = create<PdfState>((set) => ({
  currentPdf: null,
  allPdfs: [],
  currentPage: 1,
  zoomLevel: 100,
  selectedTool: "select",
  operations: [],
  setCurrentPdf: (pdf) => set({ currentPdf: pdf, currentPage: 1 }),
  addPdf: (pdf) =>
    set((state) => ({
      allPdfs: [...state.allPdfs, pdf],
      currentPdf: state.currentPdf ?? pdf,
    })),
  updateCurrentPdf: (data, pageCount, thumbnailUrls) =>
    set((state) => {
      if (!state.currentPdf) return state;
      const updated: PDFFile = { ...state.currentPdf, data, pageCount, thumbnailUrls };
      return {
        currentPdf: updated,
        allPdfs: state.allPdfs.map((p) => (p.id === updated.id ? updated : p)),
        currentPage: Math.min(state.currentPage, pageCount),
      };
    }),
  removePdf: (id) =>
    set((state) => {
      const allPdfs = state.allPdfs.filter((p) => p.id !== id);
      return {
        allPdfs,
        currentPdf: state.currentPdf?.id === id ? (allPdfs[0] ?? null) : state.currentPdf,
        currentPage: 1,
      };
    }),
  setPage: (page) => set({ currentPage: Math.max(1, page) }),
  setZoom: (zoom) => set({ zoomLevel: Math.min(400, Math.max(25, Math.round(zoom))) }),
  setTool: (tool) => set({ selectedTool: tool }),
  addOperation: (op) => set((state) => ({ operations: [op, ...state.operations].slice(0, 50) })),
  undoLastOperation: () => set((state) => ({ operations: state.operations.slice(1) })),
  clearOperations: () => set({ operations: [] }),
}));