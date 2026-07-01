import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckIn, getCheckInHistory } from "@/lib/services/checkin.service";
import { CreateCheckInSchema } from "@habithive/shared/schemas";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = CreateCheckInSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error.flatten()), { status: 400 });
  }

  try {
    const checkIn = await createCheckIn((session.user as any).id, parsed.data);
    return Response.json(checkIn, { status: 201 });
  } catch (err: any) {
    if (err.message === "ALREADY_CHECKED_IN_TODAY") {
      return new Response("You already checked in today.", { status: 409 });
    }
    console.error("[checkins] error", err);
    return new Response("Something went wrong.", { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const hiveId = new URL(req.url).searchParams.get("hiveId");
  if (!hiveId) return new Response("hiveId query param required", { status: 400 });

  const history = await getCheckInHistory((session.user as any).id, hiveId);
  return Response.json(history);
}
