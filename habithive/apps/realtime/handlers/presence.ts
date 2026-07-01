import { Server, Socket } from "socket.io";

const HEARTBEAT_TIMEOUT_MS = 45_000;

/**
 * Presence is driven by a heartbeat/ping pattern (sec 1.5): the client pings
 * periodically; if no ping arrives within the timeout, we mark the user
 * offline in every hive room they're connected to.
 */
export function registerPresenceHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;
  let timeout: NodeJS.Timeout;

  const broadcastOnline = (online: boolean) => {
    for (const room of socket.rooms) {
      if (room.startsWith("hive:")) {
        const hiveId = room.replace("hive:", "");
        io.to(room).emit("presence:update", { hiveId, userId, online });
      }
    }
  };

  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => broadcastOnline(false), HEARTBEAT_TIMEOUT_MS);
  };

  socket.on("connect", () => {
    broadcastOnline(true);
    resetTimeout();
  });

  socket.on("presence:ping", () => {
    broadcastOnline(true);
    resetTimeout();
  });

  socket.on("disconnect", () => {
    clearTimeout(timeout);
    broadcastOnline(false);
  });

  resetTimeout();
}
