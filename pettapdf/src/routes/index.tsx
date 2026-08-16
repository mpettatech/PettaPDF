import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/Home";

const title = "PettaPDF — Editor e conversor de PDF no navegador";
const description =
  "Edite, mescle, divida, comprima e converta PDFs para Word, imagens, HTML e XML direto no navegador, sem enviar arquivos para servidores.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: HomePage,
});
