"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket";
import { useSocketStore } from "@/store/useSocketStore";
import { getMessageHistory } from "@/lib/api-client";

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

export function useChat(hiveId: string): UseChatResult {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const { setSocket, setConnected, setPresence, connected } =
    useSocketStore();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const hiveIdRef = useRef(hiveId);
  hiveIdRef.current = hiveId;

  // Load message history from DB when the chat page opens
  useEffect(() => {
    if (status !== "authenticated") return;

    getMessageHistory(hiveId)
      .then((history) => {
        console.log(`[chat] loaded ${history.length} historical messages`);
        setMessages(history);
      })
      .catch((err) => {
        console.error("[chat] failed to load message history:", err);
      });
  }, [hiveId, status]);

  // Set up real-time socket connection
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const token = (session as any)?.accessToken as string ?? "";

    if (!token) {
      console.error("[chat] No accessToken in session");
      return;
    }

    console.log("[chat] initializing socket, token length:", token.length);

    const socket = getSocket(token);
    setSocket(socket);

    function onConnect() {
      console.log("[chat] ✅ connected to realtime service");
      setConnected(true);
      socket.emit("hive:join" as any, hiveIdRef.current);
    }

    function onDisconnect(reason: string) {
      console.log("[chat] disconnected:", reason);
      setConnected(false);
    }

    function onConnectError(err: Error) {
      console.error("[chat] ❌ connection error:", err.message);
      setConnected(false);
    }

    function onMessageNew(msg: {
      id: string;
      hiveId: string;
      userId: string;
      body: string;
      createdAt: string;
    }) {
      if (msg.hiveId !== hiveIdRef.current) return;
      setMessages((prev) => {
        // Deduplicate — message might already be in history
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }

    function onPresenceUpdate({
      userId,
      online,
    }: {
      hiveId: string;
      userId: string;
      online: boolean;
    }) {
      setPresence(userId, online);
      if (!online) {
        setTypingUserIds((prev) => prev.filter((id) => id !== userId));
      }
    }

    function onTypingUpdate({
      userId,
      typing,
    }: {
      userId: string;
      typing: boolean;
    }) {
      setTypingUserIds((prev) =>
        typing
          ? [...new Set([...prev, userId])]
          : prev.filter((id) => id !== userId)
      );
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("message:new", onMessageNew);
    socket.on("presence:update", onPresenceUpdate);
    (socket as any).on("typing:update", onTypingUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("message:new", onMessageNew);
      socket.off("presence:update", onPresenceUpdate);
      (socket as any).off("typing:update", onTypingUpdate);
    };
  }, [hiveId, session, status]);

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