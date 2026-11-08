import { env } from "../../config/env";

export async function verifyTurnstile(token: string | undefined, remoteIp: string): Promise<boolean> {
  if (env.turnstile.localTestMode) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({
      secret: env.turnstile.secretKey,
      response: token,
      remoteip: remoteIp,
    });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientKey(ip: string, scope: string): string {
  return `${scope}:${ip}`;
}
