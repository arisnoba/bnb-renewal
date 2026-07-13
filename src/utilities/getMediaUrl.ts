/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * When R2_PUBLIC_BASE_URL is configured, app-managed media paths are resolved
 * to the public R2 URL in every environment. If R2 is not configured locally,
 * development falls back to the legacy public/media path behavior.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  const normalizedUrl = publicMediaUrl(url)

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  if (!cacheTag) {
    return normalizedUrl
  }

  const separator = normalizedUrl.includes('?') ? '&' : '?'

  return `${normalizedUrl}${separator}${cacheTag}`
}

function publicMediaUrl(url: string) {
  const publicBaseUrl = r2PublicBaseUrl()

  if (publicBaseUrl) {
    const objectKey = mediaObjectKey(url)

    if (objectKey) {
      return `${publicBaseUrl}/${objectKey}`
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return localPublicMediaUrl(url)
  }

  return url
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

function r2PublicBaseUrl() {
  return process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ?? ''
}

function mediaObjectKey(url: string) {
  try {
    const parsed = new URL(url, 'http://local.test')
    const apiMediaObjectKey = apiMediaObjectKeyFromUrl(parsed)

    if (apiMediaObjectKey) {
      return apiMediaObjectKey
    }

    const isAbsoluteUrl = /^(https?:)?\/\//.test(url)

    if (isAbsoluteUrl && !isR2DevHostname(parsed.hostname)) {
      return ''
    }

    const objectKey = appManagedObjectKeyFromPathname(parsed.pathname)

    return objectKey ? `${objectKey}${parsed.search}` : ''
  } catch {
    return ''
  }
}

function apiMediaObjectKeyFromUrl(parsed: URL) {
  if (!parsed.pathname.startsWith('/api/media/file/')) {
    return ''
  }

  const filename = parsed.pathname.split('/').at(-1)
  const prefix = parsed.searchParams.get('prefix')?.trim().replace(/^\/+|\/+$/g, '')

  if (!filename || !prefix) {
    return ''
  }

  return `${prefix}/${decodeURIComponent(filename)}`
}

function appManagedObjectKeyFromPathname(pathname: string) {
  if (!pathname.startsWith('/media/')) {
    return ''
  }

  return pathname.replace(/^\/+/, '')
}

function isR2DevHostname(hostname: string) {
  return hostname === 'r2.dev' || hostname.endsWith('.r2.dev')
}
