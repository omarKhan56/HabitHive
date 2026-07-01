import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-400">
      <Loader2 className={cn("h-5 w-5 animate-spin", className)} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
