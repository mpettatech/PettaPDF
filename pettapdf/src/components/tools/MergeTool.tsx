import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { usePdfStore } from "@/store/pdfStore";
import { mergePdfs } from "@/lib/pdf-utils";
import { download, formatBytes } from "@/lib/file-utils";
import { parsePageRanges } from "@/lib/validators";

interface Row {
  id: string;
  selected: boolean;
  ranges: string;
}

/** Seleção, ordenação e mesclagem de múltiplos PDFs. */
export function MergeTool({ onDone }: { onDone?: () => void }) {
  const allPdfs = usePdfStore((s) => s.allPdfs);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const ordered = useMemo(() => {
    const known = new Map(rows.map((r) => [r.id, r]));
    const merged: Row[] = rows.filter((r) => allPdfs.some((p) => p.id === r.id));
    for (const pdf of allPdfs)
      if (!known.has(pdf.id)) merged.push({ id: pdf.id, selected: true, ranges: "" });
    return merged;
  }, [rows, allPdfs]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows(ordered.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const move = (index: number, delta: number) => {
    const next = [...ordered];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const item = next.splice(index, 1)[0]!;
    next.splice(target, 0, item);
    setRows(next);
  };

  const handleMerge = async () => {
    const selected = ordered.filter((r) => r.selected);
    if (selected.length < 2) {
      toast.error("Selecione ao menos dois PDFs para mesclar.");
      return;
    }
    setBusy(true);
    try {
      const sources = selected.map((row) => {
        const pdf = allPdfs.find((p) => p.id === row.id)!;
        const pages = row.ranges.trim()
          ? parsePageRanges(row.ranges, pdf.pageCount)
          : undefined;
        return pages ? { data: pdf.data, pages } : { data: pdf.data };
      });
      const merged = await mergePdfs(sources);
      download(new Blob([merged], { type: "application/pdf" }), "pettapdf-mesclado.pdf");
      toast.success("PDFs mesclados", { description: formatBytes(merged.byteLength) });
      onDone?.();
    } catch (error) {
      toast.error("Falha ao mesclar", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!allPdfs.length) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Carregue pelo menos dois PDFs para usar a mesclagem.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {ordered.map((row, index) => {
          const pdf = allPdfs.find((p) => p.id === row.id)!;
          return (
            <li
              key={row.id}
              draggable
              onDragStart={() => setDragId(row.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragId || dragId === row.id) return;
                const next = [...ordered];
                const from = next.findIndex((r) => r.id === dragId);
                const item = next.splice(from, 1)[0]!;
                next.splice(index, 0, item);
                setRows(next);
                setDragId(null);
              }}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Checkbox
                checked={row.selected}
                onCheckedChange={(value) => update(row.id, { selected: value === true })}
                aria-label={`Incluir ${pdf.name}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pdf.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pdf.pageCount} páginas · {formatBytes(pdf.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`ranges-${row.id}`} className="text-xs text-muted-foreground">
                  Páginas
                </Label>
                <Input
                  id={`ranges-${row.id}`}
                  placeholder="todas"
                  value={row.ranges}
                  onChange={(e) => update(row.id, { ranges: e.target.value })}
                  className="h-8 w-28"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Mover para cima"
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Mover para baixo"
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <Button onClick={handleMerge} disabled={busy} className="w-full sm:w-auto">
        <Layers className="size-4" /> {busy ? "Mesclando…" : "Mesclar e baixar"}
      </Button>
    </div>
  );
}