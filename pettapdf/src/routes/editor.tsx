import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "@/pages/Editor";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor de PDF online — PettaPDF" },
      { name: "description", content: "Edite textos, insira imagens, destaque trechos, gire, reordene e exclua páginas do seu PDF direto no navegador." },
      { property: "og:title", content: "Editor de PDF online — PettaPDF" },
      { property: "og:description", content: "Edite textos, insira imagens, destaque trechos, gire, reordene e exclua páginas do seu PDF direto no navegador." },
    ],
  }),
  component: EditorPage,
});
