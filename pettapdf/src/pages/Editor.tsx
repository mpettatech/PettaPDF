import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Hash,
  Highlighter,
  Image as ImageIcon,
  Layers,
  Lock,
  Minimize2,
  MousePointer2,
  RefreshCw,
  Redo2,
  RotateCcw,
  RotateCw,
  Scissors,
  Stamp,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Sidebar } from "@/components/layout/Sidebar";
import { PdfViewer, type CanvasPoint, type CanvasRect, type TextHit } from "@/components/pdf/PdfViewer";
import { PageNavigator } from "@/components/pdf/PageNavigator";
import { TextEditorOverlay } from "@/components/pdf/TextEditorOverlay";
import { ImageInserter } from "@/components/pdf/ImageInserter";
import { MergeTool } from "@/components/tools/MergeTool";
import { SplitTool } from "@/components/tools/SplitTool";
import { CompressTool } from "@/components/tools/CompressTool";
import { ConvertTool } from "@/components/tools/ConvertTool";
import { WatermarkTool } from "@/components/tools/WatermarkTool";
import { PasswordTool } from "@/components/tools/PasswordTool";
import { PageNumberTool } from "@/components/tools/PageNumberTool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePdfStore, type ToolId } from "@/store/pdfStore";
import { useUiStore } from "@/store/uiStore";
import { usePdfProcessor } from "@/hooks/usePdfProcessor";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import {
  addImage,
  addText,
  deletePage,
  highlightArea,
  reorderPage,
  replaceText,
  rotatePage,
  type FontName,
} from "@/lib/pdf-utils";
import { download, formatBytes, uid } from "@/lib/file-utils";
import type { Annotation } from "@/types";

const TOOLS: { id: ToolId; label: string; icon: typeof Type }[] = [
  { id: "select", label: "Selecionar / editar texto", icon: MousePointer2 },
  { id: "text", label: "Adicionar texto", icon: Type },
  { id: "image", label: "Inserir imagem", icon: ImageIcon },
  { id: "highlight", label: "Destacar área", icon: Highlighter },
  { id: "annotate", label: "Anotação", icon: StickyNote },
];

const MODAL_TITLES: Record<string, string> = {
  merge: "Mesclar PDFs",
  split: "Dividir PDF",
  compress: "Comprimir PDF",
  convert: "Converter arquivo",
  watermark: "Marca d'água",
  password: "Proteção do PDF",
  pageNumber: "Numerar páginas",
};

export function EditorPage() {
  const { currentPdf, currentPage, zoomLevel, selectedTool, setTool, setZoom, setPage } =
    usePdfStore();
  const { activeModal, openModal, closeModal } = useUiStore();
  const { apply, isBusy } = usePdfProcessor();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [textSelection, setTextSelection] = useState<TextHit | null>(null);
  const [pendingPoint, setPendingPoint] = useState<CanvasPoint | null>(null);
  const [textDialog, setTextDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [newText, setNewText] = useState("");
  const [font, setFont] = useState<FontName>("Helvetica");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#111111");
  const [rotation, setRotation] = useState(0);

  const pageIndex = currentPage - 1;

  const handleSave = useCallback(() => {
    if (!currentPdf) return;
    download(new Blob([currentPdf.data], { type: "application/pdf" }), currentPdf.name);
    toast.success("Download iniciado", { description: currentPdf.name });
  }, [currentPdf]);

  const handleDeletePage = useCallback(
    (index: number) =>
      void apply("DELETE_PAGE", `Página ${index + 1} excluída`, (data) => deletePage(data, index)),
    [apply],
  );

  const handleRotate = useCallback(
    (index: number, delta: number) =>
      void apply("ROTATE_PAGE", `Página ${index + 1} girada`, (data) =>
        rotatePage(data, index, delta),
      ),
    [apply],
  );

  const handleReorder = useCallback(
    (from: number, to: number) =>
      void apply("REORDER_PAGE", `Página ${from + 1} movida para ${to + 1}`, (data) =>
        reorderPage(data, from, to),
      ),
    [apply],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        openModal("merge");
        return;
      }
      if (meta && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        openModal("convert");
        return;
      }
      if (meta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        void undo();
        return;
      }
      if (meta && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key === "Z"))) {
        event.preventDefault();
        void redo();
        return;
      }
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
        return;
      }
      if (event.key === "Delete" && !typing && currentPdf) {
        event.preventDefault();
        handleDeletePage(pageIndex);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, handleSave, handleDeletePage, openModal, pageIndex, currentPdf]);

  const onPointClick = (point: CanvasPoint) => {
    setPendingPoint(point);
    if (selectedTool === "text") setTextDialog(true);
    if (selectedTool === "image") setImageDialog(true);
    if (selectedTool === "annotate") setNoteDialog(true);
  };

  const onAreaSelect = (rect: CanvasRect) =>
    void apply("HIGHLIGHT_TEXT", "Área destacada", (data) =>
      highlightArea(data, { pageIndex, ...rect }),
    );

  return (
    <Layout withFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          annotations={annotations}
          onRemoveAnnotation={(id) => setAnnotations((a) => a.filter((n) => n.id !== id))}
          onRotatePage={(index) => handleRotate(index, 90)}
          onDeletePage={handleDeletePage}
          onReorderPage={handleReorder}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card/60 px-3 py-2">
            {TOOLS.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === tool.id ? "default" : "ghost"}
                    size="icon"
                    aria-label={tool.label}
                    onClick={() => setTool(tool.id)}
                  >
                    <tool.icon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{tool.label}</TooltipContent>
              </Tooltip>
            ))}

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              variant="ghost"
              size="icon"
              aria-label="Girar 90° anti-horário"
              onClick={() => handleRotate(pageIndex, -90)}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Girar 90° horário"
              onClick={() => handleRotate(pageIndex, 90)}
            >
              <RotateCw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir página atual"
              onClick={() => handleDeletePage(pageIndex)}
            >
              <Trash2 className="size-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button variant="ghost" size="sm" onClick={() => openModal("merge")}>
              <Layers className="size-4" /> Mesclar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openModal("split")}>
              <Scissors className="size-4" /> Dividir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openModal("compress")}>
              <Minimize2 className="size-4" /> Comprimir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openModal("convert")}>
              <RefreshCw className="size-4" /> Converter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openModal("watermark")}>
              <Stamp className="size-4" /> Marca d'água
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openModal("pageNumber")}>
              <Hash className="size-4" /> Numerar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openModal("password")}>
              <Lock className="size-4" /> Senha
            </Button>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Desfazer"
                disabled={!canUndo}
                onClick={() => void undo()}
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refazer"
                disabled={!canRedo}
                onClick={() => void redo()}
              >
                <Redo2 className="size-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!currentPdf}>
                <Download className="size-4" /> Salvar
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/40">
            <PdfViewer
              onPointClick={onPointClick}
              onAreaSelect={onAreaSelect}
              onTextClick={(hit) => setTextSelection(hit)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-card/60 px-3 py-2 text-sm">
            <PageNavigator />
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Diminuir zoom"
              onClick={() => setZoom(zoomLevel - 25)}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="w-12 text-center tabular-nums">{zoomLevel}%</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aumentar zoom"
              onClick={() => setZoom(zoomLevel + 25)}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>
              Ajustar à página
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(150)}>
              Ajustar à largura
            </Button>
            <span className="ml-auto text-muted-foreground">
              {currentPdf
                ? `${currentPdf.name} · ${formatBytes(currentPdf.data.byteLength)}${isBusy ? " · processando…" : ""}`
                : "Nenhum documento aberto"}
            </span>
          </div>
        </section>
      </div>

      {/* Edição de texto existente */}
      <TextEditorOverlay
        selection={textSelection}
        onClose={() => setTextSelection(null)}
        onSave={(value, size, textColor) => {
          const selection = textSelection;
          setTextSelection(null);
          if (!selection) return;
          void apply("ADD_TEXT", "Texto substituído", (data) =>
            replaceText(data, {
              pageIndex,
              text: value,
              xRatio: selection.xRatio,
              yRatio: selection.yRatio,
              boxWidthRatio: selection.widthRatio,
              boxHeightRatio: selection.heightRatio,
              size,
              color: textColor,
              font: "Helvetica",
            }),
          );
        }}
      />

      {/* Novo texto */}
      <Dialog open={textDialog} onOpenChange={setTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar texto</DialogTitle>
            <DialogDescription>O texto será inserido no ponto clicado da página.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-text">Conteúdo</Label>
              <Textarea id="new-text" value={newText} onChange={(e) => setNewText(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fonte</Label>
                <Select value={font} onValueChange={(v) => setFont(v as FontName)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="TimesRoman">Times Roman</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-size">Tamanho (8-72)</Label>
                <Input
                  id="new-size"
                  type="number"
                  min={8}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-color">Cor</Label>
                <Input
                  id="new-color"
                  type="color"
                  className="h-9 p-1"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rotation">Rotação (°)</Label>
                <Input
                  id="new-rotation"
                  type="number"
                  min={0}
                  max={359}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTextDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!newText.trim()}
              onClick={() => {
                const point = pendingPoint;
                setTextDialog(false);
                if (!point) return;
                void apply("ADD_TEXT", "Texto adicionado", (data) =>
                  addText(data, {
                    pageIndex,
                    text: newText,
                    xRatio: point.xRatio,
                    yRatio: point.yRatio,
                    size: fontSize,
                    color,
                    font,
                    rotation,
                  }),
                );
                setNewText("");
              }}
            >
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Imagem */}
      <ImageInserter
        open={imageDialog}
        onClose={() => setImageDialog(false)}
        onInsert={async (file, widthRatio) => {
          const point = pendingPoint;
          setImageDialog(false);
          if (!point) return;
          const bytes = await file.arrayBuffer();
          void apply("ADD_IMAGE", "Imagem inserida", (data) =>
            addImage(data, bytes, file.type, {
              pageIndex,
              xRatio: point.xRatio,
              yRatio: point.yRatio,
              widthRatio,
            }),
          );
        }}
      />

      {/* Anotação */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova anotação</DialogTitle>
            <DialogDescription>
              Comentários ficam vinculados à página atual durante a sessão.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!noteText.trim()}
              onClick={() => {
                setAnnotations((a) => [
                  { id: uid(), page: currentPage, text: noteText, createdAt: new Date() },
                  ...a,
                ]);
                setNoteText("");
                setNoteDialog(false);
                toast.success("Anotação adicionada.");
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ferramentas em modal */}
      <Dialog open={!!activeModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeModal ? MODAL_TITLES[activeModal] : ""}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {activeModal === "merge" && <MergeTool onDone={closeModal} />}
            {activeModal === "split" && <SplitTool onDone={closeModal} />}
            {activeModal === "compress" && <CompressTool onDone={closeModal} />}
            {activeModal === "convert" && <ConvertTool />}
            {activeModal === "watermark" && <WatermarkTool onDone={closeModal} />}
            {activeModal === "password" && <PasswordTool onDone={closeModal} />}
            {activeModal === "pageNumber" && <PageNumberTool onDone={closeModal} />}
          </div>
        </DialogContent>
      </Dialog>

      <button type="button" hidden onClick={() => setPage(currentPage)} aria-hidden />
    </Layout>
  );
}