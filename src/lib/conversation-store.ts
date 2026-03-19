/**
 * Conversation store: Upstash Redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, otherwise in-memory.
 * Same interface for both. Keys: conversation:{id} = JSON, conversation:ids = set of ids.
 */

import { Redis } from "@upstash/redis";
import type { ConversationRecord, ConversationMessage, SelectedDoctorInfo } from "./conversation-types";

const KEY_PREFIX = "conversation:";
const KEY_IDS = "conversation:ids";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

let upstashClient: Redis | null = null;

function getUpstash(): Redis | null {
  if (upstashClient) return upstashClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    upstashClient = new Redis({
      url,
      token,
      // We store JSON strings and deserialize ourselves (message timestamps → Date). Disable so get() returns raw string.
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

const memoryStore = new Map<string, ConversationRecord>();

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
  const prev = existing ?? memoryStore.get(conversationId) ?? null;
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
  conversationId: string
): Promise<ConversationRecord | null> {
  const redis = getUpstash();
  if (redis) {
    const raw = await redis.get<string>(KEY_PREFIX + conversationId);
    if (raw) {
      console.log("[conversation-store] Read from Redis (Upstash)", { conversationId });
      return deserialize(raw);
    }
    return null;
  }
  return memoryStore.get(conversationId) ?? null;
}

export async function setConversation(
  conversationId: string,
  messages: ConversationMessage[],
  meta?: RecordMeta
): Promise<void> {
  const existing = await getConversation(conversationId);
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
  // Update timestamp on every save so "Recent chats" reflects last activity
  record.timestamp = new Date().toISOString();

  const redis = getUpstash();
  if (redis) {
    console.log("[conversation-store] Writing to Redis (Upstash)", {
      conversationId,
      messageCount: messages.length,
      selected_doctor: record.selected_doctor ?? null,
      funds_allocated: record.funds_allocated ?? null,
    });
    await redis.set(KEY_PREFIX + conversationId, serialize(record), { ex: TTL_SECONDS });
    await redis.sadd(KEY_IDS, conversationId);
    return;
  }
  console.log("[conversation-store] Writing to in-memory store", { conversationId });
  memoryStore.set(conversationId, record);
}

/** List conversation ids with title, timestamp, and optional context for resume. */
export async function listConversations(): Promise<
  Array<{ conversation_id: string; timestamp: string; title: string | null; doctor_recommendation?: string | null }>
> {
  const redis = getUpstash();
  if (redis) {
    let ids: string[] = [];
    try {
      const rawIds = await redis.smembers(KEY_IDS);
      ids = Array.isArray(rawIds) ? rawIds.map((id) => String(id)) : [];
    } catch (e) {
      console.warn("[conversation-store] smembers failed, falling back to keys scan", e);
    }
    // If set is empty (e.g. old data or set never populated), discover via KEYS
    if (ids.length === 0) {
      try {
        const keys = await redis.keys(KEY_PREFIX + "*");
        const keyList = Array.isArray(keys) ? keys : [];
        for (const key of keyList) {
          if (key === KEY_IDS) continue;
          if (key.startsWith(KEY_PREFIX)) {
            const id = key.slice(KEY_PREFIX.length);
            if (id) ids.push(id);
          }
        }
      } catch (e) {
        console.warn("[conversation-store] keys scan failed", e);
      }
    }
    const out: Array<{ conversation_id: string; timestamp: string; title: string | null; doctor_recommendation?: string | null }> = [];
    for (const id of ids) {
      const key = KEY_PREFIX + String(id);
      const raw = await redis.get<string>(key);
      if (!raw) continue;
      const r = deserialize(raw);
      if (r) out.push({
        conversation_id: r.conversation_id,
        timestamp: r.timestamp ?? new Date().toISOString(),
        title: r.title ?? null,
        doctor_recommendation: r.doctor_recommendation ?? null,
      });
    }
    out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return out.slice(0, 50);
  }
  const out = Array.from(memoryStore.entries()).map(([id, r]) => ({
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

/** Delete a conversation by id (e.g. remove temporary "ongoing" chat after user picks one to resume). */
export async function deleteConversation(conversationId: string): Promise<void> {
  const redis = getUpstash();
  if (redis) {
    await redis.del(KEY_PREFIX + conversationId);
    await redis.srem(KEY_IDS, conversationId);
    return;
  }
  memoryStore.delete(conversationId);
}
