import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useFileStore } from "@/store/fileStore";
import { usePdfStore } from "@/store/pdfStore";
import { getExtension, readAsArrayBuffer, uid } from "@/lib/file-utils";
import { validateFile } from "@/lib/validators";
import type { PDFFile, UploadedFile } from "@/types";

export function useFileUpload() {
  const addFiles = useFileStore((s) => s.addFiles);
  const addPdf = usePdfStore((s) => s.addPdf);
  const [progressByFile, setProgressByFile] = useState<Record<string, number>>({});
  const [isUploading, setUploading] = useState(false);

  /** Lê, valida e registra os arquivos; PDFs também entram no editor. */
  const upload = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return [];
      setUploading(true);
      const accepted: UploadedFile[] = [];
      try {
        for (const file of files) {
          const validation = validateFile(file);
          if (!validation.valid) {
            toast.error("Arquivo rejeitado", { description: validation.error });
            continue;
          }
          setProgressByFile((p) => ({ ...p, [file.name]: 0 }));
          try {
            const data = await readAsArrayBuffer(file, (percent) =>
              setProgressByFile((p) => ({ ...p, [file.name]: percent })),
            );
            setProgressByFile((p) => ({ ...p, [file.name]: 100 }));
            const extension = getExtension(file.name);
            const uploaded: UploadedFile = {
              id: uid(),
              name: file.name,
              size: file.size,
              extension,
              data,
              createdAt: new Date(),
            };
            accepted.push(uploaded);

            if (extension === "pdf") {
              try {
                const { getPageCount, generateThumbnails } = await import("@/lib/pdfjs");
                const pageCount = await getPageCount(data);
                const thumbnailUrls = await generateThumbnails(data);
                const pdf: PDFFile = {
                  id: uploaded.id,
                  name: file.name,
                  size: file.size,
                  data,
                  pageCount,
                  thumbnailUrls,
                  createdAt: new Date(),
                };
                addPdf(pdf);
              } catch (err) {
                console.error("PDF load failure", err);
                toast.error("PDF inválido", {
                  description: `"${file.name}" pode estar corrompido ou protegido por senha.`,
                });
              }
            }
          } catch (error) {
            toast.error("Falha na leitura", {
              description: error instanceof Error ? error.message : "Erro desconhecido.",
            });
          }
        }
        if (accepted.length) {
          addFiles(accepted);
          toast.success(
            accepted.length === 1
              ? `"${accepted[0]!.name}" carregado.`
              : `${accepted.length} arquivos carregados.`,
          );
        }
        return accepted;
      } finally {
        setUploading(false);
      }
    },
    [addFiles, addPdf],
  );

  return { upload, progressByFile, isUploading };
}