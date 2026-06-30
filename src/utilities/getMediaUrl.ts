/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * Local paths are kept relative so Next.js image optimization treats them as
 * local rather than fetching through `remotePatterns`, which blocks private IPs
 * since Next.js 16.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  const normalizedUrl =
    process.env.NODE_ENV !== 'production' ? localPublicMediaUrl(url) : productionPublicMediaUrl(url)

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  if (!cacheTag) {
    return normalizedUrl
  }

  const separator = normalizedUrl.includes('?') ? '&' : '?'

  return `${normalizedUrl}${separator}${cacheTag}`
}

function localPublicMediaUrl(url: string) {
  try {
    const parsed = new URL(url, 'http://local.test')

    if (!parsed.pathname.startsWith('/api/media/file/')) {
      return url
    }

    const filename = parsed.pathname.split('/').at(-1)

    return filename ? `/media/${filename}` : url
  } catch {
    return url
  }
}

function productionPublicMediaUrl(url: string) {
  const objectKey = localMediaObjectKey(url)

  if (!objectKey) {
    return url
  }

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '')

  return publicBaseUrl ? `${publicBaseUrl}/${objectKey}` : url
}

function localMediaObjectKey(url: string) {
  if (!url.startsWith('/media/')) {
    return ''
  }

  try {
    const parsed = new URL(url, 'http://local.test')

    return `${parsed.pathname.replace(/^\/+/, '')}${parsed.search}`
  } catch {
    return ''
  }
}
