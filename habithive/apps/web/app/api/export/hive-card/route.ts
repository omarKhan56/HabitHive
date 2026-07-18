import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id as string;
  const hiveId = new URL(req.url).searchParams.get("hiveId");

  if (!hiveId) {
    return new Response("hiveId required", { status: 400 });
  }

  const membership = await db.hiveMember.findFirst({
    where: { hiveId, userId },
  });
  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  let browser = null;

  try {
    const executablePath =
      process.env.NODE_ENV === "production"
        ? await chromium.executablePath()
        : process.env.CHROME_PATH ??
          (process.platform === "win32"
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : "/usr/bin/google-chrome");

    browser = await puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      defaultViewport: { width: 600, height: 340 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 340, deviceScaleFactor: 2 });

    // Pass secret token so the internal page allows access
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const token =
      process.env.INTERNAL_SCREENSHOT_TOKEN ?? "habithive-internal";

    await page.goto(
      `${baseUrl}/internal/hive-card/${hiveId}?token=${token}`,
      {
        waitUntil: "networkidle0",
        timeout: 15000,
      }
    );

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 600, height: 340 },
    });

    const buffer = Buffer.from(screenshot);

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="habithive-card.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[hive-card] screenshot error:", err);
    return new Response("Failed to generate card", { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}