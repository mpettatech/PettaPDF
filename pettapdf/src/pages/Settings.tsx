import { Layout } from "@/components/layout/Layout";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useUiStore } from "@/store/uiStore";

const SHORTCUTS: [string, string][] = [
  ["Ctrl/Cmd + Z", "Desfazer"],
  ["Ctrl/Cmd + Y", "Refazer"],
  ["Ctrl/Cmd + S", "Salvar PDF"],
  ["Ctrl/Cmd + Shift + M", "Mesclar"],
  ["Ctrl/Cmd + Shift + C", "Converter"],
  ["Delete", "Excluir página atual"],
];

export function SettingsPage() {
  const { isDarkMode, toggleDarkMode } = useUiStore();

  return (
    <Layout>
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <div className="mt-8 space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <Label htmlFor="dark">Modo escuro</Label>
              <p className="text-sm text-muted-foreground">Interface em tons de grafite.</p>
            </div>
            <Switch id="dark" checked={isDarkMode} onCheckedChange={() => toggleDarkMode()} />
          </div>
          <Separator />
          <div>
            <h2 className="text-sm font-semibold">Atalhos de teclado</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {SHORTCUTS.map(([key, action]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{action}</span>
                  <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                    {key}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            <h2 className="text-sm font-semibold text-foreground">Privacidade</h2>
            <p className="mt-2">
              Todo o processamento acontece no seu navegador. Nenhum arquivo é enviado para
              servidores; limite recomendado de 100 MB por arquivo.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}