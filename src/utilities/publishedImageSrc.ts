export function publishedImageSrc(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  if (process.env.VERCEL === '1' && isLegacyAssetSrc(trimmed)) {
    return ''
  }

  return trimmed
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
