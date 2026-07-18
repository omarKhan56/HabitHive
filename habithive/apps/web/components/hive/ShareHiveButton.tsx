"use client";

import { useState } from "react";
import { Share2, Download, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

export interface ShareHiveButtonProps {
  hiveId: string;
}

export function ShareHiveButton({ hiveId }: ShareHiveButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleShare() {
    setStatus("loading");

    try {
      const res = await fetch(`/api/export/hive-card?hiveId=${hiveId}`);

      if (!res.ok) throw new Error("Failed to generate card");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "habithive-card.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("[share] error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={status === "loading"}
      className="gap-2"
    >
      {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {status === "error" && <Share2 className="h-4 w-4 text-red-500" />}
      {status === "idle" && <Share2 className="h-4 w-4" />}

      {status === "loading" && "Generating card…"}
      {status === "done" && "Downloaded!"}
      {status === "error" && "Try again"}
      {status === "idle" && "Share My Hive"}
    </Button>
  );
}