export function publishedImageSrc(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  if (process.env.VERCEL === '1' && isLegacyAssetSrc(trimmed)) {
    return ''
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

function isLegacyAssetSrc(value: string) {
  if (value.startsWith('/legacy/')) {
    return true
  }

  try {
    return new URL(value).pathname.startsWith('/legacy/')
  } catch {
    return false
  }
}
