/**
 * OCR no navegador com tesseract.js (carregado sob demanda para não pesar no bundle).
 */
export async function recognizeImage(
  source: Blob | string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(source);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/** Executa OCR em cada página renderizada de um PDF. */
export async function ocrPdf(
  data: ArrayBuffer,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { renderPagesToImages } = await import("./pdfjs");
  const images = await renderPagesToImages(data, "png", 150);
  const parts: string[] = [];
  for (let i = 0; i < images.length; i++) {
    parts.push(await recognizeImage(images[i]!));
    onProgress?.(Math.round(((i + 1) / images.length) * 100));
  }
  return parts.join("\n\n--- página ---\n\n");
}