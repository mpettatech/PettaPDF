import { useState } from "react";
import { Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { usePdfProcessor } from "@/hooks/usePdfProcessor";
import { addWatermark } from "@/lib/pdf-utils";

/** Aplica uma marca d'água de texto em todas as páginas do PDF ativo. */
export function WatermarkTool({ onDone }: { onDone?: () => void }) {
  const { apply, isBusy, currentPdf } = usePdfProcessor();
  const [text, setText] = useState("CONFIDENCIAL");
  const [opacity, setOpacity] = useState(25);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState("#ff0000");

  if (!currentPdf) return <p className="text-sm text-muted-foreground">Selecione um PDF.</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wm-text">Texto</Label>
        <Input id="wm-text" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Opacidade: {opacity}%</Label>
          <Slider
            value={[opacity]}
            min={5}
            max={100}
            onValueChange={([v]) => setOpacity(v ?? 25)}
          />
        </div>
        <div className="space-y-2">
          <Label>Tamanho: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            min={12}
            max={140}
            onValueChange={([v]) => setFontSize(v ?? 48)}
          />
        </div>
        <div className="space-y-2">
          <Label>Rotação: {rotation}°</Label>
          <Slider
            value={[rotation]}
            min={0}
            max={90}
            onValueChange={([v]) => setRotation(v ?? 45)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wm-color">Cor</Label>
          <Input
            id="wm-color"
            type="color"
            className="h-9 p-1"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
      </div>
      <Button
        disabled={isBusy || !text.trim()}
        onClick={() =>
          void apply("ADD_WATERMARK", "Marca d'água aplicada", (data) =>
            addWatermark(data, { text, opacity: opacity / 100, fontSize, color, rotation }),
          ).then(onDone)
        }
      >
        <Stamp className="size-4" /> Aplicar marca d'água
      </Button>
    </div>
  );
}