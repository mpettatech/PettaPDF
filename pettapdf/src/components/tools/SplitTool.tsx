import { useState } from "react";
import { Scissors } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePdfStore } from "@/store/pdfStore";
import { extractPages } from "@/lib/pdf-utils";
import { download, stripExtension } from "@/lib/file-utils";
import { parsePageRanges } from "@/lib/validators";

/** Divide o PDF ativo em um recorte de páginas ou em arquivos individuais (ZIP). */
export function SplitTool({ onDone }: { onDone?: () => void }) {
  const currentPdf = usePdfStore((s) => s.currentPdf);
  const [mode, setMode] = useState<"range" | "all">("range");
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!currentPdf) return;
    setBusy(true);
    try {
      const base = stripExtension(currentPdf.name);
      if (mode === "range") {
        const pages = parsePageRanges(ranges, currentPdf.pageCount);
        const bytes = await extractPages(currentPdf.data, pages);
        download(new Blob([bytes], { type: "application/pdf" }), `${base}-recorte.pdf`);
      } else {
        const zip = new JSZip();
        for (let i = 1; i <= currentPdf.pageCount; i++) {
          const bytes = await extractPages(currentPdf.data, [i]);
          zip.file(`${base}-pagina-${String(i).padStart(3, "0")}.pdf`, bytes);
        }
        download(await zip.generateAsync({ type: "blob" }), `${base}-paginas.zip`);
      }
      toast.success("PDF dividido com sucesso.");
      onDone?.();
    } catch (error) {
      toast.error("Falha ao dividir", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!currentPdf) return <p className="text-sm text-muted-foreground">Selecione um PDF.</p>;

  return (
    <div className="space-y-4">
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as "range" | "all")}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="range" id="split-range" />
          <Label htmlFor="split-range">Extrair páginas específicas</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="split-all" />
          <Label htmlFor="split-all">Uma página por arquivo (ZIP)</Label>
        </div>
      </RadioGroup>

      {mode === "range" && (
        <div className="space-y-2">
          <Label htmlFor="split-input">Páginas (ex.: 1-3, 5)</Label>
          <Input id="split-input" value={ranges} onChange={(e) => setRanges(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Documento com {currentPdf.pageCount} páginas.
          </p>
        </div>
      )}

      <Button onClick={run} disabled={busy}>
        <Scissors className="size-4" /> {busy ? "Dividindo…" : "Dividir e baixar"}
      </Button>
    </div>
  );
}