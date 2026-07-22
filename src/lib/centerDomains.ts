import type { CenterSlug } from './centers'

import { centers } from './centers'

export const primaryHostname = 'www.baewooenm.com'

export const apexHostname = 'baewooenm.com'
const centerSlugs = Object.keys(centers) as CenterSlug[]
const centerSlugSet = new Set<CenterSlug>(centerSlugs)

export type CenterDomainRoute =
  | {
      center: CenterSlug
      type: 'redirect'
      url: URL
    }
  | {
      center: CenterSlug
      type: 'rewrite'
      url: URL
    }

export function centerHostname(center: CenterSlug) {
  return `${center}.${apexHostname}`
}

export function centerOrigin(center: CenterSlug) {
  return `https://${centerHostname(center)}`
}

export function centerPublicHref(center: CenterSlug, path = '') {
  if (!path || path === '/') {
    return centerOrigin(center)
  }

  const suffix = path.startsWith('/') || path.startsWith('?') || path.startsWith('#')
    ? path
    : `/${path}`

  return `${centerOrigin(center)}${suffix}`
}

export function centerFromHostname(hostname: string): CenterSlug | null {
  const normalizedHostname = hostname.trim().toLowerCase().split(':')[0]
  const suffix = `.${apexHostname}`

  if (!normalizedHostname.endsWith(suffix)) {
    return null
  }

  const subdomain = normalizedHostname.slice(0, -suffix.length)

  return centerSlugSet.has(subdomain as CenterSlug) ? (subdomain as CenterSlug) : null
}

export function centerFromPathname(pathname: string): CenterSlug | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0]

  return centerSlugSet.has(firstSegment as CenterSlug) ? (firstSegment as CenterSlug) : null
}

export function publicCenterPath(pathname: string, center: CenterSlug) {
  const centerPrefix = `/${center}`

  if (pathname === centerPrefix) {
    return '/'
  }

  return pathname.startsWith(`${centerPrefix}/`) ? pathname.slice(centerPrefix.length) : pathname
}

export function centerDomainRoute(url: URL): CenterDomainRoute | null {
  const hostnameCenter = centerFromHostname(url.hostname)
  const pathnameCenter = centerFromPathname(url.pathname)

  if (pathnameCenter && (hostnameCenter || isPrimaryHostname(url.hostname))) {
    const redirectURL = new URL(url)
    redirectURL.hostname = centerHostname(pathnameCenter)
    redirectURL.pathname = publicCenterPath(url.pathname, pathnameCenter)

    return {
      center: pathnameCenter,
      type: 'redirect',
      url: redirectURL,
    }
  }

  if (!hostnameCenter || isSharedRoute(url.pathname)) {
    return null
  }

  const rewriteURL = new URL(url)
  rewriteURL.pathname = `/${hostnameCenter}${url.pathname === '/' ? '' : url.pathname}`

  return {
    center: hostnameCenter,
    type: 'rewrite',
    url: rewriteURL,
  }
}

function isPrimaryHostname(hostname: string) {
  const normalizedHostname = hostname.trim().toLowerCase().split(':')[0]

  return normalizedHostname === primaryHostname || normalizedHostname === apexHostname
}

function isSharedRoute(pathname: string) {
  return (
    pathname === '/ie-incompatible.html' ||
    pathname === '/llms.txt' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/next' ||
    pathname.startsWith('/next/')
  )
}
