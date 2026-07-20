import type { CollectionConfig } from 'payload'

type Env = Record<string, string | undefined>

export function resolveUserAuth(env: Env = process.env): CollectionConfig['auth'] {
  if (env.VERCEL_ENV !== 'production') {
    return true
  }

  return {
    cookies: {
      domain: 'baewooenm.com',
      sameSite: 'Lax',
      secure: true,
    },
  }
}
