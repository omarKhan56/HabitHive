"use client";

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@habithive/shared/schemas";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/** Initializes (once per session) and returns the shared Socket.io client. */
export function getSocket(sessionToken: string) {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000", {
    auth: { token: sessionToken },
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
