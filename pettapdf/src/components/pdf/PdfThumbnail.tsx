import { RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfThumbnailProps {
  index: number;
  url?: string | undefined;
  active: boolean;
  onSelect: () => void;
  onRotate: () => void;
  onDelete: () => void;
  draggableProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
}

export function PdfThumbnail({
  index,
  url,
  active,
  onSelect,
  onRotate,
  onDelete,
  draggableProps,
}: PdfThumbnailProps) {
  return (
    <div
      {...draggableProps}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-card p-1.5 transition-colors",
        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
      )}
      onClick={onSelect}
    >
      {url ? (
        <img
          src={url}
          alt={`Miniatura da página ${index + 1}`}
          className="h-auto w-full rounded bg-white"
          loading="lazy"
        />
      ) : (
        <div className="grid aspect-[1/1.414] place-items-center rounded bg-muted text-xs text-muted-foreground">
          {index + 1}
        </div>
      )}
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Pág. {index + 1}</span>
        <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={`Girar página ${index + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
          >
            <RotateCw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-destructive"
            aria-label={`Excluir página ${index + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </span>
      </div>
    </div>
  );
}