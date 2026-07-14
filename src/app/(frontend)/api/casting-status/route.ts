import { centers, type CenterSlug } from '@/lib/centers'
import { consumeRateLimit, rateLimitHeaders } from '@/lib/apiRateLimit'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  CASTING_STATUS_YEAR_BATCH_SIZE,
  findCastingStatusYearPage,
  findCastingStatusYearBatch,
} from '../../casting-status/CastingStatus.data'

const maxPage = 100
const maxOffset = 500
const yearPattern = /^\d{4}$/

export async function GET(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    limit: 60,
    scope: 'casting-status',
    windowMs: 60_000,
  }).catch((error) => {
    console.error('[casting-status] failed to check rate limit', error)
    return null
  })

  if (!rateLimit) {
    return NextResponse.json({ error: 'rate-limit-unavailable' }, { status: 503 })
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'too-many-requests' },
      { headers: rateLimitHeaders(rateLimit), status: 429 },
    )
  }

  const { searchParams } = new URL(request.url)
  const center = searchParams.get('center')
  const offset = normalizeOffset(searchParams.get('offset'))
  const page = normalizePage(searchParams.get('page'))
  const year = searchParams.get('year')

  if (!isCenterSlug(center)) {
    return NextResponse.json({ error: 'invalid-center' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    if (!year) {
      const batch = await findCastingStatusYearBatch({
        center,
        limit: CASTING_STATUS_YEAR_BATCH_SIZE,
        offset,
        payload,
      })

      return NextResponse.json(batch)
    }

    if (!isYear(year)) {
      return NextResponse.json({ error: 'invalid-year' }, { status: 400 })
    }

    const group = await findCastingStatusYearPage({
      center,
      page,
      payload,
      year,
    })

    return NextResponse.json(group)
  } catch {
    return NextResponse.json({ error: 'failed-to-load-casting-status' }, { status: 500 })
  }
}

function normalizePage(value: string | null) {
  const page = Number(value)

  if (!Number.isInteger(page) || page < 1) {
    return 1
  }

  return Math.min(page, maxPage)
}

function normalizeOffset(value: string | null) {
  const offset = Number(value)

  if (!Number.isInteger(offset) || offset < 0) {
    return 0
  }

  return Math.min(offset, maxOffset)
}

function isCenterSlug(value: string | null): value is CenterSlug {
  return Boolean(value && value in centers)
}

function isYear(value: string | null): value is string {
  return Boolean(value && yearPattern.test(value))
}
