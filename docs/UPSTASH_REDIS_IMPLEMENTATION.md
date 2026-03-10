# Upstash Redis implementation plan

You have added Upstash Redis env vars in `.env.local`:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Upstash uses a **REST/HTTP** client (`@upstash/redis`), not a persistent TCP connection like `ioredis`. It is ideal for serverless (Next.js API routes) because it is connectionless.

---

## Upstash Redis API (from official docs)

| Operation | Current store (ioredis) | Upstash Redis |
|-----------|-------------------------|---------------|
| **Init** | `new Redis(REDIS_URL)` (TCP) | `new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN })` |
| **GET** | `client.get(key)` → string \| null | `redis.get(key)` → string \| null (same) |
| **SET with TTL** | `client.set(key, value, "EX", seconds)` | `redis.set(key, value, { ex: seconds })` |
| **SADD** | `client.sadd(key, member)` | `redis.sadd(key, member)` (same) |
| **SMEMBERS** | `client.smembers(key)` → string[] | `redis.smembers(key)` → string[] (same) |

- **TTL:** Use `{ ex: 7 * 24 * 60 * 60 }` for 7 days (same as current store).
- **No connection pool:** Create one `Redis` instance (lazily or at top level); no async connection step.
- **Optional:** Disable telemetry with `UPSTASH_DISABLE_TELEMETRY=1` or `{ enableTelemetry: false }` in the constructor.

---

## Implementation steps

### 1. Add dependency

```bash
npm install @upstash/redis
```

Optionally remove `ioredis` once Upstash is working (recommended: Upstash + in-memory only to simplify).

### 2. Refactor `src/lib/conversation-store.ts`

- **Prefer Upstash when** both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
- **Client:** Create a singleton Upstash client. Because Next.js reads env at runtime, use a lazy getter so the client is created when first needed:
  - Example: `function getUpstash(): Redis | null { if (!upstashClient && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) { upstashClient = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }); } return upstashClient; }`
- **getConversation(conversationId):** If Upstash client exists, `const raw = await redis.get(KEY_PREFIX + conversationId)`. If `raw` is truthy, return `deserialize(raw)`; else return null. If no Upstash, use `memoryStore.get(conversationId) ?? null`.
- **setConversation(conversationId, messages, meta):** Build `record` as today. If Upstash exists: `await redis.set(KEY_PREFIX + conversationId, serialize(record), { ex: 60 * 60 * 24 * 7 })`, then `await redis.sadd(KEY_IDS, conversationId)`. Else `memoryStore.set(conversationId, record)`.
- **listConversations():** If Upstash exists: `const ids = await redis.smembers(KEY_IDS)` (string[]). For each id, `const raw = await redis.get(KEY_PREFIX + id)`; if raw, deserialize and push to array. Sort by timestamp desc, return `out.slice(0, 50)`. Else use existing memoryStore logic.
- **Fallback:** If Upstash env vars are missing, use in-memory Map only. Remove ioredis and REDIS_URL usage (or keep as optional secondary fallback).

### 3. Env and types

- **.env.example:** Add:
  ```
  # Upstash Redis (optional; for conversation persistence)
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```
  Do **not** commit real token; it stays in `.env.local`.
- API routes are server-side; `process.env.UPSTASH_REDIS_REST_*` will be available.

### 4. Edge cases

- **Upstash get:** Returns `null` when key does not exist (same as ioredis).
- **smembers:** Returns `[]` when set is empty. When iterating ids, skip if `get` returns null (e.g. key expired).
- **sadd:** Adding same member again is idempotent (set semantics).
- **Stale IDs:** If a key expires (after 7 days), its id remains in `conversation:ids`; listConversations already skips missing keys. Optional cleanup can be added later.

### 5. No code changes elsewhere

Public API of conversation-store (`getConversation`, `setConversation`, `listConversations`, `generateConversationId`) is unchanged; only the backing implementation switches to Upstash when env is set.

---

## Summary

- Use **@upstash/redis** with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from `.env.local`.
- Replace ioredis usage in conversation-store with Upstash REST client; keep in-memory fallback when Upstash is not configured.
- Same keys and semantics: `conversation:{id}` (string, 7-day TTL), `conversation:ids` (set of ids). No migration of existing data needed if this is a fresh Upstash instance.
