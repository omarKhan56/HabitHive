import { Navbar } from "@/components/ui/Navbar";

/**
 * Wraps every page inside (dashboard) — dashboard, hive, checkin,
 * analytics, coach — with the shared navigation bar.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pb-16 md:pb-0">{children}</div>
    </div>
  );
}