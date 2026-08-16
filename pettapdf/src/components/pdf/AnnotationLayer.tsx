import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/file-utils";
import type { Annotation } from "@/types";

export function AnnotationLayer({
  annotations,
  onRemove,
}: {
  annotations: Annotation[];
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <MessageSquare className="size-3.5" /> Anotações
      </p>
      {annotations.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma anotação nesta sessão.</p>
      ) : (
        <ul className="space-y-2">
          {annotations.map((note) => (
            <li key={note.id} className="rounded-md border border-border bg-card p-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Página {note.page}</p>
                  <p className="mt-0.5 break-words text-muted-foreground">{note.text}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label="Remover anotação"
                  onClick={() => onRemove(note.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}