"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useHive } from "@/hooks/useHive";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Spinner, EmptyState } from "@/components/ui";
import { Users2 } from "lucide-react";

export default function ChatPage() {
  const { hive, isLoading, isError } = useHive();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Spinner label="Loading chat…" />
      </main>
    );
  }

  if (isError || !hive) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Couldn&#x2019;t load this chat.
        </p>
      </main>
    );
  }

  if (hive.status !== "active") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={Users2}
          title="This hive is no longer active"
          description="Chat is only available for active hives."
          className="rounded-xl border border-slate-200 bg-white"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href={`/hive/${hive.id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hive
        </Link>
      </div>

      <div className="min-h-0 flex-1">
        <ChatWindow hiveId={hive.id} members={hive.members} />
      </div>
    </main>
  );
}