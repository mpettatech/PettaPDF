import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ACCEPT_ATTR } from "@/lib/validators";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { UploadedFile } from "@/types";

interface FileDropzoneProps {
  onUploaded?: (files: UploadedFile[]) => void;
  compact?: boolean;
  className?: string;
}

export function FileDropzone({ onUploaded, compact, className }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setOver] = useState(false);
  const { upload, progressByFile, isUploading } = useFileUpload();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const accepted = await upload(files);
      if (accepted.length) onUploaded?.(accepted);
    },
    [upload, onUploaded],
  );

  const pending = Object.entries(progressByFile).filter(([, value]) => value < 100);

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/60 text-center transition-colors hover:border-primary/60 hover:bg-accent/40",
          compact ? "p-5" : "p-10",
          isOver && "border-primary bg-accent/60",
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="size-6" />
        </span>
        <div>
          <p className="font-medium">Arraste arquivos aqui ou clique para selecionar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, TXT, JPG, PNG, DOC, DOCX, DOCM, XML, HTML, DOTX, DOTM, XPS · até 100 MB por arquivo
          </p>
        </div>
        {!compact && (
          <Button type="button" variant="secondary" size="sm" disabled={isUploading}>
            {isUploading ? "Carregando…" : "Selecionar arquivos"}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pending.map(([name, value]) => (
            <li key={name} className="text-xs">
              <div className="mb-1 flex justify-between text-muted-foreground">
                <span className="truncate">{name}</span>
                <span>{value}%</span>
              </div>
              <Progress value={value} className="h-1.5" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}