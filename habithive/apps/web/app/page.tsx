import { redirect } from "next/navigation";

/**
 * Root route — redirects authenticated users to /dashboard,
 * unauthenticated users to /login (middleware handles the auth gate).
 */
export default function RootPage() {
  redirect("/dashboard");
}