import {
  centerFromHostname,
  centerFromPathname,
  centerOrigin,
  primaryHostname,
  publicCenterPath,
} from './centerDomains'

export function canonicalPublicUrl({
  host,
  pathname,
}: {
  host: string | null
  pathname: string | null
}) {
  const normalizedPathname = pathname?.startsWith('/') ? pathname : '/'
  const center = centerFromHostname(host ?? '') ?? centerFromPathname(normalizedPathname)

  if (center) {
    return new URL(publicCenterPath(normalizedPathname, center), centerOrigin(center)).href
  }

  return new URL(normalizedPathname, `https://${primaryHostname}`).href
}
