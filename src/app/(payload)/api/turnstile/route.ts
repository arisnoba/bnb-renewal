import { NextResponse } from 'next/server'

import { verifyTurnstileToken } from '@/lib/turnstile'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null
  const token = typeof body?.token === 'string' ? body.token.trim() : ''

  if (!token) {
    return NextResponse.json(
      {
        error: 'missing-turnstile-token',
        success: false,
      },
      { status: 400 },
    )
  }

  const remoteIp =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()

  const verification = await verifyTurnstileToken(token, remoteIp)

  if (!verification.success) {
    return NextResponse.json(
      {
        error: 'turnstile-verification-failed',
        errorCodes: verification.errorCodes,
        success: false,
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
}
