export const ADMIN_IMAGE_UPLOAD_LIMIT_BYTES = 2 * 1024 * 1024
export const ADMIN_IMAGE_UPLOAD_LIMIT_LABEL = '2MB'
export const ADMIN_IMAGE_UPLOAD_LIMIT_MESSAGE = `이미지는 ${ADMIN_IMAGE_UPLOAD_LIMIT_LABEL} 이하로 압축한 뒤 업로드해 주세요.`

export const MAIN_BANNER_DESKTOP_VIDEO_RECOMMENDED_LIMIT_LABEL = '20MB'
export const MAIN_BANNER_MOBILE_VIDEO_RECOMMENDED_LIMIT_LABEL = '10MB'

type UploadFileLike = {
  mimeType?: string | null
  mimetype?: string | null
  size?: number | null
  type?: string | null
}

export function uploadFileMimeType(file?: UploadFileLike | null) {
  return String(file?.mimetype ?? file?.mimeType ?? file?.type ?? '').trim().toLowerCase()
}

export function isImageUploadFile(file?: UploadFileLike | null) {
  return uploadFileMimeType(file).startsWith('image/')
}

export function adminImageUploadSizeError(file?: UploadFileLike | null) {
  if (!isImageUploadFile(file)) {
    return ''
  }

  const size = Number(file?.size ?? 0)

  return Number.isFinite(size) && size > ADMIN_IMAGE_UPLOAD_LIMIT_BYTES
    ? ADMIN_IMAGE_UPLOAD_LIMIT_MESSAGE
    : ''
}

export function assertAdminImageUploadSize(file?: UploadFileLike | null) {
  const message = adminImageUploadSizeError(file)

  if (message) {
    throw new Error(message)
  }
}
