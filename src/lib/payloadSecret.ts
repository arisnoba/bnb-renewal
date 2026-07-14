type Env = Record<string, string | undefined>

const LOCAL_DEVELOPMENT_SECRET = 'bnb-renewal-local-development-secret'

function requiresConfiguredSecret(env: Env) {
  return (
    env.NODE_ENV === 'production' ||
    env.VERCEL_ENV === 'production' ||
    env.VERCEL_ENV === 'preview'
  )
}

export function resolvePayloadSecret(env: Env = process.env) {
  const configuredSecret = env.PAYLOAD_SECRET?.trim()

  if (configuredSecret) {
    return configuredSecret
  }

  if (requiresConfiguredSecret(env)) {
    throw new Error('운영 및 미리보기 환경에는 PAYLOAD_SECRET 환경변수가 필요합니다.')
  }

  return LOCAL_DEVELOPMENT_SECRET
}
