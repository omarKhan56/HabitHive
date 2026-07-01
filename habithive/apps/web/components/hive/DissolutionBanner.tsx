"use client";
 
import { AlertOctagon, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useUIStore } from "@/store/useUIStore";
 
export interface DissolutionBannerProps {
  hiveId: string;
  reason?: string | null;
  onFindNewHive?: () => void;
}
 
/**
 * Shown on the dashboard/hive page when a hive's status flips to "dissolved"
 * (worker's dissolveHives.job.ts). The user is automatically re-queued into
 * the matching pool server-side — this banner just informs them and offers
 * a way to acknowledge it.
 */
export function DissolutionBanner({ hiveId, reason, onFindNewHive }: DissolutionBannerProps) {
  const dismissed = useUIStore((s) => s.dismissedDissolutionBanners.has(hiveId));
  const dismiss = useUIStore((s) => s.dismissDissolutionBanner);
 
  if (dismissed) return null;
 
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">Your hive was dissolved</p>
        <p className="mt-0.5 text-sm text-red-600">
          {reason ?? "A member missed too many consecutive check-ins."}
        </p>
        <p className="mt-1 text-xs text-red-500">
          You&#x2019;ve been added back to the matching pool — we&#x2019;ll form a new hive for
          you soon.
        </p>
        {onFindNewHive && (
          <Button size="sm" variant="danger" className="mt-2" onClick={onFindNewHive}>
            Got it
          </Button>
        )}
      </div>
      <button
        onClick={() => dismiss(hiveId)}
        aria-label="Dismiss"
        className="rounded-md p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}