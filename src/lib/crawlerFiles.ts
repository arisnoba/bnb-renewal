import { getHeaderMenu } from '@/Header/Nav/menu'

import { apexHostname, centerFromHostname, centerOrigin, primaryHostname } from './centerDomains'

type RequestLike = Pick<Request, 'headers' | 'url'>

const sitemapPath = '/sitemap.xml'

export function crawlerOrigin(request: RequestLike) {
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
      // Keep the framework-provided host when a forwarded host is malformed.
    }
  }

  if (forwardedProtocol === 'http' || forwardedProtocol === 'https') {
    url.protocol = `${forwardedProtocol}:`
  }

  const center = centerFromHostname(url.hostname)

  if (center) {
    return centerOrigin(center)
  }

  if (url.hostname === apexHostname || url.hostname === primaryHostname) {
    return `https://${primaryHostname}`
  }

  return url.origin
}

export function generateRobotsTxt(origin: string) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    '',
    `Sitemap: ${new URL(sitemapPath, origin).href}`,
    '',
  ].join('\n')
}

export function generateSitemapXml(origin: string) {
  const urls = sitemapURLs(origin)
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n')
}

export function sitemapURLs(origin: string) {
  const normalizedOrigin = new URL(origin).origin
  const center = centerFromHostname(new URL(normalizedOrigin).hostname)

  if (!center) {
    return [`${normalizedOrigin}/`]
  }

  const menuURLs = getHeaderMenu(center).flatMap((group) =>
    group.items.map((item) => item.href),
  )

  return [...new Set([`${normalizedOrigin}/`, ...menuURLs, `${normalizedOrigin}/consult`])]
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
