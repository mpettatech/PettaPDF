import { create } from "zustand";

export type ModalId =
  | "merge"
  | "split"
  | "compress"
  | "convert"
  | "watermark"
  | "password"
  | "pageNumber"
  | "addText"
  | "addImage"
  | "annotate"
  | null;

interface UiState {
  isDarkMode: boolean;
  activeModal: ModalId;
  sidebarOpen: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  openModal: (modal: Exclude<ModalId, null>) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
}

function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("pettapdf-theme", dark ? "dark" : "light");
  } catch {
    /* armazenamento indisponível */
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  isDarkMode: false,
  activeModal: null,
  sidebarOpen: true,
  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    applyTheme(next);
    set({ isDarkMode: next });
  },
  setDarkMode: (value) => {
    applyTheme(value);
    set({ isDarkMode: value });
  },
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));