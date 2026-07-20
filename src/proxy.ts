import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { centerDomainRoute } from '@/lib/centerDomains'

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

export function routingURL(request: Pick<NextRequest, 'headers' | 'url'>) {
  const url = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const requestHost = forwardedHost || request.headers.get('host')?.trim()
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()

  if (requestHost) {
    try {
      const parsedHost = new URL(`http://${requestHost}`)
      url.hostname = parsedHost.hostname
      url.port = parsedHost.port
    } catch {
      // Keep the framework-provided URL when a forwarded host is malformed.
    }
  }

  if (forwardedProtocol === 'http' || forwardedProtocol === 'https') {
    url.protocol = `${forwardedProtocol}:`
  }

  return url
}

export function proxy(request: NextRequest) {
  const normalizedURL = normalizeAdminListURL(request.nextUrl)

  if (normalizedURL) {
    return NextResponse.redirect(normalizedURL)
  }

  const domainRoute = centerDomainRoute(routingURL(request))

  if (domainRoute?.type === 'redirect') {
    return NextResponse.redirect(domainRoute.url, 308)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', domainRoute?.url.pathname ?? request.nextUrl.pathname)

  if (domainRoute?.type === 'rewrite') {
    const rewriteURL = new URL(request.url)
    rewriteURL.pathname = domainRoute.url.pathname
    rewriteURL.search = domainRoute.url.search

    return NextResponse.rewrite(rewriteURL, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next|assets|favicon.ico|favicon.svg|media|legacy).*)'],
}
