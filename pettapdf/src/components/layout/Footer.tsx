import { Link } from "@tanstack/react-router";

const COLUMNS = [
  {
    title: "Ferramentas",
    links: [
      { label: "Editor de PDF", to: "/editor" as const },
      { label: "Mesclar PDFs", to: "/merge" as const },
      { label: "Converter arquivos", to: "/convert" as const },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Preferências", to: "/settings" as const },
      { label: "Início", to: "/" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">PettaPDF</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Processamento local: seus documentos nunca saem do navegador.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Termos de uso</li>
            <li>Política de privacidade</li>
            <li>Contato</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PettaPDF · Petta Tech
      </div>
    </footer>
  );
}