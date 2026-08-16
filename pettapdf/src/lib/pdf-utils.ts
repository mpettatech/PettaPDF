import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFFont } from "pdf-lib";

export type FontName = "Helvetica" | "TimesRoman" | "Courier";

const FONT_MAP: Record<FontName, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  TimesRoman: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

export async function loadPdf(data: ArrayBuffer) {
  try {
    return await PDFDocument.load(data.slice(0), { ignoreEncryption: true });
  } catch {
    throw new Error("Não foi possível abrir o PDF. O arquivo pode estar corrompido ou protegido.");
  }
}

export function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.replace(/./g, "$&$&") : clean, 16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

async function embedFont(doc: PDFDocument, font: FontName): Promise<PDFFont> {
  return doc.embedFont(FONT_MAP[font]);
}

export interface AddTextOptions {
  pageIndex: number;
  text: string;
  /** Coordenadas relativas (0-1) a partir do canto superior esquerdo. */
  xRatio: number;
  yRatio: number;
  size: number;
  color: string;
  font: FontName;
  rotation?: number;
}

/** Insere texto em uma página existente e devolve os novos bytes do PDF. */
export async function addText(data: ArrayBuffer, options: AddTextOptions): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const page = doc.getPage(options.pageIndex);
  const { width, height } = page.getSize();
  const font = await embedFont(doc, options.font);
  page.drawText(options.text, {
    x: options.xRatio * width,
    y: height - options.yRatio * height,
    size: options.size,
    font,
    color: hexToRgb(options.color),
    rotate: degrees(options.rotation ?? 0),
  });
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

/** Cobre a área do texto original com um retângulo branco e escreve o novo texto. */
export async function replaceText(
  data: ArrayBuffer,
  options: AddTextOptions & { boxWidthRatio: number; boxHeightRatio: number },
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const page = doc.getPage(options.pageIndex);
  const { width, height } = page.getSize();
  const font = await embedFont(doc, options.font);
  const x = options.xRatio * width;
  const y = height - options.yRatio * height;
  page.drawRectangle({
    x: x - 1,
    y: y - options.size * 0.25,
    width: options.boxWidthRatio * width + 3,
    height: options.boxHeightRatio * height + 2,
    color: rgb(1, 1, 1),
  });
  page.drawText(options.text, {
    x,
    y,
    size: options.size,
    font,
    color: hexToRgb(options.color),
  });
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

export async function addImage(
  data: ArrayBuffer,
  imageBytes: ArrayBuffer,
  mime: string,
  opts: { pageIndex: number; xRatio: number; yRatio: number; widthRatio: number },
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const page = doc.getPage(opts.pageIndex);
  const { width, height } = page.getSize();
  const image = mime.includes("png")
    ? await doc.embedPng(imageBytes)
    : await doc.embedJpg(imageBytes);
  const drawWidth = opts.widthRatio * width;
  const drawHeight = (image.height / image.width) * drawWidth;
  page.drawImage(image, {
    x: opts.xRatio * width,
    y: height - opts.yRatio * height - drawHeight,
    width: drawWidth,
    height: drawHeight,
  });
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

/** Destaque amarelo semitransparente sobre uma região da página. */
export async function highlightArea(
  data: ArrayBuffer,
  opts: {
    pageIndex: number;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  },
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const page = doc.getPage(opts.pageIndex);
  const { width, height } = page.getSize();
  const rectHeight = opts.heightRatio * height;
  page.drawRectangle({
    x: opts.xRatio * width,
    y: height - opts.yRatio * height - rectHeight,
    width: opts.widthRatio * width,
    height: rectHeight,
    color: rgb(1, 0.9, 0.2),
    opacity: 0.3,
  });
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

export async function rotatePage(
  data: ArrayBuffer,
  pageIndex: number,
  delta: number,
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const page = doc.getPage(pageIndex);
  const current = page.getRotation().angle;
  page.setRotation(degrees((current + delta + 360) % 360));
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

export async function deletePage(data: ArrayBuffer, pageIndex: number): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  if (doc.getPageCount() <= 1) throw new Error("O documento precisa ter ao menos uma página.");
  doc.removePage(pageIndex);
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

/** Move uma página de posição usando remove/insert. */
export async function reorderPage(
  data: ArrayBuffer,
  from: number,
  to: number,
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const order = doc.getPageIndices();
  const moved = order.splice(from, 1)[0]!;
  order.splice(to, 0, moved);
  const next = await PDFDocument.create();
  const pages = await next.copyPages(doc, order);
  pages.forEach((p) => next.addPage(p));
  return (await next.save()).slice().buffer as ArrayBuffer;
}

export async function extractPages(data: ArrayBuffer, pages: number[]): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const next = await PDFDocument.create();
  const copied = await next.copyPages(
    doc,
    pages.map((p) => p - 1),
  );
  copied.forEach((p) => next.addPage(p));
  return (await next.save()).slice().buffer as ArrayBuffer;
}

export async function mergePdfs(
  sources: { data: ArrayBuffer; pages?: number[] }[],
): Promise<ArrayBuffer> {
  const merged = await PDFDocument.create();
  for (const source of sources) {
    const doc = await loadPdf(source.data);
    const indices = source.pages?.length
      ? source.pages.map((p) => p - 1)
      : doc.getPageIndices();
    const copied = await merged.copyPages(doc, indices);
    copied.forEach((p) => merged.addPage(p));
  }
  return (await merged.save()).slice().buffer as ArrayBuffer;
}

/** Recompacta o PDF com object streams e metadados enxutos. */
export async function compressPdf(data: ArrayBuffer): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("PettaPDF");
  doc.setCreator("PettaPDF");
  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  return bytes.slice().buffer as ArrayBuffer;
}

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  rotation: number;
}

export async function addWatermark(
  data: ArrayBuffer,
  opts: WatermarkOptions,
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
    page.drawText(opts.text, {
      x: width / 2 - (textWidth / 2) * Math.cos((opts.rotation * Math.PI) / 180),
      y: height / 2 - opts.fontSize / 2,
      size: opts.fontSize,
      font,
      color: hexToRgb(opts.color),
      opacity: opts.opacity,
      rotate: degrees(opts.rotation),
    });
  }
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

export async function addPageNumbers(
  data: ArrayBuffer,
  opts: { position: "bottom-center" | "bottom-right" | "top-right"; start: number; size: number },
): Promise<ArrayBuffer> {
  const doc = await loadPdf(data);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page, index) => {
    const { width, height } = page.getSize();
    const label = `${opts.start + index}`;
    const textWidth = font.widthOfTextAtSize(label, opts.size);
    const positions = {
      "bottom-center": { x: width / 2 - textWidth / 2, y: 24 },
      "bottom-right": { x: width - textWidth - 32, y: 24 },
      "top-right": { x: width - textWidth - 32, y: height - 32 },
    };
    const { x, y } = positions[opts.position];
    page.drawText(label, { x, y, size: opts.size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

/** Remove a proteção reescrevendo o documento sem criptografia. */
export async function removePassword(data: ArrayBuffer): Promise<ArrayBuffer> {
  const doc = await PDFDocument.load(data.slice(0), { ignoreEncryption: true });
  const next = await PDFDocument.create();
  const copied = await next.copyPages(doc, doc.getPageIndices());
  copied.forEach((p) => next.addPage(p));
  return (await next.save()).slice().buffer as ArrayBuffer;
}

export function toBlob(data: ArrayBuffer, type = "application/pdf") {
  return new Blob([data], { type });
}