"use client";

import { useChat } from "ai/react";

/**
 * Streams token-by-token from /api/ai/coach, which is now backed by Groq
 * instead of OpenAI (see lib/services/ai.service.ts). No client-side change
 * was needed for this swap — useChat just consumes a data stream.
 */
export function CoachChatWidget() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/ai/coach",
  });

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask your AI coach anything about your habit, streak, or hive.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-lg bg-amber-500 px-3 py-2 text-sm text-white"
                : "mr-auto max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800"
            }
          >
            {m.content}
          </div>
        ))}
        {isLoading && <p className="text-xs text-slate-400">Coach is typing…</p>}
        {error && <p className="text-xs text-red-500">{error.message}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask your coach…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
