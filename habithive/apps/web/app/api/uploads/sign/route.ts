import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSignedUploadParams } from "@/lib/services/upload.service";
 
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
 
  const userId = (session.user as any).id as string;
 
  try {
    // Scope each user's uploads to their own folder for easy moderation/cleanup.
    const params = createSignedUploadParams(`habithive/checkins/${userId}`);
    return Response.json(params);
  } catch (err: any) {
    if (err.message === "CLOUDINARY_NOT_CONFIGURED") {
      return new Response("Photo uploads are not configured on this server.", { status: 503 });
    }
    console.error("[uploads/sign] error", err);
    return new Response("Could not create upload signature.", { status: 500 });
  }
}
 