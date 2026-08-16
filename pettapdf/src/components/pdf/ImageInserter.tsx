import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (file: File, widthRatio: number) => void;
}

/** Escolha e dimensionamento da imagem antes de inserir na página. */
export function ImageInserter({ open, onClose, onInsert }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState(40);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inserir imagem</DialogTitle>
          <DialogDescription>
            A imagem será posicionada no ponto clicado da página atual.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="insert-image">Arquivo PNG ou JPG</Label>
            <Input
              id="insert-image"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                setFile(selected);
                setPreview(selected ? URL.createObjectURL(selected) : null);
              }}
            />
          </div>
          {preview && (
            <img
              src={preview}
              alt="Pré-visualização da imagem selecionada"
              className="mx-auto max-h-48 rounded border border-border object-contain"
            />
          )}
          <div className="space-y-2">
            <Label>Largura: {width}% da página</Label>
            <Slider
              value={[width]}
              min={5}
              max={100}
              step={1}
              onValueChange={([value]) => setWidth(value ?? 40)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!file} onClick={() => file && onInsert(file, width / 100)}>
            Inserir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}