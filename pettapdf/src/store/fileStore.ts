import { create } from "zustand";
import type { ConvertedFile, UploadedFile } from "@/types";

interface FileState {
  uploadedFiles: UploadedFile[];
  convertedFiles: ConvertedFile[];
  isProcessing: boolean;
  progress: number;
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  setProcessing: (status: boolean) => void;
  setProgress: (progress: number) => void;
  addConvertedFile: (file: ConvertedFile) => void;
  clearConverted: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  uploadedFiles: [],
  convertedFiles: [],
  isProcessing: false,
  progress: 0,
  addFiles: (files) => set((state) => ({ uploadedFiles: [...state.uploadedFiles, ...files] })),
  removeFile: (id) =>
    set((state) => ({ uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id) })),
  setProcessing: (isProcessing) => set({ isProcessing, progress: isProcessing ? 0 : 100 }),
  setProgress: (progress) => set({ progress }),
  addConvertedFile: (file) =>
    set((state) => ({ convertedFiles: [file, ...state.convertedFiles].slice(0, 30) })),
  clearConverted: () => set({ convertedFiles: [] }),
}));