# OpenAI → Groq: what changed

Your architecture doc called for the **OpenAI API** in three places. All three
now call **Groq** instead. Nothing else in the architecture changed.

## 1. Dependencies

```diff
- "openai": "^4.x"
+ "@ai-sdk/groq": "^0.0.3"
+ "ai": "^3.4.0"
```

Groq exposes an **OpenAI-compatible** REST API, so the Vercel AI SDK ships an
official Groq provider that plugs into the same `streamText` / `generateText`
functions used for OpenAI. Streaming, `useChat()` on the frontend, and prompt
formatting are all unchanged.

## 2. The actual code change

`apps/web/lib/services/ai.service.ts` (and the worker's
`weeklySummary.job.ts`) now do:

```ts
import { groq } from "@ai-sdk/groq";

const MODEL_ID = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const result = streamText({ model: groq(MODEL_ID), ... });
```

instead of:

```ts
import { openai } from "@ai-sdk/openai";
const result = streamText({ model: openai("gpt-4o-mini"), ... });
```

## 3. Environment variables

```diff
- OPENAI_API_KEY=sk-...
+ GROQ_API_KEY=gsk_...
+ GROQ_MODEL=llama-3.3-70b-versatile
```

Get a key: https://console.groq.com/keys

## 4. Model choice

Groq doesn't host GPT models — pick a model they serve. Good defaults:

| Use case | Model |
|---|---|
| Best quality (coach chat, summaries) | `llama-3.3-70b-versatile` |
| Fastest / cheapest (high-volume nudges) | `llama-3.1-8b-instant` |
| Open-weight GPT-style option | `openai/gpt-oss-120b` (hosted by Groq) |

Check https://console.groq.com/docs/models for the current list — Groq adds
new hosted models periodically.

## 5. Everything that did NOT change

- Prompt content & system prompts
- Streaming behavior / `useChat` on the frontend
- Rate limiting / daily cap logic (Redis-backed)
- The deterministic risk-scoring math (the LLM only *phrases* the suggestion)
- Database schema, Socket.io, BullMQ jobs, auth, matching algorithm
