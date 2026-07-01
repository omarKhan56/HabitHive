import { Server, Socket } from "socket.io";
import type { PrismaClient } from "@prisma/client";
import { SendMessageSchema } from "@habithive/shared/schemas";

export function registerChatHandlers(io: Server, socket: Socket, db: PrismaClient) {
  const userId = socket.data.userId as string;

  // Joins a room per hiveId on mount of the Hive/Chat page (sec 1.5).
  socket.on("hive:join", async (hiveId: string) => {
    const membership = await db.hiveMember.findFirst({ where: { hiveId, userId } });
    if (!membership) return; // not a member, ignore

    socket.join(`hive:${hiveId}`);
    socket.join(`user:${userId}`);
  });

  socket.on("hive:leave", (hiveId: string) => {
    socket.leave(`hive:${hiveId}`);
  });

  // message:send -> persists to Postgres -> broadcasts message:new (sec 2.6).
  socket.on("message:send", async (payload) => {
    const parsed = SendMessageSchema.safeParse(payload);
    if (!parsed.success) return;

    const membership = await db.hiveMember.findFirst({
      where: { hiveId: parsed.data.hiveId, userId },
    });
    if (!membership) return;

    const message = await db.message.create({
      data: {
        hiveId: parsed.data.hiveId,
        userId,
        body: parsed.data.body,
      },
    });

    io.to(`hive:${parsed.data.hiveId}`).emit("message:new", {
      id: message.id,
      hiveId: message.hiveId,
      userId: message.userId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    });
  });

  socket.on("typing:start", ({ hiveId }: { hiveId: string }) => {
    socket.to(`hive:${hiveId}`).emit("presence:update", { hiveId, userId, online: true });
  });

  socket.on("typing:stop", ({ hiveId }: { hiveId: string }) => {
    socket.to(`hive:${hiveId}`).emit("presence:update", { hiveId, userId, online: true });
  });
}
