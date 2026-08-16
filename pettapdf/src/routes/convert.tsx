import { createFileRoute } from "@tanstack/react-router";
import { ConvertPage } from "@/pages/Convert";

export const Route = createFileRoute("/convert")({
  head: () => ({
    meta: [
      { title: "Converter PDF para Word, imagem e mais — PettaPDF" },
      { name: "description", content: "Converta PDF para DOCX, TXT, PNG, JPEG, HTML, XML e XPS, ou transforme documentos e imagens em PDF." },
      { property: "og:title", content: "Converter PDF para Word, imagem e mais — PettaPDF" },
      { property: "og:description", content: "Converta PDF para DOCX, TXT, PNG, JPEG, HTML, XML e XPS, ou transforme documentos e imagens em PDF." },
    ],
  }),
  component: ConvertPage,
});
