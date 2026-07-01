import { cn } from "@/lib/utils";

export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

const PALETTE = [
  "bg-amber-200 text-amber-800",
  "bg-emerald-200 text-emerald-800",
  "bg-blue-200 text-blue-800",
  "bg-purple-200 text-purple-800",
  "bg-rose-200 text-rose-800",
];

function colorFor(name: string) {
  const idx = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[idx];
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Used wherever a HiveMember needs a face — MemberList, chat messages, presence dots. */
export function Avatar({ name, size = "md", online, className }: AvatarProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold",
          SIZE_CLASSES[size],
          colorFor(name)
        )}
      >
        {initialsFor(name)}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
            online ? "bg-emerald-500" : "bg-slate-300"
          )}
          aria-label={online ? "online" : "offline"}
        />
      )}
    </div>
  );
}
