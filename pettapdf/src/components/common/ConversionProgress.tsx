import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ConversionProgress({
  isProcessing,
  progress,
  label = "Processando…",
}: {
  isProcessing: boolean;
  progress: number;
  label?: string;
}) {
  if (!isProcessing) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}