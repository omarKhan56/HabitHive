import type { CreateCheckInInput } from "@habithive/shared/schemas";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(text || res.statusText, res.status);
  }

  // 204 / empty body safety
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/* ----------------------------- Hives ----------------------------- */

export interface HiveMemberDTO {
  user: { id: string; name: string };
  missCount: number;
}

export interface HiveDTO {
  id: string;
  status: "active" | "dissolved";
  habit: string;
  compatibilityScore: number;
  startedAt: string;
  members: HiveMemberDTO[];
}

export interface HiveHealthDTO {
  score: number;
  breakdown: { completionRate: number; missHealth: number; engagement: number } | null;
}

export function getMyHive() {
  return request<{ hive: HiveDTO | null; health?: HiveHealthDTO }>("/api/hives");
}

/* ----------------------------- Check-ins ----------------------------- */

export interface CheckInDTO {
  id: string;
  userId: string;
  hiveId: string;
  date: string;
  text: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export function createCheckIn(input: CreateCheckInInput) {
  return request<CheckInDTO>("/api/checkins", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCheckInHistory(hiveId: string) {
  return request<CheckInDTO[]>(`/api/checkins?hiveId=${encodeURIComponent(hiveId)}`);
}

/* ----------------------------- AI ----------------------------- */

export interface AiInsightDTO {
  id: string;
  userId: string;
  type: "weekly_summary" | "suggestion" | "risk_score";
  content: string;
  riskScore: number | null;
  createdAt: string;
}

export function getWeeklySummary() {
  return request<AiInsightDTO>("/api/ai/weekly-summary");
}

export { ApiError };
