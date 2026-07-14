const INQUIRY_ATTACHMENT_PREFIX = 'inquiries/attachments/'

export const INQUIRY_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024
export const INQUIRY_ATTACHMENT_MAX_MEGABYTES = 4
export const INQUIRY_ATTACHMENT_EXTENSIONS = new Set([
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
])

export function inquiryAttachmentDownloadPath(id: unknown, objectKey: unknown) {
  const normalizedID = typeof id === 'number' || typeof id === 'string' ? String(id).trim() : ''

  if (!normalizedID || !isInquiryAttachmentObjectKey(objectKey)) {
    return ''
  }

  return `/api/inquiries/${encodeURIComponent(normalizedID)}/attachment`
}

export function isInquiryAttachmentObjectKey(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !value.startsWith(INQUIRY_ATTACHMENT_PREFIX) ||
    value.includes('\\')
  ) {
    return false
  }

  return value
    .split('/')
    .every((segment) => Boolean(segment) && segment !== '.' && segment !== '..')
}

export function attachmentContentDisposition(fileName: string) {
  const normalized = fileName.trim() || 'attachment'
  const asciiFallback = normalized.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(normalized)}`
}
