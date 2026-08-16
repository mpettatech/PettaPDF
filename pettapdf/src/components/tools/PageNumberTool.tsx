import { useState } from "react";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePdfProcessor } from "@/hooks/usePdfProcessor";
import { addPageNumbers } from "@/lib/pdf-utils";

type Position = "bottom-center" | "bottom-right" | "top-right";

/** Numeração automática das páginas do PDF ativo. */
export function PageNumberTool({ onDone }: { onDone?: () => void }) {
  const { apply, isBusy, currentPdf } = usePdfProcessor();
  const [position, setPosition] = useState<Position>("bottom-center");
  const [start, setStart] = useState(1);
  const [size, setSize] = useState(11);

  if (!currentPdf) return <p className="text-sm text-muted-foreground">Selecione um PDF.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Posição</Label>
          <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-center">Rodapé centralizado</SelectItem>
              <SelectItem value="bottom-right">Rodapé à direita</SelectItem>
              <SelectItem value="top-right">Topo à direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pn-start">Começar em</Label>
          <Input
            id="pn-start"
            type="number"
            min={1}
            value={start}
            onChange={(e) => setStart(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pn-size">Tamanho</Label>
          <Input
            id="pn-size"
            type="number"
            min={8}
            max={36}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>
      </div>
      <Button
        disabled={isBusy}
        onClick={() =>
          void apply("ADD_PAGE_NUMBERS", "Numeração adicionada", (data) =>
            addPageNumbers(data, { position, start, size }),
          ).then(onDone)
        }
      >
        <Hash className="size-4" /> Numerar páginas
      </Button>
    </div>
  );
}