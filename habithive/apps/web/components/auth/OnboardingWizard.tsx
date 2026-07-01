"use client";

import { useState } from "react";
import {
  HABIT_OPTIONS,
  COMMON_TIMEZONES,
  LANGUAGE_OPTIONS,
  detectBrowserTimezone,
} from "@/lib/validators";
import { Input, Select, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface OnboardingData {
  habit: string;
  timezone: string;
  language: string;
  preferredCheckinTime: string; // "HH:MM"
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onBack?: () => void;
  submitting?: boolean;
}

const STEPS = ["habit", "schedule", "review"] as const;
type Step = (typeof STEPS)[number];

/**
 * Collects habit, timezone, language, and preferred check-in time — the
 * fields the Auth Service's onboarding flow writes to `users` before
 * enqueueing the user into the matching pool (sec 2.4).
 */
export function OnboardingWizard({ onComplete, onBack, submitting }: OnboardingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    habit: "",
    timezone: detectBrowserTimezone(),
    language: "en",
    preferredCheckinTime: "07:00",
  });

  const step: Step = STEPS[stepIndex];

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => {
    if (stepIndex === 0) {
      onBack?.();
    } else {
      setStepIndex((i) => i - 1);
    }
  };

  const canProceedFromHabit = data.habit.length > 0;

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Progress indicator */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-amber-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {step === "habit" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Which habit are you building?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {HABIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setData((d) => ({ ...d, habit: opt.value }))}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                  data.habit === opt.value
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="font-medium text-slate-700">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "schedule" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            When do you usually check in?
          </h2>

          <Input
            label="Preferred check-in time"
            type="time"
            value={data.preferredCheckinTime}
            onChange={(e) =>
              setData((d) => ({ ...d, preferredCheckinTime: e.target.value }))
            }
          />

          <Select
            label="Timezone"
            value={data.timezone}
            onChange={(e) => setData((d) => ({ ...d, timezone: e.target.value }))}
          >
            {!COMMON_TIMEZONES.includes(data.timezone) && (
              <option value={data.timezone}>{data.timezone} (detected)</option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>

          <Select
            label="Language"
            value={data.language}
            onChange={(e) => setData((d) => ({ ...d, language: e.target.value }))}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Looks good?</h2>
          <ul className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
            <li>
              <span className="font-medium text-slate-800">Habit:</span>{" "}
              {HABIT_OPTIONS.find((h) => h.value === data.habit)?.label}
            </li>
            <li>
              <span className="font-medium text-slate-800">Check-in time:</span>{" "}
              {data.preferredCheckinTime}
            </li>
            <li>
              <span className="font-medium text-slate-800">Timezone:</span> {data.timezone}
            </li>
            <li>
              <span className="font-medium text-slate-800">Language:</span>{" "}
              {LANGUAGE_OPTIONS.find((l) => l.value === data.language)?.label}
            </li>
          </ul>
          <p className="text-xs text-slate-400">
            We&#x2019;ll match you with up to 4 other people building the same habit.
          </p>
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack}>
          Back
        </Button>

        {step !== "review" ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={step === "habit" && !canProceedFromHabit}
          >
            Continue
          </Button>
        ) : (
          <Button type="button" loading={submitting} onClick={() => onComplete(data)}>
            {submitting ? "Creating account…" : "Join HabitHive"}
          </Button>
        )}
      </div>
    </div>
  );
}