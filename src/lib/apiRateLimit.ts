import { createHmac } from 'node:crypto'

import { sql } from '@payloadcms/db-postgres'

import { getPayloadClient } from '@/lib/payload'
import { resolvePayloadSecret } from '@/lib/payloadSecret'

export type RateLimitPolicy = {
  limit: number
  scope: string
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

type RateLimitRow = {
  count: number | string
  reset_at: number | string
}

type RateLimitStore = (args: {
  key: string
  resetAt: number
  scopePrefix: string
}) => Promise<RateLimitRow>

export async function consumeRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  options: {
    now?: number
    store?: RateLimitStore
    userID?: number | string | null
  } = {},
): Promise<RateLimitResult> {
  validatePolicy(policy)

  const now = options.now ?? Date.now()
  const resetAt = Math.floor(now / policy.windowMs) * policy.windowMs + policy.windowMs
  const identifier = resolveRateLimitIdentifier(request.headers, options.userID)
  const identifierHash = createHmac('sha256', resolvePayloadSecret())
    .update(identifier)
    .digest('hex')
  const scopePrefix = `api-rate-limit:${policy.scope}:`
  const key = `${scopePrefix}${resetAt}:${identifierHash}`
  const store = options.store ?? postgresRateLimitStore
  const row = await store({ key, resetAt, scopePrefix })
  const count = Number(row.count)
  const storedResetAt = Number(row.reset_at)
  const effectiveResetAt = Number.isFinite(storedResetAt) ? storedResetAt : resetAt

  return {
    allowed: count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - count),
    resetAt: effectiveResetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((effectiveResetAt - now) / 1000)),
  }
}

export function resolveRateLimitIdentifier(
  headers: Pick<Headers, 'get'>,
  userID?: number | string | null,
) {
  if (userID !== undefined && userID !== null && String(userID).trim()) {
    return `user:${String(userID).trim()}`
  }

  const forwardedIp = firstForwardedIP(headers.get('x-vercel-forwarded-for'))
    ?? normalizedIP(headers.get('cf-connecting-ip'))
    ?? firstForwardedIP(headers.get('x-forwarded-for'))
    ?? normalizedIP(headers.get('x-real-ip'))

  return `ip:${forwardedIp ?? 'unknown'}`
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    'Retry-After': String(result.retryAfterSeconds),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}

async function postgresRateLimitStore({
  key,
  resetAt,
  scopePrefix,
}: {
  key: string
  resetAt: number
  scopePrefix: string
}) {
  const payload = await getPayloadClient()
  const result = await payload.db.drizzle.execute(sql`
      WITH expired AS (
        DELETE FROM "payload_kv"
        WHERE "key" LIKE ${`${scopePrefix}%`}
          AND COALESCE(("data"->>'resetAt')::bigint, 0) <= ${Date.now()}
      )
      INSERT INTO "payload_kv" ("key", "data")
      VALUES (
        ${key},
        jsonb_build_object('count', 1, 'resetAt', ${resetAt}::bigint)
      )
      ON CONFLICT ("key") DO UPDATE
      SET "data" = jsonb_set(
        "payload_kv"."data",
        '{count}',
        to_jsonb(COALESCE(("payload_kv"."data"->>'count')::integer, 0) + 1)
      )
      RETURNING
        ("data"->>'count')::integer AS "count",
        ("data"->>'resetAt')::bigint AS "reset_at"
    `)
  const row = result.rows[0] as RateLimitRow | undefined

  if (!row) {
    throw new Error('Rate limit counter was not returned')
  }

  return row
}

function firstForwardedIP(value: string | null) {
  return normalizedIP(value?.split(',')[0] ?? null)
}

function normalizedIP(value: string | null) {
  const normalized = value?.trim()

  if (!normalized || normalized.length > 64 || !/^[0-9a-f:.]+$/i.test(normalized)) {
    return null
  }

  return normalized.toLowerCase()
}

function validatePolicy(policy: RateLimitPolicy) {
  if (!/^[a-z0-9-]+$/.test(policy.scope)) {
    throw new Error('Rate limit scope must contain only lowercase letters, numbers, and hyphens')
  }

  if (!Number.isInteger(policy.limit) || policy.limit < 1) {
    throw new Error('Rate limit must be a positive integer')
  }

  if (!Number.isInteger(policy.windowMs) || policy.windowMs < 1_000) {
    throw new Error('Rate limit window must be at least one second')
  }
}
