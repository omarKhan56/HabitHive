import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const HABIT_LABELS: Record<string, string> = {
  gym: "Gym",
  wake_up_early: "Wake Up Early",
  reading: "Reading",
  coding: "Coding",
  meditation: "Meditation",
};

const HABIT_EMOJIS: Record<string, string> = {
  gym: "🏋️",
  wake_up_early: "🌅",
  reading: "📚",
  coding: "💻",
  meditation: "🧘",
};

async function getHiveCardData(hiveId: string) {
  const hive = await db.hive.findUnique({
    where: { id: hiveId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      checkIns: {
        where: {
          date: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  if (!hive) return null;

  const memberCount = hive.members.length || 1;
  const daysSinceStart = Math.max(
    1,
    Math.floor(
      (Date.now() - hive.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const maxPossible = memberCount * 14;
  const completionRate =
    maxPossible === 0
      ? 0
      : Math.round((hive.checkIns.length / maxPossible) * 100);

  return {
    memberNames: hive.members.map((m) => m.user.name.split(" ")[0]),
    daysSinceStart,
    completionRate,
    habitLabel: HABIT_LABELS[hive.habit] ?? hive.habit,
    habitEmoji: HABIT_EMOJIS[hive.habit] ?? "🐝",
  };
}

export default async function HiveCardPage({
  params,
  searchParams,
}: {
  params: { hiveId: string };
  searchParams: { token?: string };
}) {
  const expectedToken =
    process.env.INTERNAL_SCREENSHOT_TOKEN ?? "habithive-internal";
  if (searchParams.token !== expectedToken) return notFound();

  const data = await getHiveCardData(params.hiveId);
  if (!data) return notFound();

  const { habitLabel, habitEmoji, daysSinceStart, completionRate, memberNames } =
    data;

  const filled = Math.round(completionRate / 5);
  const empty = 20 - filled;

  return (
    <div
      style={{
        width: 600,
        height: 340,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 220, height: 220, borderRadius: "50%",
        background: "rgba(245, 158, 11, 0.08)",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "rgba(245, 158, 11, 0.05)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>🐝</span>
            <span style={{ color: "#f59e0b", fontSize: 14, fontWeight: 600, letterSpacing: 2 }}>
              HABITHIVE
            </span>
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
            The Morning {habitLabel}s
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, marginTop: 4, marginBottom: 0 }}>
            {habitEmoji} {habitLabel} • {daysSinceStart} Days Active
          </p>
        </div>

        {/* Day badge */}
        <div style={{
          background: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: 12, padding: "8px 16px", textAlign: "center",
        }}>
          <div style={{ color: "#f59e0b", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
            {daysSinceStart}
          </div>
          <div style={{ color: "#f59e0b", fontSize: 11, letterSpacing: 1, marginTop: 2 }}>
            DAYS
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ color: "#94a3b8", fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>
          COMPLETION RATE
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 24, letterSpacing: 1 }}>
          <span style={{ color: "#f59e0b" }}>{"█".repeat(filled)}</span>
          <span style={{ color: "#374151" }}>{"░".repeat(empty)}</span>
          <span style={{ color: "#f59e0b", fontFamily: "system-ui", fontSize: 20, marginLeft: 10 }}>
            {completionRate}%
          </span>
        </div>
      </div>

      {/* Members */}
      <div>
        <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>
          MEMBERS
        </div>
        <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 500 }}>
          👥 {memberNames.join(" • ")}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          borderLeft: "3px solid #f59e0b",
          borderRadius: "0 6px 6px 0",
          padding: "8px 14px", maxWidth: 340,
        }}>
          <p style={{ color: "#cbd5e1", fontSize: 13, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>
            &ldquo;Small progress every day compounds.&rdquo;
          </p>
          <p style={{ color: "#64748b", fontSize: 11, marginTop: 4, marginBottom: 0 }}>
            — AI Motto
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600, margin: 0 }}>
            Join us
          </p>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
            habithive.app
          </p>
        </div>
      </div>
    </div>
  );
}