import { Link } from "@tanstack/react-router";
import { FileText, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/uiStore";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/editor", label: "Editor" },
  { to: "/merge", label: "Mesclar" },
  { to: "/convert", label: "Converter" },
  { to: "/settings", label: "Ajustes" },
] as const;

export function Header() {
  const { isDarkMode, toggleDarkMode, toggleSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
          aria-label="Alternar menu lateral"
        >
          <Menu className="size-5" />
        </Button>

        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <FileText className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">PettaPDF</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/editor">Abrir editor</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}