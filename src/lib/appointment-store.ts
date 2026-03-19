/**
 * Appointment store: Upstash Redis (same as conversation-store).
 * Keys: appointment:ids = set of ids, appointment:{id} = JSON.
 */

import { Redis } from "@upstash/redis";
import type { AppointmentRecord } from "./conversation-types";

const KEY_PREFIX = "appointment:";
const KEY_IDS = "appointment:ids";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
    return upstashClient;
  }
  return null;
}

const memoryStore = new Map<string, AppointmentRecord>();

function serialize(record: AppointmentRecord): string {
  return JSON.stringify(record);
}

function deserialize(raw: string): AppointmentRecord | null {
  try {
    return JSON.parse(raw) as AppointmentRecord;
  } catch {
    return null;
  }
}

export function generateAppointmentId(): string {
  return `apt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function createAppointment(
  data: Omit<AppointmentRecord, "id" | "created_at" | "status">
): Promise<AppointmentRecord> {
  const id = generateAppointmentId();
  const record: AppointmentRecord = {
    ...data,
    id,
    status: "scheduled",
    created_at: new Date().toISOString(),
  };

  const redis = getUpstash();
  if (redis) {
    await redis.set(KEY_PREFIX + id, serialize(record), { ex: TTL_SECONDS });
    await redis.sadd(KEY_IDS, id);
    return record;
  }
  memoryStore.set(id, record);
  const ids = Array.from(memoryStore.keys());
  if (!ids.includes(id)) memoryStore.set(id, record);
  return record;
}

export async function listAppointments(): Promise<AppointmentRecord[]> {
  const redis = getUpstash();
  if (redis) {
    const rawIds = await redis.smembers(KEY_IDS);
    const ids = Array.isArray(rawIds) ? rawIds.map((id) => String(id)) : [];
    const out: AppointmentRecord[] = [];
    for (const id of ids) {
      const raw = await redis.get<string>(KEY_PREFIX + id);
      if (raw) {
        const r = deserialize(raw);
        if (r) out.push(r);
      }
    }
    out.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    return out;
  }
  const out = Array.from(memoryStore.values());
  out.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  return out;
}

export async function getAppointment(id: string): Promise<AppointmentRecord | null> {
  const redis = getUpstash();
  if (redis) {
    const raw = await redis.get<string>(KEY_PREFIX + id);
    return raw ? deserialize(raw) : null;
  }
  return memoryStore.get(id) ?? null;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentRecord["status"]
): Promise<AppointmentRecord | null> {
  const existing = await getAppointment(id);
  if (!existing) return null;
  const updated: AppointmentRecord = { ...existing, status };
  const redis = getUpstash();
  if (redis) {
    await redis.set(KEY_PREFIX + id, serialize(updated), { ex: TTL_SECONDS });
    return updated;
  }
  memoryStore.set(id, updated);
  return updated;
}
