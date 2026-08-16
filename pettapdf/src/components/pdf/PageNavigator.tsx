import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePdfStore } from "@/store/pdfStore";

export function PageNavigator() {
  const { currentPdf, currentPage, setPage } = usePdfStore();
  const total = currentPdf?.pageCount ?? 0;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Página anterior"
        disabled={currentPage <= 1}
        onClick={() => setPage(currentPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Input
        value={currentPage}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (Number.isFinite(value)) setPage(Math.min(Math.max(1, value), total || 1));
        }}
        className="h-8 w-14 text-center"
        aria-label="Página atual"
      />
      <span className="text-sm text-muted-foreground">de {total || 0}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Próxima página"
        disabled={currentPage >= total}
        onClick={() => setPage(currentPage + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}