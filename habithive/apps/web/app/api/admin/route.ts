import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Admin-only endpoint: returns users, hives, and audit logs for the
 * admin panel. Gated by the middleware (role === "admin") AND double-checked
 * here server-side so the route is safe even if middleware is bypassed.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if ((session.user as any).role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const [users, hives, auditLogs] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        habit: true,
        currentHiveId: true,
        createdAt: true,
      },
    }),
    db.hive.findMany({
      orderBy: { startedAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  return Response.json({
    users,
    hives: hives.map((h) => ({
      id: h.id,
      habit: h.habit,
      status: h.status,
      compatibilityScore: h.compatibilityScore,
      memberCount: h._count.members,
      startedAt: h.startedAt,
      dissolvedAt: h.dissolvedAt,
      dissolutionReason: h.dissolutionReason,
    })),
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      userId: l.actorId,
      userName: l.actor.name,
      action: l.action,
      metadata: l.metadata as Record<string, unknown>,
      createdAt: l.createdAt,
    })),
  });
}