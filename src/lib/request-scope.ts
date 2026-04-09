import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Partitions server-side chat/appointment data per client "locale" so a shared Redis
 * instance does not show one global chat list to every visitor.
 *
 * Canon key = coarse geo (when headers exist) + stable hash of client IP (never stored raw).
 * - On Vercel: x-vercel-ip-country, x-vercel-ip-country-region
 * - Cloudflare: CF-IPCountry, CF-Connecting-IP
 *
 * Set CLIENT_SCOPE_SALT in production so hashes are not guessable across deployments.
 */

const DEFAULT_SALT = "dvrable-client-scope-v1";

function sanitizeSegment(s: string, max: number): string {
  const t = s.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, max);
  return t || "na";
}

function hashIp(ip: string): string {
  const salt = process.env.CLIENT_SCOPE_SALT?.trim() || DEFAULT_SALT;
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 16);
}

function getForwardedIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export interface ClientScope {
  /** Safe for Redis key suffix: [a-z0-9_]+ */
  key: string;
  /** Non-sensitive hint for support or future UI (no IP) */
  label: string;
}

export function getClientScope(req: NextRequest): ClientScope {
  const h = req.headers;
  const ip = getForwardedIp(h);
  const ipPart = hashIp(ip);

  const country = (h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "")
    .trim()
    .toUpperCase();
  const regionRaw =
    h.get("x-vercel-ip-country-region")?.trim() ||
    h.get("x-vercel-ip-subdivision-1-code")?.trim() ||
    "";

  let key: string;
  let label: string;

  if (country.length === 2 && /^[A-Z]{2}$/.test(country)) {
    const reg = sanitizeSegment(regionRaw, 12);
    key = `g_${country.toLowerCase()}_${reg}_${ipPart}`;
    label = reg !== "na" ? `${country} · ${regionRaw || reg}` : country;
  } else {
    key = `h_${ipPart}`;
    label = "This network";
  }

  if (key.length > 96) {
    key = key.slice(0, 96);
  }

  return { key, label };
}

/** Optional response headers so clients can show “scoped to your region” without exposing IP. */
export function scopeResponseHeaders(scope: ClientScope): Record<string, string> {
  return {
    "x-dvrable-scope-label": scope.label.slice(0, 120),
  };
}

export function attachScopeHeaders<T>(res: NextResponse<T>, scope: ClientScope): NextResponse<T> {
  for (const [k, v] of Object.entries(scopeResponseHeaders(scope))) {
    res.headers.set(k, v);
  }
  return res;
}
