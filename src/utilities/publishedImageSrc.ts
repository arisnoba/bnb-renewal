export function publishedImageSrc(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  const r2DevObjectKey = r2DevMediaObjectKey(trimmed)

  if (r2DevObjectKey) {
    return r2PublicUrl(r2DevObjectKey)
  }

  const legacyObjectKey = legacyAssetObjectKey(trimmed)

  if (legacyObjectKey) {
    return r2PublicUrl(legacyObjectKey)
  }

  if (isR2MediaObjectKey(trimmed)) {
    return r2PublicUrl(trimmed)
  }

  return trimmed
}

function isR2MediaObjectKey(value: string) {
  return value.startsWith('media/')
}

function r2PublicUrl(objectKey: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '')

  if (!publicBaseUrl) {
    return `/${objectKey}`
  }

  return `${publicBaseUrl}/${objectKey}`
}

function r2DevMediaObjectKey(value: string) {
  if (!/^(https?:)?\/\//.test(value)) {
    return ''
  }

  try {
    const parsed = new URL(value, 'http://local.test')

    if (!isR2DevHostname(parsed.hostname)) {
      return ''
    }

    if (!parsed.pathname.startsWith('/media/') && !parsed.pathname.startsWith('/legacy/')) {
      return ''
    }

    return `${parsed.pathname.replace(/^\/+/, '')}${parsed.search}`
  } catch {
    return ''
  }
}

function isR2DevHostname(hostname: string) {
  return hostname === 'r2.dev' || hostname.endsWith('.r2.dev')
}

function legacyAssetObjectKey(value: string) {
  if (value.startsWith('legacy/') || value.startsWith('/legacy/')) {
    return value.replace(/^\/+/, '')
  }

  try {
    const pathname = new URL(value).pathname

    return pathname.startsWith('/legacy/') ? pathname.replace(/^\/+/, '') : ''
  } catch {
    return ''
  }
}
