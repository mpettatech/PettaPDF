import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/Settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — PettaPDF" },
      { name: "description", content: "Ajuste o tema, veja os atalhos de teclado e saiba como o PettaPDF protege a privacidade dos seus arquivos." },
      { property: "og:title", content: "Configurações — PettaPDF" },
      { property: "og:description", content: "Ajuste o tema, veja os atalhos de teclado e saiba como o PettaPDF protege a privacidade dos seus arquivos." },
    ],
  }),
  component: SettingsPage,
});
