import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const role = (req.nextauth.token as any)?.role;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/hive/:path*",
    "/checkin/:path*",
    "/analytics/:path*",
    "/coach/:path*",
    "/admin/:path*",
    // NOTE: /internal is intentionally excluded — accessed by Puppeteer only
  ],
};