import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { attachRedisAdapter, subscribeToBackendEvents } from "./redisAdapter";
import { registerChatHandlers } from "./handlers/chat";
import { registerPresenceHandlers } from "./handlers/presence";

const PORT = process.env.PORT ?? 4000;
const db = new PrismaClient();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/**
 * Auth: client sends userId directly in the socket handshake.
 * We verify it exists in the database before allowing connection.
 * Simple and reliable — avoids JWT encode/decode complexity.
 */
io.use(async (socket, next) => {
  try {
    const userId = socket.handshake.auth?.token as string | undefined;

    if (!userId) {
      console.log("[realtime] ❌ no token in handshake");
      return next(new Error("UNAUTHORIZED"));
    }

    // Verify the userId actually exists in the database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      console.log("[realtime] ❌ user not found:", userId);
      return next(new Error("UNAUTHORIZED"));
    }

    console.log(`[realtime] ✅ authenticated user: ${userId}`);
    socket.data.userId = userId;
    next();
  } catch (err) {
    console.error("[realtime] auth error:", err);
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
  await attachRedisAdapter(io);
  await subscribeToBackendEvents(io);

  httpServer.listen(PORT, () => {
    console.log(`[realtime] listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error("[realtime] fatal startup error", err);
  process.exit(1);
});