export function publishedImageSrc(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
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
