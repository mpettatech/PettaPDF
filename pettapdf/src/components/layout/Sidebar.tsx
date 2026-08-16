import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDropzone } from "@/components/common/FileDropzone";
import { FileList } from "@/components/common/FileList";
import { ActionHistory } from "@/components/common/ActionHistory";
import { AnnotationLayer } from "@/components/pdf/AnnotationLayer";
import { PageReorderer } from "@/components/pdf/PageReorderer";
import { usePdfStore } from "@/store/pdfStore";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import type { Annotation } from "@/types";

interface SidebarProps {
  annotations: Annotation[];
  onRemoveAnnotation: (id: string) => void;
  onRotatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onReorderPage: (from: number, to: number) => void;
}

export function Sidebar({
  annotations,
  onRemoveAnnotation,
  onRotatePage,
  onDeletePage,
  onReorderPage,
}: SidebarProps) {
  const { currentPdf, currentPage, setPage } = usePdfStore();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "w-[280px] shrink-0 border-r border-sidebar-border bg-sidebar",
        sidebarOpen ? "block" : "hidden lg:block",
      )}
    >
      <Tabs defaultValue="files" className="flex h-full flex-col">
        <TabsList className="m-3 grid grid-cols-3">
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="history">Ações</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-9.5rem)]">
          <TabsContent value="files" className="space-y-4 px-3 pb-6">
            <FileDropzone compact />
            <FileList />
          </TabsContent>

          <TabsContent value="pages" className="px-3 pb-6">
            {currentPdf ? (
              <PageReorderer
                thumbnails={currentPdf.thumbnailUrls}
                pageCount={currentPdf.pageCount}
                currentPage={currentPage}
                onSelect={setPage}
                onRotate={onRotatePage}
                onDelete={onDeletePage}
                onReorder={onReorderPage}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum PDF aberto.</p>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-5 px-3 pb-6">
            <ActionHistory />
            <AnnotationLayer annotations={annotations} onRemove={onRemoveAnnotation} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}