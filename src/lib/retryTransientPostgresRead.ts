type ErrorWithCause = {
  cause?: unknown
  code?: unknown
  message?: unknown
}

type RetryTransientPostgresReadOptions = {
  delayMs?: number
  operation: string
}

const transientPostgresCodes = new Set(['08P01', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'])
const transientPostgresMessages = [
  'Authentication timed out',
  'Client network socket disconnected before secure TLS connection was established',
  'Connection terminated unexpectedly',
]

function transientPostgresReason(error: unknown) {
  let current = error

  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== 'object') {
      return undefined
    }

    const candidate = current as ErrorWithCause
    const code = typeof candidate.code === 'string' ? candidate.code : undefined
    const message = typeof candidate.message === 'string' ? candidate.message : undefined

    if (code && transientPostgresCodes.has(code)) {
      return code
    }

    const matchingMessage = transientPostgresMessages.find((value) => message?.includes(value))

    if (matchingMessage) {
      return matchingMessage
    }

    current = candidate.cause
  }

  return undefined
}

export async function retryTransientPostgresRead<T>(
  read: () => Promise<T>,
  { delayMs = 100, operation }: RetryTransientPostgresReadOptions
) {
  try {
    return await read()
  } catch (error) {
    const reason = transientPostgresReason(error)

    if (!reason) {
      throw error
    }

    console.warn('[database] retrying transient PostgreSQL read', {
      operation,
      reason,
    })

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    return read()
  }
}
