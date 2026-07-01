"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useSocketStore } from "@/store/useSocketStore";

export interface ChatMessage {
  id: string;
  hiveId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface UseChatResult {
  messages: ChatMessage[];
  send: (body: string) => void;
  connected: boolean;
  typingUserIds: string[];
  startTyping: () => void;
  stopTyping: () => void;
}

/**
 * Manages the Socket.io connection for a specific hive chat room.
 * Connects on mount, joins the hive room, listens for message:new and
 * presence:update events, and disconnects on unmount.
 * Wired to the realtime service (apps/realtime/handlers/chat.ts).
 */
export function useChat(hiveId: string): UseChatResult {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const { setSocket, setConnected, setPresence, clearSocket, connected } =
    useSocketStore();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const token = (session as any)?.accessToken ?? "";
    const socket = getSocket(token);
    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("hive:join" as any, hiveId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (msg) => {
      if (msg.hiveId !== hiveId) return;
      setMessages((prev) => {
        // Deduplicate by id in case of re-delivery
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("presence:update", ({ userId, online }) => {
      setPresence(userId, online);
      // Remove from typing list when they go offline
      if (!online) {
        setTypingUserIds((prev) => prev.filter((id) => id !== userId));
      }
    });

    // Typing indicators — not part of the shared socket type since they're
    // handled as custom presence signals; cast as any to keep schemas clean.
    (socket as any).on(
      "typing:update",
      ({ userId, typing }: { userId: string; typing: boolean }) => {
        setTypingUserIds((prev) =>
          typing ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)
        );
      }
    );

    return () => {
      socket.emit("hive:leave" as any, hiveId);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message:new");
      socket.off("presence:update");
      (socket as any).off("typing:update");
      clearSocket();
      disconnectSocket();
    };
  }, [hiveId, session]);

  function send(body: string) {
    const { socket } = useSocketStore.getState();
    if (!socket || !body.trim()) return;
    socket.emit("message:send", { hiveId, body: body.trim() });
  }

  function startTyping() {
    const { socket } = useSocketStore.getState();
    if (!socket) return;
    socket.emit("typing:start", { hiveId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 3000);
  }

  function stopTyping() {
    const { socket } = useSocketStore.getState();
    if (!socket) return;
    socket.emit("typing:stop", { hiveId });
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }

  return { messages, send, connected, typingUserIds, startTyping, stopTyping };
}