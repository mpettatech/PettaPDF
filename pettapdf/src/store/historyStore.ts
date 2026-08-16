import { create } from "zustand";
import type { OperationType } from "@/types";

export interface HistoryEntry {
  id: string;
  type: OperationType;
  label: string;
  data: ArrayBuffer;
  timestamp: Date;
}

const MAX_HISTORY = 20;

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  /** Empilha o estado ANTERIOR do documento antes de aplicar a operação. */
  push: (entry: HistoryEntry) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  pushFuture: (entry: HistoryEntry) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  push: (entry) => set((s) => ({ past: [entry, ...s.past].slice(0, MAX_HISTORY), future: [] })),
  undo: () => {
    const [entry, ...rest] = get().past;
    if (!entry) return null;
    set({ past: rest });
    return entry;
  },
  redo: () => {
    const [entry, ...rest] = get().future;
    if (!entry) return null;
    set({ future: rest });
    return entry;
  },
  pushFuture: (entry) => set((s) => ({ future: [entry, ...s.future].slice(0, MAX_HISTORY) })),
  clear: () => set({ past: [], future: [] }),
}));