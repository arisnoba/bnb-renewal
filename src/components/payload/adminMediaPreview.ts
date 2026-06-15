type AdminMediaPreview = {
  thumbnailURL?: unknown
  url?: unknown
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getAdminMediaPreviewSrc(media?: AdminMediaPreview | null) {
  const src = stringValue(media?.url) || stringValue(media?.thumbnailURL)

  if (!src) {
    return ''
  }

  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) {
    return src
  }

  return `/${src.replace(/^\/+/, '')}`
}
