import { Avatar } from "@/components/ui";

export interface MessageBubbleProps {
  body: string;
  senderName: string;
  createdAt: string;
  isOwn: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ body, senderName, createdAt, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && <Avatar name={senderName} size="sm" />}

      <div className={`flex max-w-[75%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <span className="px-1 text-xs text-slate-400">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isOwn
              ? "rounded-br-sm bg-amber-500 text-white"
              : "rounded-bl-sm bg-slate-100 text-slate-800"
          }`}
        >
          {body}
        </div>
        <span className="px-1 text-xs text-slate-400">{formatTime(createdAt)}</span>
      </div>
    </div>
  );
}