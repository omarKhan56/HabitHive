"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Textarea, Button } from "@/components/ui";
import { PhotoUpload } from "./PhotoUpload";
import { useCheckIns } from "@/hooks/useCheckIns";

export interface CheckInFormProps {
  hiveId: string;
}

/**
 * Submits to POST /api/checkins (checkin.service.ts on the backend), which
 * enforces the one-check-in-per-day unique constraint server-side. This
 * form mirrors that by disabling itself once hasCheckedInToday is true.
 */
export function CheckInForm({ hiveId }: CheckInFormProps) {
  const { submit, isSubmitting, isSubmitSuccess, submitError, hasCheckedInToday } =
    useCheckIns(hiveId);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit({ hiveId, text: text.trim() || undefined, photoUrl: photoUrl ?? undefined });
  }

  if (hasCheckedInToday || isSubmitSuccess) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <CheckCircle2 className="h-5 w-5" />
        You&#x2019;re checked in for today. See you tomorrow!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        label="How did it go today? (optional)"
        placeholder="Hit a new PR on squats today 💪"
        rows={3}
        maxLength={2000}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <Button type="submit" loading={isSubmitting} className="self-start">
        Check in
      </Button>
    </form>
  );
}