import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5432/bnb_renewal'

const LOCAL_DATABASE_HOSTS = new Set([
  '127.0.0.1',
  '::1',
  'host.docker.internal',
  'localhost',
  'postgres',
])

export type DbTargetInfo = {
  connectionString: string
  database: string
  host: string
  isLocal: boolean
  nodeEnv: string
}

export function getDatabaseConnectionString(options?: {
  preferUnpooled?: boolean
}): string {
  if (options?.preferUnpooled) {
    return (
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      DEFAULT_DATABASE_URL
    )
  }

  return (
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    DEFAULT_DATABASE_URL
  )
}

export function resolveDbTargetInfo(connectionString = getDatabaseConnectionString()): DbTargetInfo {
  const nodeEnv = process.env.NODE_ENV ?? 'development'

  try {
    const url = new URL(connectionString)
    const host = url.hostname || 'unknown'
    const database = url.pathname.replace(/^\/+/, '') || 'unknown'

    return {
      connectionString,
      database,
      host,
      isLocal: LOCAL_DATABASE_HOSTS.has(host),
      nodeEnv,
    }
  } catch {
    return {
      connectionString,
      database: 'unknown',
      host: 'unknown',
      isLocal: false,
      nodeEnv,
    }
  }
}

export function logDbTargetInfo(info: DbTargetInfo, options?: { destructive?: boolean }) {
  console.log(
    JSON.stringify(
      {
        allowDestructiveC0: process.env.ALLOW_DESTRUCTIVE_C0 === '1',
        database: info.database,
        destructive: options?.destructive ?? false,
        host: info.host,
        isLocal: info.isLocal,
        nodeEnv: info.nodeEnv,
      },
      null,
      2,
    ),
  )
}

export function assertDestructiveC0Allowed(): DbTargetInfo {
  const target = resolveDbTargetInfo()

  logDbTargetInfo(target, { destructive: true })

  if (target.isLocal || process.env.ALLOW_DESTRUCTIVE_C0 === '1') {
    return target
  }

  throw new Error(
    '비로컬 DB에서는 destructive C0 작업을 차단합니다. 로컬 DB에서 실행하거나 ALLOW_DESTRUCTIVE_C0=1 을 명시하세요.',
  )
}

export async function ensureParentDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

export function resolveProjectPath(...segments: string[]) {
  return path.join(process.cwd(), ...segments)
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await ensureParentDir(filePath)
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function toNonEmptyString(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}
