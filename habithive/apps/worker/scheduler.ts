//habithive/apps/worker/scheduler.ts
import { Queue, Worker } from "bullmq";
import { dissolveHivesJob } from "./jobs/dissolveHives.job";
import { rematchJob } from "./jobs/rematch.job";
import { weeklySummaryJob } from "./jobs/weeklySummary.job";
import { sendRemindersJob } from "./jobs/sendReminders.job";
import { analyticsRollupJob } from "./jobs/analyticsRollup.job";

/**
 * BullMQ bundles its own copy of ioredis internally. Passing it a plain
 * connection-options object (rather than an externally-constructed ioredis
 * instance) avoids a type collision between this package's ioredis and
 * BullMQ's nested one, and is also BullMQ's documented recommended usage.
 */
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: REDIS_URL, maxRetriesPerRequest: null as null };

const QUEUE_NAME = "habithive-cron";
export const queue = new Queue(QUEUE_NAME, { connection });

/**
 * Registers BullMQ's repeatable jobs (Redis-backed) instead of a single
 * in-process node-cron, so this worker can scale to multiple instances
 * without duplicate job execution (sec 2.5).
 */
async function registerSchedules() {
  await queue.add(
    "dissolveHives",
    {},
    { repeat: { pattern: "5 0 * * *" } } // daily 00:05
  );
  await queue.add(
    "sendReminders",
    {},
    { repeat: { pattern: "0 * * * *" } } // hourly sweep
  );
  await queue.add(
    "weeklySummary",
    {},
    { repeat: { pattern: "0 23 * * 0" } } // Sunday 23:00
  );
  await queue.add(
    "analyticsRollup",
    {},
    { repeat: { pattern: "30 0 * * *" } } // daily 00:30
  );
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[worker] running job: ${job.name} (#${job.id})`);
    switch (job.name) {
      case "dissolveHives":
        return dissolveHivesJob();
      case "rematch":
        return rematchJob(job.data);
      case "weeklySummary":
        return weeklySummaryJob();
      case "sendReminders":
        return sendRemindersJob();
      case "analyticsRollup":
        return analyticsRollupJob();
      default:
        console.warn(`[worker] unknown job: ${job.name}`);
    }
  },
  { connection, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`[worker] completed: ${job.name} (#${job.id})`));
worker.on("failed", (job, err) => console.error(`[worker] failed: ${job?.name}`, err));

registerSchedules()
  .then(() => console.log("[worker] schedules registered, listening for jobs…"))
  .catch((err) => {
    console.error("[worker] failed to register schedules", err);
    process.exit(1);
  });