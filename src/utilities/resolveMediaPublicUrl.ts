import path from 'node:path'

type ResolveMediaPublicUrlInput = {
  filename?: unknown
  isProduction?: boolean
  prefix?: unknown
  publicBaseUrl?: string
  value: unknown
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function publicBaseUrl(value = process.env.R2_PUBLIC_BASE_URL) {
  return stringValue(value).replace(/\/+$/, '')
}

function appendSearch(url: string, search: string) {
  return search ? `${url}${search}` : url
}

function normalizeObjectKey(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

function fileBasename(value: string) {
  return path.posix.basename(decodeURIComponent(value))
}

function resolveApiMediaObjectKey({
  fallbackFilename,
  fallbackPrefix,
  parsed,
}: {
  fallbackFilename: string
  fallbackPrefix: string
  parsed: URL
}) {
  if (!parsed.pathname.startsWith('/api/media/file/')) {
    return ''
  }

  const filename = fallbackFilename || fileBasename(parsed.pathname)
  const prefix = stringValue(parsed.searchParams.get('prefix')) || fallbackPrefix

  return filename && prefix ? path.posix.join(normalizeObjectKey(prefix), filename) : ''
}

function resolveMediaPathObjectKey(parsed: URL) {
  if (!parsed.pathname.startsWith('/media/')) {
    return ''
  }

  return normalizeObjectKey(decodeURIComponent(parsed.pathname))
}

export function resolveMediaPublicUrl({
  filename,
  isProduction = process.env.NODE_ENV === 'production',
  prefix,
  publicBaseUrl: publicBaseUrlInput,
  value,
}: ResolveMediaPublicUrlInput) {
  const src = stringValue(value)

  if (!src) {
    return ''
  }

  try {
    const parsed = new URL(src, 'http://local.test')
    const isApiMediaUrl = parsed.pathname.startsWith('/api/media/file/')
    const baseUrl = publicBaseUrl(publicBaseUrlInput)

    if (/^(https?:)?\/\//.test(src)) {
      if (!isApiMediaUrl) {
        return src
      }

      if (!baseUrl && !isProduction) {
        return parsed.pathname
      }
    }

    if (!baseUrl) {
      return src
    }

    const fallbackFilename = stringValue(filename)
    const fallbackPrefix = stringValue(prefix)
    const apiMediaObjectKey = resolveApiMediaObjectKey({
      fallbackFilename,
      fallbackPrefix,
      parsed,
    })
    const mediaPathObjectKey = apiMediaObjectKey ? '' : resolveMediaPathObjectKey(parsed)
    const objectKey = apiMediaObjectKey || mediaPathObjectKey

    return objectKey
      ? appendSearch(
          `${baseUrl}/${objectKey}`,
          mediaPathObjectKey ? parsed.search : '',
        )
      : src
  } catch {
    return src
  }
}
