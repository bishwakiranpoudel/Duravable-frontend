/**
 * Appointment store: Upstash Redis (same env as conversation-store).
 * Partitioned by client scope so "My Appointments" is not global across all users.
 */

import { Redis } from "@upstash/redis";
import type { AppointmentRecord } from "./conversation-types";

const APPOINTMENT_NS = "appointment:";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function dataKey(scopeKey: string, id: string): string {
  return `${APPOINTMENT_NS}${scopeKey}:${id}`;
}

function idsKey(scopeKey: string): string {
  return `${APPOINTMENT_NS}ids:${scopeKey}`;
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
    return upstashClient;
  }
  return null;
}

const memoryByScope = new Map<string, Map<string, AppointmentRecord>>();

function getMemoryBucket(scopeKey: string): Map<string, AppointmentRecord> {
  let m = memoryByScope.get(scopeKey);
  if (!m) {
    m = new Map();
    memoryByScope.set(scopeKey, m);
  }
  return m;
}

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
  scopeKey: string,
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
    await redis.set(dataKey(scopeKey, id), serialize(record), { ex: TTL_SECONDS });
    await redis.sadd(idsKey(scopeKey), id);
    return record;
  }
  getMemoryBucket(scopeKey).set(id, record);
  return record;
}

export async function listAppointments(scopeKey: string): Promise<AppointmentRecord[]> {
  const redis = getUpstash();
  if (redis) {
    let ids: string[] = [];
    try {
      const rawIds = await redis.smembers(idsKey(scopeKey));
      ids = Array.isArray(rawIds) ? rawIds.map((i) => String(i)) : [];
    } catch {
      ids = [];
    }
    const prefix = `${APPOINTMENT_NS}${scopeKey}:`;
    if (ids.length === 0) {
      try {
        const keys = await redis.keys(`${prefix}*`);
        const keyList = Array.isArray(keys) ? keys : [];
        for (const key of keyList) {
          if (typeof key !== "string" || !key.startsWith(prefix)) continue;
          const id = key.slice(prefix.length);
          if (id) ids.push(id);
        }
      } catch {
        /* ignore */
      }
    }
    const out: AppointmentRecord[] = [];
    for (const id of ids) {
      const raw = await redis.get<string>(dataKey(scopeKey, String(id)));
      if (raw) {
        const r = deserialize(raw);
        if (r) out.push(r);
      }
    }
    out.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    return out;
  }
  const out = Array.from(getMemoryBucket(scopeKey).values());
  out.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  return out;
}

export async function getAppointment(scopeKey: string, id: string): Promise<AppointmentRecord | null> {
  const redis = getUpstash();
  if (redis) {
    const raw = await redis.get<string>(dataKey(scopeKey, id));
    return raw ? deserialize(raw) : null;
  }
  return getMemoryBucket(scopeKey).get(id) ?? null;
}

export async function updateAppointmentStatus(
  scopeKey: string,
  id: string,
  status: AppointmentRecord["status"]
): Promise<AppointmentRecord | null> {
  const existing = await getAppointment(scopeKey, id);
  if (!existing) return null;
  const updated: AppointmentRecord = { ...existing, status };
  const redis = getUpstash();
  if (redis) {
    await redis.set(dataKey(scopeKey, id), serialize(updated), { ex: TTL_SECONDS });
    return updated;
  }
  getMemoryBucket(scopeKey).set(id, updated);
  return updated;
}
