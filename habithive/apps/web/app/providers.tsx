"use client";
 
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 
/**
 * Wraps the app with:
 * - NextAuth's SessionProvider — required for useSession()/signIn()/signOut()
 *   to work in any client component (dashboard, hive, chat, coach, admin...).
 * - React Query's QueryClientProvider — required for useHive, useCheckIns,
 *   useAnalytics, useAICoach (sec 1.3: "Server state ... React Query").
 *
 * One QueryClient instance per browser session (useState lazy-init avoids
 * recreating it on every render).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
 
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}