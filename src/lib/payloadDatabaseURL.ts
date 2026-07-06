const localDatabaseURL = 'postgres://postgres:postgres@127.0.0.1:5432/bnb_renewal'

type Env = Record<string, string | undefined>

function firstValue(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim()
}

export function resolvePayloadDatabaseURL(env: Env = process.env) {
  const pooledURL = firstValue(
    env.DATABASE_URL,
    env.POSTGRES_URL,
    env.DATABASE_POSTGRES_URL,
    env.POSTGRES_PRISMA_URL,
    env.DATABASE_POSTGRES_PRISMA_URL,
  )
  const directURL = firstValue(
    env.DATABASE_URL_UNPOOLED,
    env.POSTGRES_URL_NON_POOLING,
    env.DATABASE_POSTGRES_URL_NON_POOLING,
  )

  const databaseURL = env.VERCEL === '1'
    ? (pooledURL ?? directURL ?? localDatabaseURL)
    : (directURL ?? pooledURL ?? localDatabaseURL)

  return normalizePayloadDatabaseURL(databaseURL)
}

export function resolvePayloadDatabasePoolMax(env: Env = process.env) {
  const configured = parsePositiveInteger(
    firstValue(env.PAYLOAD_DATABASE_POOL_MAX, env.PAYLOAD_DB_POOL_MAX),
  )

  if (configured) {
    return configured
  }

  return env.VERCEL === '1' ? 3 : undefined
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function normalizePayloadDatabaseURL(databaseURL: string) {
  return databaseURL.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=(&|$))/i,
    '$1verify-full',
  )
}
