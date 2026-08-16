import { History } from "lucide-react";
import { usePdfStore } from "@/store/pdfStore";
import { formatDate } from "@/lib/file-utils";

export function ActionHistory() {
  const operations = usePdfStore((s) => s.operations).slice(0, 10);

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <History className="size-3.5" /> Histórico
      </p>
      {operations.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma ação registrada.</p>
      ) : (
        <ol className="space-y-1.5">
          {operations.map((op) => (
            <li key={op.id} className="rounded-md bg-muted/60 px-2.5 py-1.5 text-xs">
              <p className="font-medium">{(op.payload as { label?: string })?.label ?? op.type}</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(op.timestamp)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}