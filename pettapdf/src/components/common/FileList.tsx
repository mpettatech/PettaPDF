import { File, FileImage, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/file-utils";
import { useFileStore } from "@/store/fileStore";
import { usePdfStore } from "@/store/pdfStore";

function iconFor(extension: string) {
  if (extension === "pdf") return FileText;
  if (["png", "jpg", "jpeg"].includes(extension)) return FileImage;
  return File;
}

export function FileList({ selectable = true }: { selectable?: boolean }) {
  const { uploadedFiles, removeFile } = useFileStore();
  const { allPdfs, currentPdf, setCurrentPdf, removePdf } = usePdfStore();

  if (!uploadedFiles.length) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        Nenhum arquivo carregado ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {uploadedFiles.map((file) => {
        const Icon = iconFor(file.extension);
        const pdf = allPdfs.find((p) => p.id === file.id);
        const active = currentPdf?.id === file.id;
        return (
          <li
            key={file.id}
            className={cn(
              "group flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left transition-colors",
              active && "border-primary/60 bg-accent/50",
              selectable && pdf && "cursor-pointer hover:bg-accent/40",
            )}
            onClick={() => selectable && pdf && setCurrentPdf(pdf)}
          >
            <Icon className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
                {pdf ? ` · ${pdf.pageCount} página${pdf.pageCount > 1 ? "s" : ""}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-60 hover:opacity-100"
              aria-label={`Remover ${file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                removeFile(file.id);
                removePdf(file.id);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}