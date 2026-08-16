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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface SelectedText {
  text: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  fontSize: number;
}

interface Props {
  selection: SelectedText | null;
  onClose: () => void;
  onSave: (text: string, size: number, color: string) => void;
}

/** Editor flutuante para substituir um trecho de texto existente no PDF. */
export function TextEditorOverlay({ selection, onClose, onSave }: Props) {
  const [value, setValue] = useState("");
  const [size, setSize] = useState(12);
  const [color, setColor] = useState("#111111");

  return (
    <Dialog
      open={!!selection}
      onOpenChange={(open) => {
        if (!open) onClose();
        if (open && selection) {
          setValue(selection.text);
          setSize(Math.max(6, Math.round(selection.fontSize)));
        }
      }}
    >
      <DialogContent
        onOpenAutoFocus={() => {
          if (selection) {
            setValue(selection.text);
            setSize(Math.max(6, Math.round(selection.fontSize)));
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar texto</DialogTitle>
          <DialogDescription>
            O trecho original é coberto e o novo texto é inserido na mesma posição (fonte
            Helvetica).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-text">Texto</Label>
            <Textarea
              id="edit-text"
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-size">Tamanho</Label>
              <Input
                id="edit-size"
                type="number"
                min={8}
                max={72}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Cor</Label>
              <Input
                id="edit-color"
                type="color"
                value={color}
                className="h-9 p-1"
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(value, size, color)} disabled={!value.trim()}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}