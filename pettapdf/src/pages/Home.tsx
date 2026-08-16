import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileText,
  Hash,
  Layers,
  Lock,
  Minimize2,
  RefreshCw,
  ScanText,
  Scissors,
  ShieldCheck,
  Stamp,
  Zap,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: FileText, title: "Editar PDF", text: "Altere textos existentes, insira novos blocos, imagens e destaques." },
  { icon: Layers, title: "Mesclar", text: "Combine vários PDFs na ordem que preferir, com arrastar e soltar." },
  { icon: Scissors, title: "Dividir", text: "Extraia intervalos de páginas ou gere um arquivo por página." },
  { icon: RefreshCw, title: "Converter", text: "PDF ↔ Word, TXT, PNG, JPEG, HTML, XML e XPS." },
  { icon: Minimize2, title: "Comprimir", text: "Reduza o tamanho do arquivo mantendo a legibilidade." },
  { icon: ScanText, title: "OCR", text: "Extraia texto de documentos digitalizados direto no navegador." },
  { icon: Stamp, title: "Marca d'água", text: "Texto personalizado com opacidade, cor e rotação." },
  { icon: Hash, title: "Numerar páginas", text: "Numeração automática com posição e estilo configuráveis." },
  { icon: Lock, title: "Proteção", text: "Remova restrições de arquivos protegidos que você possui." },
];

export function HomePage() {
  return (
    <Layout>
      <section className="border-b border-border bg-hero-gradient">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5" /> 100% no navegador — seus arquivos não saem daqui
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
              PettaPDF: edite, converta e organize PDFs sem instalar nada
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Um editor completo com mesclagem, divisão, compressão, OCR e conversão para Word,
              imagens, HTML e XML — tudo processado localmente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/editor">
                  Começar agora <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/convert">Converter um arquivo</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Zap className="size-4 text-primary" /> Sem upload para servidores
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4 text-primary" /> Até 100 MB por arquivo
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="space-y-3">
              {["documento-final.pdf", "contrato-2026.pdf", "relatorio.docx"].map((name, i) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <FileText className="size-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${100 - i * 25}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold">Todas as ferramentas</h2>
        <p className="mt-2 text-muted-foreground">Escolha uma operação e comece em segundos.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              to="/editor"
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
            >
              <feature.icon className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}