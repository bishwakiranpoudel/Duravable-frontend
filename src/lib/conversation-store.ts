/**
 * Conversation store: Upstash Redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, otherwise in-memory.
 * Data is partitioned by client scope (geo + hashed IP) so each visitor group
 * only sees their own conversations. See request-scope.ts.
 */

import { Redis } from "@upstash/redis";
import type { ConversationRecord, ConversationMessage, SelectedDoctorInfo } from "./conversation-types";

const CONVERSATION_NS = "conversation:";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function dataKey(scopeKey: string, conversationId: string): string {
  return `${CONVERSATION_NS}${scopeKey}:${conversationId}`;
}

function idsKey(scopeKey: string): string {
  return `${CONVERSATION_NS}ids:${scopeKey}`;
}

let upstashClient: Redis | null = null;

function getUpstash(): Redis | null {
  if (upstashClient) return upstashClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    upstashClient = new Redis({
      url,
      token,
      automaticDeserialization: false,
    });
    console.log("[conversation-store] Using Upstash Redis");
    return upstashClient;
  }
  console.warn(
    "[conversation-store] Using in-memory store (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in env; restart dev server after changing .env.local)"
  );
  return null;
}

/** scopeKey -> conversationId -> record */
const memoryByScope = new Map<string, Map<string, ConversationRecord>>();

function getMemoryBucket(scopeKey: string): Map<string, ConversationRecord> {
  let m = memoryByScope.get(scopeKey);
  if (!m) {
    m = new Map();
    memoryByScope.set(scopeKey, m);
  }
  return m;
}

type RecordMeta = Partial<
  Pick<
    ConversationRecord,
    | "user_id"
    | "title"
    | "symptoms"
    | "doctor_recommendation"
    | "authorization_status"
    | "payment_status"
    | "selected_doctor"
    | "funds_allocated"
    | "pending_doctor_details"
  >
>;

function toRecord(
  conversationId: string,
  messages: ConversationMessage[],
  meta: RecordMeta = {},
  existing: ConversationRecord | null = null
): ConversationRecord {
  const prev = existing;
  const title =
    meta.title ??
    prev?.title ??
    (messages.find((m) => m.role === "user")?.content?.slice(0, 60) || null);
  return {
    user_id: meta.user_id ?? prev?.user_id ?? null,
    conversation_id: conversationId,
    messages,
    title: title || null,
    symptoms: meta.symptoms ?? prev?.symptoms ?? [],
    doctor_recommendation: meta.doctor_recommendation ?? prev?.doctor_recommendation ?? null,
    authorization_status: meta.authorization_status ?? prev?.authorization_status ?? "none",
    payment_status: meta.payment_status ?? prev?.payment_status ?? "none",
    selected_doctor: meta.selected_doctor !== undefined ? meta.selected_doctor : prev?.selected_doctor ?? null,
    funds_allocated: meta.funds_allocated !== undefined ? meta.funds_allocated : prev?.funds_allocated ?? null,
    pending_doctor_details: meta.pending_doctor_details !== undefined ? meta.pending_doctor_details : prev?.pending_doctor_details ?? false,
    timestamp: prev?.timestamp ?? new Date().toISOString(),
  };
}

function serialize(record: ConversationRecord): string {
  return JSON.stringify({
    ...record,
    messages: record.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })),
  });
}

function deserialize(raw: string | unknown): ConversationRecord | null {
  try {
    const o =
      typeof raw === "string"
        ? (JSON.parse(raw) as Omit<ConversationRecord, "messages"> & {
            messages: Array<Omit<ConversationMessage, "timestamp"> & { timestamp: string }>;
          })
        : (raw as Omit<ConversationRecord, "messages"> & {
            messages: Array<Omit<ConversationMessage, "timestamp"> & { timestamp: string }>;
          });
    const messages: ConversationMessage[] = (o.messages || []).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
    return { ...o, messages };
  } catch {
    return null;
  }
}

export async function getConversation(
  scopeKey: string,
  conversationId: string
): Promise<ConversationRecord | null> {
  const redis = getUpstash();
  if (redis) {
    const raw = await redis.get<string>(dataKey(scopeKey, conversationId));
    if (raw) {
      console.log("[conversation-store] Read from Redis (Upstash)", { scopeKey, conversationId });
      return deserialize(raw);
    }
    return null;
  }
  return getMemoryBucket(scopeKey).get(conversationId) ?? null;
}

export async function setConversation(
  scopeKey: string,
  conversationId: string,
  messages: ConversationMessage[],
  meta?: RecordMeta
): Promise<void> {
  const existing = await getConversation(scopeKey, conversationId);
  const record = toRecord(
    conversationId,
    messages,
    {
      ...(existing && {
        user_id: existing.user_id,
        symptoms: existing.symptoms,
        doctor_recommendation: existing.doctor_recommendation,
        authorization_status: existing.authorization_status,
        payment_status: existing.payment_status,
        selected_doctor: existing.selected_doctor,
        funds_allocated: existing.funds_allocated,
      }),
      ...meta,
    },
    existing
  );
  record.timestamp = new Date().toISOString();

  const redis = getUpstash();
  if (redis) {
    console.log("[conversation-store] Writing to Redis (Upstash)", {
      scopeKey,
      conversationId,
      messageCount: messages.length,
      selected_doctor: record.selected_doctor ?? null,
      funds_allocated: record.funds_allocated ?? null,
    });
    await redis.set(dataKey(scopeKey, conversationId), serialize(record), { ex: TTL_SECONDS });
    await redis.sadd(idsKey(scopeKey), conversationId);
    return;
  }
  console.log("[conversation-store] Writing to in-memory store", { scopeKey, conversationId });
  getMemoryBucket(scopeKey).set(conversationId, record);
}

/** List conversation ids for this scope only (sorted by activity, newest first). */
export async function listConversations(scopeKey: string): Promise<
  Array<{ conversation_id: string; timestamp: string; title: string | null; doctor_recommendation?: string | null }>
> {
  const redis = getUpstash();
  if (redis) {
    let ids: string[] = [];
    try {
      const rawIds = await redis.smembers(idsKey(scopeKey));
      ids = Array.isArray(rawIds) ? rawIds.map((id) => String(id)) : [];
    } catch (e) {
      console.warn("[conversation-store] smembers failed, falling back to keys scan", e);
    }
    const prefix = `${CONVERSATION_NS}${scopeKey}:`;
    if (ids.length === 0) {
      try {
        const keys = await redis.keys(`${prefix}*`);
        const keyList = Array.isArray(keys) ? keys : [];
        for (const key of keyList) {
          if (typeof key !== "string" || !key.startsWith(prefix)) continue;
          const id = key.slice(prefix.length);
          if (id) ids.push(id);
        }
      } catch (e) {
        console.warn("[conversation-store] keys scan failed", e);
      }
    }
    const out: Array<{
      conversation_id: string;
      timestamp: string;
      title: string | null;
      doctor_recommendation?: string | null;
    }> = [];
    for (const id of ids) {
      const raw = await redis.get<string>(dataKey(scopeKey, String(id)));
      if (!raw) continue;
      const r = deserialize(raw);
      if (r)
        out.push({
          conversation_id: r.conversation_id,
          timestamp: r.timestamp ?? new Date().toISOString(),
          title: r.title ?? null,
          doctor_recommendation: r.doctor_recommendation ?? null,
        });
    }
    out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return out.slice(0, 50);
  }
  const bucket = getMemoryBucket(scopeKey);
  const out = Array.from(bucket.entries()).map(([id, r]) => ({
    conversation_id: id,
    timestamp: r.timestamp,
    title: r.title ?? null,
    doctor_recommendation: r.doctor_recommendation ?? null,
  }));
  out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return out.slice(0, 50);
}

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function deleteConversation(scopeKey: string, conversationId: string): Promise<void> {
  const redis = getUpstash();
  if (redis) {
    await redis.del(dataKey(scopeKey, conversationId));
    await redis.srem(idsKey(scopeKey), conversationId);
    return;
  }
  getMemoryBucket(scopeKey).delete(conversationId);
}
