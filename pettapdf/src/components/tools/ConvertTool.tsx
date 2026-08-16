import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversionProgress } from "@/components/common/ConversionProgress";
import { useConversion } from "@/hooks/useConversion";
import { useFileStore } from "@/store/fileStore";
import { TARGET_LABELS } from "@/lib/conversion-utils";
import { formatBytes } from "@/lib/file-utils";
import type { TargetFormat } from "@/types";

const PDF_TARGETS: TargetFormat[] = [
  "txt",
  "png",
  "jpeg",
  "docx",
  "doc",
  "docm",
  "dotx",
  "dotm",
  "html",
  "xml",
  "xps",
];

/** Painel de conversão: escolhe arquivo, formato de destino e qualidade. */
export function ConvertTool() {
  const uploadedFiles = useFileStore((s) => s.uploadedFiles);
  const convertedFiles = useFileStore((s) => s.convertedFiles);
  const { convert, isProcessing, progress } = useConversion();
  const [fileId, setFileId] = useState<string>("");
  const [target, setTarget] = useState<TargetFormat>("txt");
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [ocr, setOcr] = useState(false);

  const file = uploadedFiles.find((f) => f.id === fileId) ?? uploadedFiles[0];
  const isPdfSource = file?.extension === "pdf";
  const targets = isPdfSource ? PDF_TARGETS : (["pdf"] as TargetFormat[]);
  const effectiveTarget = targets.includes(target) ? target : targets[0]!;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Arquivo de origem</Label>
          <Select value={file?.id ?? ""} onValueChange={setFileId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um arquivo" />
            </SelectTrigger>
            <SelectContent>
              {uploadedFiles.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {formatBytes(item.size)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Converter para</Label>
          <Select value={effectiveTarget} onValueChange={(v) => setTarget(v as TargetFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targets.map((item) => (
                <SelectItem key={item} value={item}>
                  {TARGET_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Qualidade / DPI</Label>
          <Select value={quality} onValueChange={(v) => setQuality(v as typeof quality)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa (72 DPI)</SelectItem>
              <SelectItem value="medium">Média (150 DPI)</SelectItem>
              <SelectItem value="high">Alta (300 DPI)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-3">
          <Switch id="ocr" checked={ocr} onCheckedChange={setOcr} />
          <Label htmlFor="ocr" className="leading-tight">
            Usar OCR (PDF digitalizado → texto)
          </Label>
        </div>
      </div>

      <ConversionProgress isProcessing={isProcessing} progress={progress} label="Convertendo…" />

      <Button
        disabled={!file || isProcessing}
        onClick={() =>
          file &&
          void convert(file, {
            targetFormat: effectiveTarget,
            quality,
            ocrEnabled: ocr && effectiveTarget === "txt",
            preserveLayout: true,
          })
        }
      >
        <RefreshCw className="size-4" /> Converter e baixar
      </Button>

      {convertedFiles.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Convertidos nesta sessão</p>
          <ul className="space-y-2">
            {convertedFiles.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-sm"
              >
                <span className="truncate">{item.name}</span>
                <a
                  href={item.url}
                  download={item.name}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Baixar novamente ({formatBytes(item.size)})
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}