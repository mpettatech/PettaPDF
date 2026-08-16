import { useCallback } from "react";
import { toast } from "sonner";
import { convertFile } from "@/lib/conversion-utils";
import { download, uid } from "@/lib/file-utils";
import { useFileStore } from "@/store/fileStore";
import type { ConversionOptions, UploadedFile } from "@/types";

/** Executa conversões de forma assíncrona, atualizando progresso global. */
export function useConversion() {
  const { setProcessing, setProgress, addConvertedFile, isProcessing, progress } = useFileStore();

  const convert = useCallback(
    async (file: UploadedFile, options: ConversionOptions, autoDownload = true) => {
      setProcessing(true);
      setProgress(2);
      try {
        const result = await convertFile(file, options, setProgress);
        setProgress(100);
        addConvertedFile({
          id: uid(),
          name: result.filename,
          size: result.blob.size,
          url: URL.createObjectURL(result.blob),
          format: result.format,
          createdAt: new Date(),
        });
        if (autoDownload) download(result.blob, result.filename);
        toast.success("Conversão concluída", { description: result.filename });
        return result;
      } catch (error) {
        toast.error("Falha na conversão", {
          description: error instanceof Error ? error.message : "Erro inesperado.",
        });
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing, setProgress, addConvertedFile],
  );

  return { convert, isProcessing, progress };
}