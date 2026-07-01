import { Flame } from "lucide-react";
import { Badge } from "@/components/ui";
 
export interface StreakBadgeProps {
  streak: number;
}
 
/** Color escalates with streak length to make momentum visually obvious. */
export function StreakBadge({ streak }: StreakBadgeProps) {
  const variant = streak === 0 ? "default" : streak < 3 ? "info" : streak < 7 ? "warning" : "success";
 
  return (
    <Badge variant={variant} className="gap-1">
      <Flame className="h-3 w-3" />
      {streak} day{streak === 1 ? "" : "s"}
    </Badge>
  );
}