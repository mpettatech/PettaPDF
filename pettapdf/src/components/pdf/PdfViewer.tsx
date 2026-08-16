import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePdfStore } from "@/store/pdfStore";
import { loadDocument } from "@/lib/pdfjs";
import { cn } from "@/lib/utils";

export interface CanvasPoint {
  xRatio: number;
  yRatio: number;
}

export interface CanvasRect extends CanvasPoint {
  widthRatio: number;
  heightRatio: number;
}

export interface TextHit {
  text: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  fontSize: number;
}

interface PdfViewerProps {
  onPointClick?: (point: CanvasPoint) => void;
  onAreaSelect?: (rect: CanvasRect) => void;
  onTextClick?: (hit: TextHit) => void;
}

/**
 * Renderiza a página atual do PDF em canvas com overlay de interação
 * (clique para inserir, arraste para selecionar área, clique em texto para editar).
 */
export function PdfViewer({ onPointClick, onAreaSelect, onTextClick }: PdfViewerProps) {
  const { currentPdf, currentPage, zoomLevel, selectedTool } = usePdfStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isRendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textItems, setTextItems] = useState<TextHit[]>([]);
  const [dragRect, setDragRect] = useState<CanvasRect | null>(null);
  const dragStart = useRef<CanvasPoint | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!currentPdf || !canvasRef.current) return;
      setRendering(true);
      setError(null);
      try {
        const doc = await loadDocument(currentPdf.data);
        const pageNumber = Math.min(currentPage, doc.numPages);
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: zoomLevel / 100 });
        const canvas = canvasRef.current;
        if (cancelled) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        const context = canvas.getContext("2d")!;
        context.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;

        const content = await page.getTextContent();
        const hits: TextHit[] = [];
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          const [, , , , tx, ty] = item.transform as number[];
          const fontHeight = Math.abs(item.height || 10);
          hits.push({
            text: item.str,
            xRatio: (tx ?? 0) / page.getViewport({ scale: 1 }).width,
            yRatio:
              (page.getViewport({ scale: 1 }).height - (ty ?? 0)) /
              page.getViewport({ scale: 1 }).height,
            widthRatio: (item.width || 0) / page.getViewport({ scale: 1 }).width,
            heightRatio: fontHeight / page.getViewport({ scale: 1 }).height,
            fontSize: fontHeight,
          });
        }
        if (!cancelled) setTextItems(hits);
        void doc.cleanup();
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Não foi possível renderizar esta página do PDF.",
          );
      } finally {
        if (!cancelled) setRendering(false);
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [currentPdf, currentPage, zoomLevel]);

  const toRatio = useCallback((e: React.MouseEvent): CanvasPoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      xRatio: (e.clientX - rect.left) / rect.width,
      yRatio: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  if (!currentPdf) {
    return (
      <div className="grid h-full min-h-[420px] place-items-center rounded-xl border border-dashed border-border bg-card/40 text-sm text-muted-foreground">
        Carregue um PDF para começar a editar.
      </div>
    );
  }

  const isDrawing = selectedTool === "highlight";

  return (
    <div ref={wrapperRef} className="relative flex justify-center overflow-auto p-6">
      <div className="relative shadow-soft">
        <canvas ref={canvasRef} className="block rounded bg-white" />

        <div
          className={cn(
            "absolute inset-0",
            selectedTool === "select" ? "cursor-default" : "cursor-crosshair",
          )}
          onMouseDown={(e) => {
            if (!isDrawing) return;
            dragStart.current = toRatio(e);
          }}
          onMouseMove={(e) => {
            if (!isDrawing || !dragStart.current) return;
            const now = toRatio(e);
            setDragRect({
              xRatio: Math.min(dragStart.current.xRatio, now.xRatio),
              yRatio: Math.min(dragStart.current.yRatio, now.yRatio),
              widthRatio: Math.abs(now.xRatio - dragStart.current.xRatio),
              heightRatio: Math.abs(now.yRatio - dragStart.current.yRatio),
            });
          }}
          onMouseUp={() => {
            if (isDrawing && dragRect && dragRect.widthRatio > 0.005) onAreaSelect?.(dragRect);
            dragStart.current = null;
            setDragRect(null);
          }}
          onClick={(e) => {
            if (isDrawing) return;
            if (selectedTool === "text" || selectedTool === "image" || selectedTool === "annotate")
              onPointClick?.(toRatio(e));
          }}
        >
          {selectedTool === "select" &&
            textItems.map((item, index) => (
              <button
                key={`${item.text}-${index}`}
                type="button"
                title={item.text}
                onClick={() => onTextClick?.(item)}
                className="absolute rounded-[2px] hover:bg-primary/20 hover:outline hover:outline-1 hover:outline-primary"
                style={{
                  left: `${item.xRatio * 100}%`,
                  top: `${(item.yRatio - item.heightRatio) * 100}%`,
                  width: `${item.widthRatio * 100}%`,
                  height: `${item.heightRatio * 1.4 * 100}%`,
                }}
              />
            ))}

          {dragRect && (
            <div
              className="pointer-events-none absolute border border-warning bg-warning/30"
              style={{
                left: `${dragRect.xRatio * 100}%`,
                top: `${dragRect.yRatio * 100}%`,
                width: `${dragRect.widthRatio * 100}%`,
                height: `${dragRect.heightRatio * 100}%`,
              }}
            />
          )}
        </div>

        {isRendering && (
          <div className="absolute inset-0 grid place-items-center bg-background/50">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-background/85 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}