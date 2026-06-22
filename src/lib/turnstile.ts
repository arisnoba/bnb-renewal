type TurnstileSiteverifyResponse = {
  success: boolean
  'error-codes'?: string[]
  hostname?: string
}

type VerifyTurnstileResult = {
  errorCodes: string[]
  success: boolean
}

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<VerifyTurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return {
      errorCodes: ['missing-secret-key'],
      success: false,
    }
  }

  const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
    body: JSON.stringify({
      remoteip: remoteIp,
      response: token,
      secret,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).catch(() => null)

  if (!response?.ok) {
    return {
      errorCodes: ['siteverify-request-failed'],
      success: false,
    }
  }

  const result = (await response.json().catch(() => null)) as TurnstileSiteverifyResponse | null

  if (!result) {
    return {
      errorCodes: ['siteverify-response-invalid'],
      success: false,
    }
  }

  return {
    errorCodes: result['error-codes'] ?? [],
    success: result.success,
  }
}
