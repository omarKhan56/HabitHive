import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

/** Socket.io Redis adapter — lets multiple realtime instances share rooms/presence. */
export async function attachRedisAdapter(io: Server) {
  const pubClient = new Redis(REDIS_URL);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
}

/**
 * The Next.js backend and worker push check-in / dissolution / hive-formation
 * events into Redis pub/sub channels. This subscribes and relays each event
 * into the matching hive room (sec 2.6).
 */
export async function subscribeToBackendEvents(io: Server) {
  const sub = new Redis(REDIS_URL);

  await sub.subscribe("checkin:events", "hive:events", "notification:events");

  sub.on("message", (channel, raw) => {
    try {
      const event = JSON.parse(raw);

      switch (channel) {
        case "checkin:events":
          io.to(`hive:${event.hiveId}`).emit("checkin:update", {
            hiveId: event.hiveId,
            userId: event.userId,
            date: event.date,
          });
          break;

        case "hive:events":
          if (event.type === "hive:dissolved") {
            io.to(`hive:${event.hiveId}`).emit("hive:dissolved", {
              hiveId: event.hiveId,
              reason: event.reason,
            });
          }
          break;

        case "notification:events":
          io.to(`user:${event.userId}`).emit("notification:new", event.notification);
          break;
      }
    } catch (err) {
      console.error("[realtime] failed to relay event", channel, err);
    }
  });
}
