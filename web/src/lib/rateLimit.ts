// Simple in-memory rate limiter suitable for single-instance/serverless bursts.
// Keyed by identifier (e.g., user/IP) and route name.

type Bucket = {
  tokens: number;
  lastRefill: number; // epoch ms
};

type LimitConfig = {
  points: number;      // max tokens per interval
  intervalMs: number;  // interval window in ms
  keyPrefix?: string;  // optional prefix for storage key
};

// Global map survives between requests on warm serverless instances.
const buckets = new Map<string, Bucket>();

function now(): number {
  return Date.now();
}

function getKey(id: string, route: string, prefix?: string): string {
  return `${prefix || 'rl'}:${route}:${id}`;
}

function refill(bucket: Bucket, config: LimitConfig, t: number) {
  const elapsed = t - bucket.lastRefill;
  if (elapsed <= 0) return;
  const ratePerMs = config.points / config.intervalMs;
  const newTokens = elapsed * ratePerMs;
  bucket.tokens = Math.min(config.points, bucket.tokens + newTokens);
  bucket.lastRefill = t;
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number; // ms until full reset
};

export function rateLimitCheck(id: string, route: string, cfg?: Partial<LimitConfig>): RateLimitResult {
  // Defaults; can be overridden via env or per-route cfg
  const points = Number(process.env.RATE_LIMIT_POINTS || cfg?.points || 30); // max requests
  const intervalSec = Number(process.env.RATE_LIMIT_INTERVAL_SEC || (cfg?.intervalMs ? cfg.intervalMs / 1000 : 60));
  const intervalMs = Math.max(1000, Math.floor(intervalSec * 1000));
  const keyPrefix = cfg?.keyPrefix ?? process.env.RATE_LIMIT_PREFIX ?? 'rl';

  const key = getKey(id, route, keyPrefix);
  const t = now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: points, lastRefill: t };
    buckets.set(key, b);
  }
  refill(b, { points, intervalMs }, t);

  if (b.tokens >= 1) {
    b.tokens -= 1;
    // Estimate reset time: how long to refill to full
    const missing = Math.max(0, points - b.tokens);
    const resetMs = Math.ceil((missing / points) * intervalMs);
    return { ok: true, remaining: Math.max(0, Math.floor(b.tokens)), resetMs };
  }

  // Compute time until next token
  const ratePerMs = points / intervalMs;
  const needed = 1 - b.tokens;
  const waitMs = Math.ceil(needed / ratePerMs);
  return { ok: false, remaining: 0, resetMs: Math.max(waitMs, 0) };
}

// Helper to extract a best-effort client identifier (IP or fallback)
export function getClientIdFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for') || headers.get('x-real-ip') || '';
  const ip = xff.split(',')[0].trim();
  if (ip) return ip;
  const ua = headers.get('user-agent') || 'unknown';
  // Not ideal, but ensures some separation for local/dev
  return `ua:${ua.substring(0, 64)}`;
}

export type ApplyRateLimitOptions = {
  routeName: string;
  points?: number;
  intervalMs?: number;
};

export function applyRateLimit(request: Request, options: ApplyRateLimitOptions): Response | null {
  const { routeName, points, intervalMs } = options;

  // Developer bypass: if header token matches env token, skip rate limiting entirely
  const bypassToken = process.env.RL_DEV_BYPASS_TOKEN || process.env.RATE_LIMIT_DEV_TOKEN;
  if (bypassToken) {
    const provided = request.headers.get('x-rl-dev') || request.headers.get('x-dev-bypass');
    if (provided && provided === bypassToken) {
      return null;
    }
    // Also allow cookie-based token for convenience in browser/dev tools
    const cookie = request.headers.get('cookie') || '';
    if (cookie) {
      const match = cookie.match(/(?:^|;\s*)rl_dev=([^;]+)/);
      if (match && decodeURIComponent(match[1]) === bypassToken) {
        return null;
      }
    }
  }

  const id = getClientIdFromHeaders(request.headers);
  const res = rateLimitCheck(id, routeName, { points, intervalMs });
  if (res.ok) return null;

  const headers: Record<string, string> = {
    'Retry-After': String(Math.ceil(res.resetMs / 1000)),
    'X-RateLimit-Limit': String(points ?? process.env.RATE_LIMIT_POINTS ?? 30),
    'X-RateLimit-Remaining': String(res.remaining),
  };
  return new Response('Too Many Requests', { status: 429, headers });
}


