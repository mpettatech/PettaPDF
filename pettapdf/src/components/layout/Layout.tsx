import { useEffect, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useUiStore } from "@/store/uiStore";

interface LayoutProps {
  children: ReactNode;
  withFooter?: boolean;
}

export function Layout({ children, withFooter = true }: LayoutProps) {
  const setDarkMode = useUiStore((s) => s.setDarkMode);

  useEffect(() => {
    const stored = localStorage.getItem("pettapdf-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(stored ? stored === "dark" : prefersDark);
  }, [setDarkMode]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      {withFooter && <Footer />}
    </div>
  );
}