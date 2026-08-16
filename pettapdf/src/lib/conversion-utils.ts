import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ConversionOptions, TargetFormat } from "@/types";
import { extractTextByPage, renderPagesToImages } from "./pdfjs";
import { getExtension, stripExtension } from "./file-utils";

export interface ConversionResult {
  blob: Blob;
  filename: string;
  format: TargetFormat | "zip";
}

type Progress = (percent: number) => void;

const DPI_BY_QUALITY = { low: 72, medium: 150, high: 300 } as const;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );

/* ------------------------------------------------------------------ */
/* PDF -> outros formatos                                              */
/* ------------------------------------------------------------------ */

export async function pdfToTxt(data: ArrayBuffer): Promise<Blob> {
  const pages = await extractTextByPage(data);
  const text = pages.map((p, i) => `--- Página ${i + 1} ---\n${p}`).join("\n\n\f\n");
  return new Blob([text], { type: "text/plain;charset=utf-8" });
}

export async function pdfToImages(
  data: ArrayBuffer,
  name: string,
  format: "png" | "jpeg",
  dpi: number,
  onProgress?: Progress,
): Promise<ConversionResult> {
  const blobs = await renderPagesToImages(data, format, dpi, onProgress);
  const base = stripExtension(name);
  if (blobs.length === 1) {
    return { blob: blobs[0]!, filename: `${base}.${format}`, format };
  }
  const zip = new JSZip();
  blobs.forEach((blob, i) =>
    zip.file(`${base}-pagina-${String(i + 1).padStart(3, "0")}.${format}`, blob),
  );
  return {
    blob: await zip.generateAsync({ type: "blob" }),
    filename: `${base}-${format}.zip`,
    format: "zip",
  };
}

/** Gera um DOCX (ou variação DOCM/DOTX/DOTM) a partir do texto do PDF. */
export async function pdfToWord(
  data: ArrayBuffer,
  name: string,
  target: "doc" | "docx" | "docm" | "dotx" | "dotm",
): Promise<ConversionResult> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const pages = await extractTextByPage(data);
  const children = pages.flatMap((page, index) => [
    new Paragraph({ text: `Página ${index + 1}`, heading: HeadingLevel.HEADING_2 }),
    ...page
      .split("\n")
      .filter(Boolean)
      .map((line) => new Paragraph({ children: [new TextRun(line)] })),
    new Paragraph({ text: "" }),
  ]);
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);

  if (target === "docx" || target === "doc") {
    return { blob, filename: `${stripExtension(name)}.${target}`, format: target };
  }

  // DOCM/DOTX/DOTM são pacotes OPC: ajustamos [Content_Types].xml e macros.
  const zip = await JSZip.loadAsync(blob);
  const contentTypes = await zip.file("[Content_Types].xml")!.async("string");
  const mainTypes: Record<string, string> = {
    docm: "application/vnd.ms-word.document.macroEnabled.main+xml",
    dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml",
    dotm: "application/vnd.ms-word.template.macroEnabledTemplate.main+xml",
  };
  zip.file(
    "[Content_Types].xml",
    contentTypes.replace(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
      mainTypes[target]!,
    ),
  );
  if (target === "docm" || target === "dotm") {
    zip.file("word/vbaProject.bin", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]));
  }
  const out = await zip.generateAsync({ type: "blob" });
  return { blob: out, filename: `${stripExtension(name)}.${target}`, format: target };
}

export async function pdfToHtml(data: ArrayBuffer): Promise<Blob> {
  const pages = await extractTextByPage(data);
  const body = pages
    .map(
      (page, i) =>
        `<div class="page"><h2>Página ${i + 1}</h2>${page
          .split("\n")
          .filter(Boolean)
          .map((l) => `<p>${escapeXml(l)}</p>`)
          .join("")}</div>`,
    )
    .join("\n");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Documento convertido</title><style>body{font-family:Georgia,serif;max-width:52rem;margin:0 auto;padding:2rem;line-height:1.6}.page{page-break-after:always;margin-bottom:3rem}h2{color:#0f766e}</style></head><body>${body}</body></html>`;
  return new Blob([html], { type: "text/html;charset=utf-8" });
}

export async function pdfToXml(data: ArrayBuffer): Promise<Blob> {
  const pages = await extractTextByPage(data);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n${pages
    .map(
      (page, i) =>
        `  <page number="${i + 1}">\n${page
          .split("\n")
          .filter(Boolean)
          .map((l) => `    <text>${escapeXml(l)}</text>`)
          .join("\n")}\n  </page>`,
    )
    .join("\n")}\n</document>`;
  return new Blob([xml], { type: "application/xml;charset=utf-8" });
}

/** Empacota as páginas renderizadas em um container XPS (OPC/ZIP). */
export async function pdfToXps(
  data: ArrayBuffer,
  name: string,
  onProgress?: Progress,
): Promise<ConversionResult> {
  const images = await renderPagesToImages(data, "png", 150, onProgress);
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/><Default Extension="fdseq" ContentType="application/vnd.ms-package.xps-fixeddocumentsequence+xml"/><Default Extension="fdoc" ContentType="application/vnd.ms-package.xps-fixeddocument+xml"/><Default Extension="fpage" ContentType="application/vnd.ms-package.xps-fixedpage+xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/xps/2005/06/fixedrepresentation" Target="/FixedDocumentSequence.fdseq"/></Relationships>`,
  );
  zip.file(
    "FixedDocumentSequence.fdseq",
    `<?xml version="1.0" encoding="UTF-8"?><FixedDocumentSequence xmlns="http://schemas.microsoft.com/xps/2005/06"><DocumentReference Source="/Documents/1/FixedDocument.fdoc"/></FixedDocumentSequence>`,
  );
  zip.file(
    "Documents/1/FixedDocument.fdoc",
    `<?xml version="1.0" encoding="UTF-8"?><FixedDocument xmlns="http://schemas.microsoft.com/xps/2005/06">${images
      .map((_, i) => `<PageContent Source="Pages/${i + 1}.fpage"/>`)
      .join("")}</FixedDocument>`,
  );
  for (let i = 0; i < images.length; i++) {
    const bitmap = await createImageBitmap(images[i]!);
    zip.file(`Documents/1/Resources/Images/${i + 1}.png`, images[i]!);
    zip.file(
      `Documents/1/Pages/${i + 1}.fpage`,
      `<?xml version="1.0" encoding="UTF-8"?><FixedPage xmlns="http://schemas.microsoft.com/xps/2005/06" Width="${bitmap.width}" Height="${bitmap.height}" xml:lang="pt-BR"><Path Data="M 0,0 L ${bitmap.width},0 L ${bitmap.width},${bitmap.height} L 0,${bitmap.height} Z"><Path.Fill><ImageBrush ImageSource="/Documents/1/Resources/Images/${i + 1}.png" Viewbox="0,0,${bitmap.width},${bitmap.height}" ViewboxUnits="Absolute" Viewport="0,0,${bitmap.width},${bitmap.height}" ViewportUnits="Absolute" TileMode="None"/></Path.Fill></Path></FixedPage>`,
    );
    bitmap.close();
  }
  return {
    blob: await zip.generateAsync({ type: "blob" }),
    filename: `${stripExtension(name)}.xps`,
    format: "xps",
  };
}

/* ------------------------------------------------------------------ */
/* Outros formatos -> PDF                                              */
/* ------------------------------------------------------------------ */

/** Cria um PDF paginado a partir de texto puro, com fonte monoespaçada. */
export async function textToPdf(text: string): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const size = 11;
  const lineHeight = 15;
  const maxCharsPerLine = 88;
  const rawLines = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const line of rawLines) {
    if (line.length <= maxCharsPerLine) {
      lines.push(line);
      continue;
    }
    for (let i = 0; i < line.length; i += maxCharsPerLine)
      lines.push(line.slice(i, i + maxCharsPerLine));
  }
  const perPage = 50;
  for (let i = 0; i < Math.max(1, Math.ceil(lines.length / perPage)); i++) {
    const page = doc.addPage([595.28, 841.89]);
    const slice = lines.slice(i * perPage, (i + 1) * perPage);
    slice.forEach((line, index) => {
      page.drawText(line.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, " "), {
        x: 48,
        y: 800 - index * lineHeight,
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    });
  }
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

export async function imageToPdf(data: ArrayBuffer, extension: string): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const image =
    extension === "png" ? await doc.embedPng(data.slice(0)) : await doc.embedJpg(data.slice(0));
  const page = doc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

export async function imagesToPdf(
  files: { data: ArrayBuffer; name: string }[],
): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const ext = getExtension(file.name);
    const image =
      ext === "png" ? await doc.embedPng(file.data.slice(0)) : await doc.embedJpg(file.data.slice(0));
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

/** Renderiza HTML em um container oculto e captura com html2canvas, página a página. */
export async function htmlToPdf(html: string): Promise<ArrayBuffer> {
  const html2canvas = (await import("html2canvas")).default;
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;color:#111111;padding:40px;font-family:Georgia,serif;line-height:1.6;";
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
    const doc = await PDFDocument.create();
    const pageHeightPx = Math.round((canvas.width * 841.89) / 595.28);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));
    for (let i = 0; i < totalPages; i++) {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(pageHeightPx, canvas.height - i * pageHeightPx);
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, -i * pageHeightPx);
      const dataUrl = slice.toDataURL("image/png");
      const image = await doc.embedPng(dataUrl);
      const page = doc.addPage([595.28, (slice.height / slice.width) * 595.28]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });
    }
    return (await doc.save()).slice().buffer as ArrayBuffer;
  } finally {
    container.remove();
  }
}

export async function docxToPdf(data: ArrayBuffer): Promise<ArrayBuffer> {
  const mammoth = await import("mammoth");
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer: data.slice(0) });
    if (!result.value.trim()) throw new Error("empty");
    return await htmlToPdf(result.value);
  } catch {
    // DOC binário ou pacote não suportado pelo mammoth: usa o texto bruto do XML.
    const text = await extractOoxmlText(data);
    if (!text.trim())
      throw new Error(
        "Não foi possível ler este documento do Word. Salve-o como .docx no Word e tente novamente.",
      );
    return await textToPdf(text);
  }
}

/** Lê word/document.xml de um pacote OOXML (docx, docm, dotx, dotm) e devolve o texto. */
export async function extractOoxmlText(data: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(data.slice(0));
    const entry = zip.file("word/document.xml");
    if (!entry) return "";
    const xml = await entry.async("string");
    const { xml2js } = await import("xml-js");
    const parsed = xml2js(xml, { compact: false }) as unknown;
    const lines: string[] = [];
    const walk = (node: any, buffer: { text: string }) => {
      if (!node) return;
      if (node.name === "w:p") {
        const local = { text: "" };
        (node.elements ?? []).forEach((child: any) => walk(child, local));
        lines.push(local.text.trim());
        return;
      }
      if (node.name === "w:t" && node.elements?.length) {
        buffer.text += node.elements.map((e: any) => e.text ?? "").join("");
        return;
      }
      (node.elements ?? []).forEach((child: any) => walk(child, buffer));
    };
    walk(parsed as any, { text: "" });
    return lines.join("\n");
  } catch {
    return "";
  }
}

export async function xmlToPdf(data: ArrayBuffer): Promise<ArrayBuffer> {
  const { xml2js } = await import("xml-js");
  const source = new TextDecoder().decode(data);
  const lines: string[] = [];
  try {
    const parsed = xml2js(source, { compact: false }) as any;
    const walk = (node: any, depth: number) => {
      if (!node) return;
      if (node.type === "text" && node.text?.trim()) {
        lines.push(`${"  ".repeat(depth)}${node.text.trim()}`);
      }
      if (node.name) lines.push(`${"  ".repeat(depth)}[${node.name}]`);
      (node.elements ?? []).forEach((child: any) => walk(child, depth + 1));
    };
    walk(parsed, 0);
  } catch {
    throw new Error("XML inválido: não foi possível interpretar o arquivo.");
  }
  return textToPdf(lines.join("\n"));
}

/** Extrai as imagens de um pacote XPS e monta um PDF com elas. */
export async function xpsToPdf(data: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(data.slice(0));
  const imageEntries = Object.keys(zip.files)
    .filter((path) => /\.(png|jpe?g)$/i.test(path))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const doc = await PDFDocument.create();
  for (const path of imageEntries) {
    const bytes = await zip.file(path)!.async("uint8array");
    const image = /\.png$/i.test(path) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  if (!doc.getPageCount()) {
    const texts: string[] = [];
    for (const path of Object.keys(zip.files).filter((p) => p.endsWith(".fpage"))) {
      const xml = await zip.file(path)!.async("string");
      texts.push(...[...xml.matchAll(/UnicodeString="([^"]*)"/g)].map((m) => m[1] ?? ""));
    }
    if (!texts.length) throw new Error("Arquivo XPS sem páginas legíveis.");
    return textToPdf(texts.join("\n"));
  }
  return (await doc.save()).slice().buffer as ArrayBuffer;
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

/**
 * Converte um arquivo carregado para o formato alvo.
 * Lança erros com mensagens em português quando a combinação não é suportada.
 */
export async function convertFile(
  file: { name: string; data: ArrayBuffer },
  options: ConversionOptions,
  onProgress?: Progress,
): Promise<ConversionResult> {
  const ext = getExtension(file.name);
  const base = stripExtension(file.name);
  const target = options.targetFormat;
  const dpi = options.dpi ?? DPI_BY_QUALITY[options.quality ?? "medium"];
  onProgress?.(5);

  const finishPdf = (buffer: ArrayBuffer): ConversionResult => ({
    blob: new Blob([buffer], { type: "application/pdf" }),
    filename: `${base}.pdf`,
    format: "pdf",
  });

  if (ext === "pdf") {
    switch (target) {
      case "txt": {
        if (options.ocrEnabled) {
          const { ocrPdf } = await import("./ocr-utils");
          const text = await ocrPdf(file.data, onProgress);
          return {
            blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
            filename: `${base}.txt`,
            format: "txt",
          };
        }
        onProgress?.(60);
        return { blob: await pdfToTxt(file.data), filename: `${base}.txt`, format: "txt" };
      }
      case "png":
      case "jpeg":
        return pdfToImages(file.data, file.name, target, dpi, onProgress);
      case "html":
        onProgress?.(60);
        return { blob: await pdfToHtml(file.data), filename: `${base}.html`, format: "html" };
      case "xml":
        onProgress?.(60);
        return { blob: await pdfToXml(file.data), filename: `${base}.xml`, format: "xml" };
      case "doc":
      case "docx":
      case "docm":
      case "dotx":
      case "dotm":
        onProgress?.(50);
        return pdfToWord(file.data, file.name, target);
      case "xps":
        return pdfToXps(file.data, file.name, onProgress);
      case "pdf":
        return {
          blob: new Blob([file.data.slice(0)], { type: "application/pdf" }),
          filename: file.name,
          format: "pdf",
        };
    }
  }

  if (target !== "pdf") {
    throw new Error(
      `Conversão de .${ext} para .${target} não é suportada. Converta primeiro para PDF.`,
    );
  }

  onProgress?.(35);
  switch (ext) {
    case "txt":
      return finishPdf(await textToPdf(new TextDecoder().decode(file.data)));
    case "png":
    case "jpg":
    case "jpeg":
      return finishPdf(await imageToPdf(file.data, ext === "png" ? "png" : "jpg"));
    case "docx":
    case "doc":
      return finishPdf(await docxToPdf(file.data));
    case "docm":
    case "dotx":
    case "dotm": {
      const text = await extractOoxmlText(file.data);
      if (!text.trim()) throw new Error("Documento sem texto legível.");
      return finishPdf(await textToPdf(text));
    }
    case "xml":
      return finishPdf(await xmlToPdf(file.data));
    case "html":
    case "htm":
      return finishPdf(await htmlToPdf(new TextDecoder().decode(file.data)));
    case "xps":
      return finishPdf(await xpsToPdf(file.data));
    default:
      throw new Error(`Formato ".${ext}" não suportado para conversão.`);
  }
}

export const TARGET_LABELS: Record<TargetFormat, string> = {
  pdf: "PDF",
  txt: "Texto (.txt)",
  jpeg: "Imagem JPEG",
  png: "Imagem PNG",
  doc: "Word 97 (.doc)",
  docx: "Word (.docx)",
  docm: "Word com macros (.docm)",
  xml: "XML",
  html: "HTML",
  dotx: "Modelo Word (.dotx)",
  dotm: "Modelo com macros (.dotm)",
  xps: "XPS",
};