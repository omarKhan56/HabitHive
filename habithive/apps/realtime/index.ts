import { createServer } from "http";
import { Server } from "socket.io";
import { decode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import { attachRedisAdapter, subscribeToBackendEvents } from "./redisAdapter";
import { registerChatHandlers } from "./handlers/chat";
import { registerPresenceHandlers } from "./handlers/presence";

const PORT = process.env.PORT ?? 4000;
const db = new PrismaClient();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" },
});

/**
 * Auth: client sends the NextAuth session JWT during the handshake (sec 2.6).
 *
 * NextAuth's JWT session strategy stores an ENCRYPTED token (JWE, via the
 * `jose` library) — not a plain HMAC-signed JWT — so it must be decoded with
 * next-auth/jwt's own `decode()` (same secret as NEXTAUTH_SECRET in the web
 * app), not the generic `jsonwebtoken` package.
 */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("UNAUTHORIZED"));

    const payload = (await decode({ token, secret: process.env.NEXTAUTH_SECRET! })) as
      | { id?: string }
      | null;
    if (!payload?.id) return next(new Error("UNAUTHORIZED"));

    socket.data.userId = payload.id as string;
    next();
  } catch {
    next(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  console.log(`[realtime] connected: ${socket.id} (user ${userId})`);

  registerChatHandlers(io, socket, db);
  registerPresenceHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`[realtime] disconnected: ${socket.id}`);
  });
});

async function main() {
  // Rooms are namespaced per hive: hive:{hiveId}. Redis adapter lets
  // multiple instances of this service share rooms/presence state.
  await attachRedisAdapter(io);

  // Relay events pushed from the Next.js backend / worker (check-ins,
  // dissolutions, hive formation) into the relevant hive room.
  await subscribeToBackendEvents(io);

  httpServer.listen(PORT, () => {
    console.log(`[realtime] listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("[realtime] fatal startup error", err);
  process.exit(1);
});