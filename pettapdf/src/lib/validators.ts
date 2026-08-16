export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ACCEPTED_EXTENSIONS = [
  "pdf",
  "txt",
  "jpeg",
  "jpg",
  "png",
  "doc",
  "docx",
  "docm",
  "xml",
  "html",
  "htm",
  "dotx",
  "dotm",
  "xps",
] as const;

export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",");

const MIME_HINTS: Record<string, string[]> = {
  pdf: ["application/pdf"],
  txt: ["text/plain", ""],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  xml: ["text/xml", "application/xml", ""],
  html: ["text/html", ""],
  htm: ["text/html", ""],
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Valida extensão, tipo MIME (quando conhecido) e tamanho máximo de 100MB. */
export function validateFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { valid: false, error: `Formato ".${ext}" não suportado.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" excede o limite de 100 MB.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" está vazio.` };
  }
  const hints = MIME_HINTS[ext];
  if (hints && file.type && !hints.includes(file.type)) {
    return {
      valid: false,
      error: `O conteúdo de "${file.name}" (${file.type}) não corresponde à extensão .${ext}.`,
    };
  }
  return { valid: true };
}

export function isPdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

export function isImage(name: string) {
  return /\.(png|jpe?g)$/i.test(name);
}

/** Converte "1-3, 5" em [1,2,3,5] validando contra o total de páginas. */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const chunk of input.split(",")) {
    const part = chunk.trim();
    if (!part) continue;
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end > pageCount || start > end)
        throw new Error(`Intervalo inválido: "${part}" (documento tem ${pageCount} páginas).`);
      for (let i = start; i <= end; i++) pages.add(i);
      continue;
    }
    const single = Number(part);
    if (!Number.isInteger(single) || single < 1 || single > pageCount)
      throw new Error(`Página inválida: "${part}" (documento tem ${pageCount} páginas).`);
    pages.add(single);
  }
  if (!pages.size) throw new Error("Informe ao menos uma página.");
  return [...pages].sort((a, b) => a - b);
}