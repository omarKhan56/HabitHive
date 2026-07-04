"use client";

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@habithive/shared/schemas";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;
let currentToken: string | null = null;

/**
 * Returns the existing socket if the token hasn't changed,
 * otherwise creates a new one. This prevents the race condition
 * caused by Fast Refresh disconnecting and immediately reconnecting.
 */
export function getSocket(token: string): AppSocket {
  // Reuse existing connected socket if token is the same
  if (socket && currentToken === token && socket.connected) {
    return socket;
  }

  // Clean up old socket if token changed or socket is dead
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(
    process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000",
    {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    }
  ) as AppSocket;

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

export function getExistingSocket(): AppSocket | null {
  return socket;
}