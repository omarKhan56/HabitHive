"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { PresenceIndicator } from "./PresenceIndicator";
import { useChat } from "@/hooks/useChat";
import { Button, Spinner, EmptyState } from "@/components/ui";
import { MessageCircle } from "lucide-react";
import type { HiveMemberDTO } from "@/lib/api-client";

export interface ChatWindowProps {
  hiveId: string;
  members: HiveMemberDTO[];
}

/**
 * Full chat UI: connects to the realtime service on mount via useChat(),
 * auto-scrolls to the latest message, and shows typing indicators.
 * Mirrors the socket event contract in apps/realtime/handlers/chat.ts.
 */
export function ChatWindow({ hiveId, members }: ChatWindowProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id as string | undefined;
  const { messages, send, connected, typingUserIds, startTyping, stopTyping } =
    useChat(hiveId);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build a lookup so MessageBubble can display sender names
  const memberMap = Object.fromEntries(members.map((m) => [m.user.id, m.user.name]));

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!draft.trim()) return;
    send(draft);
    setDraft("");
    stopTyping();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const typingNames = typingUserIds
    .filter((id) => id !== currentUserId)
    .map((id) => memberMap[id] ?? "Someone")
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
          />
          <span className="text-xs text-slate-500">
            {connected ? "Connected" : "Connecting…"}
          </span>
        </div>
        <PresenceIndicator members={members} currentUserId={currentUserId} />
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Be the first to say something to your hive!"
          />
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            body={m.body}
            senderName={memberMap[m.userId] ?? "Member"}
            createdAt={m.createdAt}
            isOwn={m.userId === currentUserId}
          />
        ))}

        {typingNames.length > 0 && (
          <p className="text-xs text-slate-400 italic">
            {typingNames.join(" and ")} {typingNames.length === 1 ? "is" : "are"} typing…
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-slate-100 p-3">
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            startTyping();
          }}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder="Message your hive…"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!draft.trim() || !connected}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}