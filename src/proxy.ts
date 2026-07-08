import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

const validCenterFilterValues = new Set(['all', 'art', 'avenue', 'exam', 'highteen', 'kids'])
const singleCentersAdminListPaths = new Set([
  '/admin/collections/curriculums',
  '/admin/collections/screen-appearances',
])

function isSingleCentersAdminList(pathname: string) {
  return singleCentersAdminListPaths.has(pathname)
}

function singleCenterContainsParamKey(key: string) {
  return (
    key.startsWith('where[') &&
    key.includes('[centers][contains]') &&
    key.replace('[centers][contains]', '[centers][equals]')
  )
}

export function normalizeAdminListURL(url: URL) {
  if (!isSingleCentersAdminList(url.pathname)) {
    return undefined
  }

  const nextURL = new URL(url)
  let changed = false

  for (const [key, value] of url.searchParams.entries()) {
    const nextKey = singleCenterContainsParamKey(key)
    const trimmedValue = value.trim()

    if (!nextKey || !validCenterFilterValues.has(trimmedValue)) {
      continue
    }

    nextURL.searchParams.delete(key, value)

    if (trimmedValue !== 'all') {
      nextURL.searchParams.append(nextKey, trimmedValue)
    }

    changed = true
  }

  return changed ? nextURL : undefined
}

export function proxy(request: NextRequest) {
  const normalizedURL = normalizeAdminListURL(request.nextUrl)

  if (normalizedURL) {
    return NextResponse.redirect(normalizedURL)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next|assets|favicon.ico|favicon.svg|media|legacy).*)'],
}
