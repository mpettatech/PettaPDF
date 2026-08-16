import { useCallback, useState } from "react";
import { toast } from "sonner";
import { usePdfStore } from "@/store/pdfStore";
import { useHistoryStore } from "@/store/historyStore";
import { uid } from "@/lib/file-utils";
import type { OperationType } from "@/types";

/**
 * Aplica operações no PDF ativo, mantendo histórico reversível,
 * miniaturas atualizadas e feedback via toast.
 */
export function usePdfProcessor() {
  const { currentPdf, updateCurrentPdf, addOperation } = usePdfStore();
  const push = useHistoryStore((s) => s.push);
  const [isBusy, setBusy] = useState(false);

  const refresh = useCallback(
    async (data: ArrayBuffer) => {
      const { getPageCount, generateThumbnails } = await import("@/lib/pdfjs");
      const pageCount = await getPageCount(data);
      const thumbs = await generateThumbnails(data);
      updateCurrentPdf(data, pageCount, thumbs);
    },
    [updateCurrentPdf],
  );

  const apply = useCallback(
    async (
      type: OperationType,
      label: string,
      operation: (data: ArrayBuffer) => Promise<ArrayBuffer>,
    ) => {
      if (!currentPdf) {
        toast.error("Nenhum PDF selecionado", {
          description: "Carregue ou selecione um documento antes de editar.",
        });
        return;
      }
      setBusy(true);
      const previous = currentPdf.data.slice(0);
      try {
        const next = await operation(currentPdf.data);
        push({ id: uid(), type, label, data: previous, timestamp: new Date() });
        await refresh(next);
        addOperation({ id: uid(), type, payload: { label }, timestamp: new Date(), reversible: true });
        toast.success(label);
      } catch (error) {
        toast.error("Operação falhou", {
          description: error instanceof Error ? error.message : "Erro inesperado ao editar o PDF.",
        });
      } finally {
        setBusy(false);
      }
    },
    [currentPdf, push, refresh, addOperation],
  );

  return { apply, refresh, isBusy, currentPdf };
}