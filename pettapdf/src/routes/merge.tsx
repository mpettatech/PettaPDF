import { createFileRoute } from "@tanstack/react-router";
import { MergePage } from "@/pages/Merge";

export const Route = createFileRoute("/merge")({
  head: () => ({
    meta: [
      { title: "Mesclar PDFs — PettaPDF" },
      { name: "description", content: "Junte vários arquivos PDF em um único documento, com ordenação por arrastar e soltar e processamento local." },
      { property: "og:title", content: "Mesclar PDFs — PettaPDF" },
      { property: "og:description", content: "Junte vários arquivos PDF em um único documento, com ordenação por arrastar e soltar e processamento local." },
    ],
  }),
  component: MergePage,
});
