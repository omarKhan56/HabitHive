# HabitHive AI

Accountability "hive" app — Next.js + PostgreSQL + Redis + Socket.io + Groq (LLM).

This implements the architecture from `HabitHiveAI_Architecture.docx`, with **one
deliberate change**: every LLM call uses **Groq** instead of OpenAI.

> Groq's API is OpenAI-compatible, so the swap is just a different SDK
> (`groq-sdk`) + base URL + model name. Prompts, streaming, and the rest of the
> app are unaffected.

## Monorepo layout

```
apps/
  web/        Next.js app — frontend + Route Handlers (API) + Server Actions
  realtime/   Standalone Node + Socket.io service (chat, presence)
  worker/     Node + BullMQ background jobs (dissolution, rematch, AI summaries)
packages/
  shared/     zod schemas & types shared across all three apps
```

## Services

| Service | Port | Responsibility |
|---|---|---|
| `web` | 3000 | Pages, REST-style Route Handlers, AI endpoints (Groq) |
| `realtime` | 4000 | Socket.io chat/presence, Redis adapter |
| `worker` | n/a | BullMQ cron jobs (dissolution, rematch, weekly AI summary, reminders) |
| `postgres` | 5432 | Single relational store |
| `redis` | 6379 | Cache, pub/sub, BullMQ, rate limiting |

## Environment variables

Copy `.env.example` to `.env` in `apps/web`, `apps/realtime`, and `apps/worker`
and fill in real values. The key one for the AI swap:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

Get a key at https://console.groq.com/keys

## Running locally

```bash
docker compose up --build
```

This brings up Postgres, Redis, the Next.js web app, the realtime service, and
the worker, wired together exactly as described in section 2.1 of the
architecture doc.

## Where the AI calls live

All LLM calls are server-side only, in `apps/web/lib/services/ai.service.ts`,
called from:
- `app/api/ai/coach/route.ts` — streaming coach chat
- `app/api/ai/weekly-summary/route.ts` — on-demand summary fetch
- `apps/worker/jobs/weeklySummary.job.ts` — scheduled summary generation

The API key never reaches the client.
