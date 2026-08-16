import { useCallback } from "react";
import { toast } from "sonner";
import { useHistoryStore } from "@/store/historyStore";
import { usePdfStore } from "@/store/pdfStore";
import { uid } from "@/lib/file-utils";

/** Desfaz/refaz operações restaurando os bytes anteriores do PDF. */
export function useUndoRedo() {
  const { currentPdf, updateCurrentPdf, undoLastOperation } = usePdfStore();
  const { undo, redo, push, pushFuture, past, future } = useHistoryStore();

  const restore = useCallback(
    async (data: ArrayBuffer) => {
      const { getPageCount, generateThumbnails } = await import("@/lib/pdfjs");
      updateCurrentPdf(data, await getPageCount(data), await generateThumbnails(data));
    },
    [updateCurrentPdf],
  );

  const doUndo = useCallback(async () => {
    if (!currentPdf) return;
    const entry = undo();
    if (!entry) {
      toast.info("Nada para desfazer.");
      return;
    }
    pushFuture({ ...entry, id: uid(), data: currentPdf.data.slice(0) });
    await restore(entry.data.slice(0));
    undoLastOperation();
    toast.success(`Desfeito: ${entry.label}`);
  }, [currentPdf, undo, pushFuture, restore, undoLastOperation]);

  const doRedo = useCallback(async () => {
    if (!currentPdf) return;
    const entry = redo();
    if (!entry) {
      toast.info("Nada para refazer.");
      return;
    }
    push({ ...entry, id: uid(), data: currentPdf.data.slice(0) });
    await restore(entry.data.slice(0));
    toast.success(`Refeito: ${entry.label}`);
  }, [currentPdf, redo, push, restore]);

  return { undo: doUndo, redo: doRedo, canUndo: past.length > 0, canRedo: future.length > 0 };
}