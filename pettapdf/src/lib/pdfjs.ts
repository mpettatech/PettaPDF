import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/** Polyfill para Map/WeakMap.getOrInsertComputed (usado pelo pdf.js, ainda não disponível em todos os navegadores). */
function ensureMapPolyfills() {
  for (const Ctor of [Map, WeakMap] as const) {
    const proto = Ctor.prototype as unknown as Record<string, unknown>;
    if (typeof proto["getOrInsertComputed"] !== "function") {
      proto["getOrInsertComputed"] = function (this: Map<unknown, unknown>, key: unknown, callback: (k: unknown) => unknown) {
        if (!this.has(key)) this.set(key, callback(key));
        return this.get(key);
      };
    }
    if (typeof proto["getOrInsert"] !== "function") {
      proto["getOrInsert"] = function (this: Map<unknown, unknown>, key: unknown, value: unknown) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      };
    }
  }
}

/** Carrega pdfjs-dist apenas no browser, configurando o worker uma única vez. */
export async function getPdfjs() {
  if (typeof window === "undefined") throw new Error("pdfjs só está disponível no navegador.");
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      ensureMapPolyfills();
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

/** Abre um documento com pdfjs a partir de bytes (usa cópia para não invalidar o buffer). */
export async function loadDocument(data: ArrayBuffer, password?: string): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({ data: data.slice(0), password }).promise;
}

/** Renderiza uma página em um canvas novo e devolve o elemento. */
export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext("2d")!;
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

/** Gera miniaturas (dataURL) das primeiras páginas do documento. */
export async function generateThumbnails(data: ArrayBuffer, limit = 30): Promise<string[]> {
  const doc = await loadDocument(data);
  const total = Math.min(doc.numPages, limit);
  const thumbs: string[] = [];
  for (let i = 1; i <= total; i++) {
    const canvas = await renderPageToCanvas(doc, i, 0.3);
    thumbs.push(canvas.toDataURL("image/jpeg", 0.7));
  }
  void doc.cleanup();
  return thumbs;
}

/** Extrai o texto de todas as páginas, uma string por página. */
export async function extractTextByPage(data: ArrayBuffer): Promise<string[]> {
  const doc = await loadDocument(data);
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + (item.hasEOL ? " " : "");
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }
  void doc.cleanup();
  return pages;
}

/** Renderiza páginas como blobs de imagem (PNG/JPEG) na resolução pedida. */
export async function renderPagesToImages(
  data: ArrayBuffer,
  format: "png" | "jpeg",
  dpi = 150,
  onProgress?: (percent: number) => void,
): Promise<Blob[]> {
  const doc = await loadDocument(data);
  const scale = dpi / 72;
  const blobs: Blob[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const canvas = await renderPageToCanvas(doc, i, scale);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, format === "png" ? "image/png" : "image/jpeg", 0.9),
    );
    if (blob) blobs.push(blob);
    onProgress?.(Math.round((i / doc.numPages) * 100));
  }
  void doc.cleanup();
  return blobs;
}

export async function getPageCount(data: ArrayBuffer): Promise<number> {
  const doc = await loadDocument(data);
  const count = doc.numPages;
  void doc.cleanup();
  return count;
}