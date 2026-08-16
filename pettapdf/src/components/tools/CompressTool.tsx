import { useState } from "react";
import { Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePdfStore } from "@/store/pdfStore";
import { compressPdf } from "@/lib/pdf-utils";
import { download, formatBytes, stripExtension } from "@/lib/file-utils";

/** Recompacta o PDF ativo e mostra a redução obtida. */
export function CompressTool({ onDone }: { onDone?: () => void }) {
  const currentPdf = usePdfStore((s) => s.currentPdf);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  const run = async () => {
    if (!currentPdf) return;
    setBusy(true);
    try {
      const bytes = await compressPdf(currentPdf.data);
      setResult({ before: currentPdf.data.byteLength, after: bytes.byteLength });
      download(
        new Blob([bytes], { type: "application/pdf" }),
        `${stripExtension(currentPdf.name)}-comprimido.pdf`,
      );
      toast.success("PDF comprimido.");
      onDone?.();
    } catch (error) {
      toast.error("Falha ao comprimir", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!currentPdf) return <p className="text-sm text-muted-foreground">Selecione um PDF.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Remove objetos não utilizados e metadados, reescrevendo o arquivo com object streams.
      </p>
      {result && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p>Antes: {formatBytes(result.before)}</p>
          <p>Depois: {formatBytes(result.after)}</p>
          <p className="mt-1 font-medium text-primary">
            Redução de {Math.max(0, Math.round((1 - result.after / result.before) * 100))}%
          </p>
        </div>
      )}
      <Button onClick={run} disabled={busy}>
        <Minimize2 className="size-4" /> {busy ? "Comprimindo…" : "Comprimir e baixar"}
      </Button>
    </div>
  );
}