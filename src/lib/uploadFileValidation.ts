export const IMAGE_UPLOAD_TYPES = ['avif', 'gif', 'jpeg', 'png', 'webp'] as const
export const VIDEO_UPLOAD_TYPES = ['mp4', 'webm'] as const
export const MEDIA_UPLOAD_TYPES = [...IMAGE_UPLOAD_TYPES, ...VIDEO_UPLOAD_TYPES] as const
export const CONSULT_ATTACHMENT_UPLOAD_TYPES = ['jpeg', 'png', 'pdf'] as const
export const MEDIA_UPLOAD_MIME_TYPES = [
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
] as const

export type UploadFileType = (typeof MEDIA_UPLOAD_TYPES)[number] | 'pdf'

type UploadFileDefinition = {
  extensions: readonly string[]
  mimeType: string
  signatureMatches: (bytes: Uint8Array) => boolean
}

export type UploadFileValidationResult =
  | {
      mimeType: string
      type: UploadFileType
      valid: true
    }
  | {
      reason: 'extension' | 'mime' | 'signature'
      valid: false
    }

const uploadFileDefinitions: Record<UploadFileType, UploadFileDefinition> = {
  avif: {
    extensions: ['.avif'],
    mimeType: 'image/avif',
    signatureMatches: isAvif,
  },
  gif: {
    extensions: ['.gif'],
    mimeType: 'image/gif',
    signatureMatches: (bytes) => asciiAt(bytes, 0, 'GIF87a') || asciiAt(bytes, 0, 'GIF89a'),
  },
  jpeg: {
    extensions: ['.jpeg', '.jpg'],
    mimeType: 'image/jpeg',
    signatureMatches: (bytes) => bytesStartWith(bytes, [0xff, 0xd8, 0xff]),
  },
  mp4: {
    extensions: ['.mp4'],
    mimeType: 'video/mp4',
    signatureMatches: isMp4,
  },
  pdf: {
    extensions: ['.pdf'],
    mimeType: 'application/pdf',
    signatureMatches: (bytes) => asciiAt(bytes, 0, '%PDF-'),
  },
  png: {
    extensions: ['.png'],
    mimeType: 'image/png',
    signatureMatches: (bytes) =>
      bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  webp: {
    extensions: ['.webp'],
    mimeType: 'image/webp',
    signatureMatches: (bytes) => asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP'),
  },
  webm: {
    extensions: ['.webm'],
    mimeType: 'video/webm',
    signatureMatches: (bytes) =>
      bytesStartWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]) && asciiWithin(bytes, 'webm', 128),
  },
}

export function validateUploadedFile({
  allowedTypes,
  bytes,
  fileName,
  mimeType,
}: {
  allowedTypes: readonly UploadFileType[]
  bytes: Uint8Array
  fileName: string
  mimeType: string
}): UploadFileValidationResult {
  const extension = fileExtension(fileName)
  const type = allowedTypes.find((candidate) =>
    uploadFileDefinitions[candidate].extensions.includes(extension),
  )

  if (!type) {
    return { reason: 'extension', valid: false }
  }

  const definition = uploadFileDefinitions[type]

  if (mimeType.trim().toLowerCase() !== definition.mimeType) {
    return { reason: 'mime', valid: false }
  }

  if (!definition.signatureMatches(bytes)) {
    return { reason: 'signature', valid: false }
  }

  return {
    mimeType: definition.mimeType,
    type,
    valid: true,
  }
}

export function uploadValidationMessage(result: UploadFileValidationResult) {
  if (result.valid) {
    return ''
  }

  if (result.reason === 'extension') {
    return '지원하지 않는 파일 확장자입니다.'
  }

  if (result.reason === 'mime') {
    return '파일 확장자와 MIME 형식이 일치하지 않습니다.'
  }

  return '파일 내용이 선택한 형식과 일치하지 않습니다.'
}

function fileExtension(fileName: string) {
  const baseName = fileName.trim().toLowerCase().split(/[\\/]/).pop() ?? ''
  const extensionIndex = baseName.lastIndexOf('.')

  return extensionIndex > 0 ? baseName.slice(extensionIndex) : ''
}

function bytesStartWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((byte, index) => bytes[index] === byte)
}

function asciiAt(bytes: Uint8Array, offset: number, expected: string) {
  if (bytes.length < offset + expected.length) {
    return false
  }

  return Array.from(expected).every((character, index) =>
    bytes[offset + index] === character.charCodeAt(0),
  )
}

function asciiWithin(bytes: Uint8Array, expected: string, maxBytes: number) {
  const searchEnd = Math.min(bytes.length - expected.length, maxBytes)

  for (let offset = 0; offset <= searchEnd; offset += 1) {
    if (asciiAt(bytes, offset, expected)) {
      return true
    }
  }

  return false
}

function isAvif(bytes: Uint8Array) {
  if (!asciiAt(bytes, 4, 'ftyp')) {
    return false
  }

  const brandSearchEnd = Math.min(bytes.length - 3, 32)

  for (let offset = 8; offset < brandSearchEnd; offset += 4) {
    if (asciiAt(bytes, offset, 'avif') || asciiAt(bytes, offset, 'avis')) {
      return true
    }
  }

  return false
}

function isMp4(bytes: Uint8Array) {
  if (!asciiAt(bytes, 4, 'ftyp')) {
    return false
  }

  return ['avc1', 'dash', 'iso2', 'iso5', 'iso6', 'isom', 'M4V ', 'mp41', 'mp42', 'MSNV']
    .some((brand) => asciiWithin(bytes.subarray(8, 32), brand, 24))
}
