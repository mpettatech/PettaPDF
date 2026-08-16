import { useState } from "react";
import { Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePdfStore } from "@/store/pdfStore";
import { removePassword } from "@/lib/pdf-utils";
import { download, stripExtension } from "@/lib/file-utils";
import { loadDocument } from "@/lib/pdfjs";

/**
 * Remove a proteção de um PDF. Quando o documento exige senha de abertura,
 * ela é usada para destravar o conteúdo antes de reescrever o arquivo.
 */
export function PasswordTool({ onDone }: { onDone?: () => void }) {
  const currentPdf = usePdfStore((s) => s.currentPdf);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!currentPdf) return;
    setBusy(true);
    try {
      // Valida a senha (se houver) antes de reescrever o documento.
      const doc = await loadDocument(currentPdf.data, password || undefined);
      void doc.cleanup();
      const bytes = await removePassword(currentPdf.data);
      download(
        new Blob([bytes], { type: "application/pdf" }),
        `${stripExtension(currentPdf.name)}-desbloqueado.pdf`,
      );
      toast.success("Proteção removida.");
      onDone?.();
    } catch (error) {
      toast.error("Não foi possível desbloquear", {
        description:
          error instanceof Error && /password/i.test(error.message)
            ? "Senha incorreta ou ausente."
            : "Verifique se o arquivo é um PDF válido.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!currentPdf) return <p className="text-sm text-muted-foreground">Selecione um PDF.</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pdf-password">Senha do documento (se houver)</Label>
        <Input
          id="pdf-password"
          type="password"
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Alert>
        <AlertTitle>Sobre a criptografia</AlertTitle>
        <AlertDescription>
          O PettaPDF processa tudo no navegador e, por isso, remove proteções existentes. Para
          aplicar uma nova senha de abertura é necessário um serviço com criptografia AES no
          servidor.
        </AlertDescription>
      </Alert>
      <Button onClick={run} disabled={busy}>
        <Unlock className="size-4" /> {busy ? "Processando…" : "Remover proteção e baixar"}
      </Button>
    </div>
  );
}