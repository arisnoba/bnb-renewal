import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONSULT_ATTACHMENT_UPLOAD_TYPES,
  IMAGE_UPLOAD_TYPES,
  MEDIA_UPLOAD_TYPES,
  uploadValidationMessage,
  validateUploadedFile,
} from './uploadFileValidation'

const bytes = (...values: number[]) => Uint8Array.from(values)
const ascii = (value: string) => Uint8Array.from(Buffer.from(value, 'ascii'))

const validFiles = [
  {
    bytes: bytes(0xff, 0xd8, 0xff, 0xe0),
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
    type: 'jpeg',
  },
  {
    bytes: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    fileName: 'photo.png',
    mimeType: 'image/png',
    type: 'png',
  },
  {
    bytes: ascii('GIF89a'),
    fileName: 'animation.gif',
    mimeType: 'image/gif',
    type: 'gif',
  },
  {
    bytes: ascii('RIFF0000WEBP'),
    fileName: 'photo.webp',
    mimeType: 'image/webp',
    type: 'webp',
  },
  {
    bytes: bytes(0, 0, 0, 24, ...Buffer.from('ftypavif', 'ascii')),
    fileName: 'photo.avif',
    mimeType: 'image/avif',
    type: 'avif',
  },
] as const

for (const file of validFiles) {
  test(`${file.type} 이미지의 확장자, MIME, 시그니처가 일치하면 허용한다`, () => {
    assert.deepEqual(
      validateUploadedFile({
        allowedTypes: IMAGE_UPLOAD_TYPES,
        bytes: file.bytes,
        fileName: file.fileName,
        mimeType: file.mimeType,
      }),
      {
        mimeType: file.mimeType,
        type: file.type,
        valid: true,
      },
    )
  })
}

test('PDF의 확장자, MIME, 시그니처가 일치하면 상담 첨부로 허용한다', () => {
  assert.deepEqual(
    validateUploadedFile({
      allowedTypes: CONSULT_ATTACHMENT_UPLOAD_TYPES,
      bytes: ascii('%PDF-1.7'),
      fileName: 'proposal.pdf',
      mimeType: 'application/pdf',
    }),
    {
      mimeType: 'application/pdf',
      type: 'pdf',
      valid: true,
    },
  )
})

test('MP4와 WebM은 기존 메인 배너 영상 업로드를 위해 시그니처까지 검사한다', () => {
  const videos = [
    {
      bytes: bytes(0, 0, 0, 24, ...Buffer.from('ftypmp42', 'ascii')),
      fileName: 'banner.mp4',
      mimeType: 'video/mp4',
      type: 'mp4',
    },
    {
      bytes: bytes(0x1a, 0x45, 0xdf, 0xa3, ...Buffer.from('webm', 'ascii')),
      fileName: 'banner.webm',
      mimeType: 'video/webm',
      type: 'webm',
    },
  ] as const

  for (const video of videos) {
    assert.deepEqual(
      validateUploadedFile({
        allowedTypes: MEDIA_UPLOAD_TYPES,
        bytes: video.bytes,
        fileName: video.fileName,
        mimeType: video.mimeType,
      }),
      {
        mimeType: video.mimeType,
        type: video.type,
        valid: true,
      },
    )
  }
})

test('SVG와 Word 문서는 허용 목록에서 거부한다', () => {
  for (const file of [
    { fileName: 'image.svg', mimeType: 'image/svg+xml' },
    { fileName: 'proposal.doc', mimeType: 'application/msword' },
    {
      fileName: 'proposal.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  ]) {
    const result = validateUploadedFile({
      allowedTypes: [...IMAGE_UPLOAD_TYPES, ...CONSULT_ATTACHMENT_UPLOAD_TYPES],
      bytes: ascii('<svg></svg>'),
      ...file,
    })

    assert.deepEqual(result, { reason: 'extension', valid: false })
  }
})

test('확장자와 MIME이 다르면 거부한다', () => {
  const result = validateUploadedFile({
    allowedTypes: IMAGE_UPLOAD_TYPES,
    bytes: bytes(0xff, 0xd8, 0xff),
    fileName: 'photo.jpg',
    mimeType: 'image/png',
  })

  assert.deepEqual(result, { reason: 'mime', valid: false })
  assert.equal(uploadValidationMessage(result), '파일 확장자와 MIME 형식이 일치하지 않습니다.')
})

test('확장자와 MIME이 맞아도 시그니처가 다르면 거부한다', () => {
  const result = validateUploadedFile({
    allowedTypes: CONSULT_ATTACHMENT_UPLOAD_TYPES,
    bytes: ascii('<script>alert(1)</script>'),
    fileName: 'proposal.pdf',
    mimeType: 'application/pdf',
  })

  assert.deepEqual(result, { reason: 'signature', valid: false })
  assert.equal(uploadValidationMessage(result), '파일 내용이 선택한 형식과 일치하지 않습니다.')
})
