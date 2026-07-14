import assert from 'node:assert/strict'
import test from 'node:test'

import { MEDIA_UPLOAD_MIME_TYPES } from '@/lib/uploadFileValidation'

import { Media } from './Media'

test('media upload uses prefix and filename as the duplicate boundary', () => {
  assert.equal(typeof Media.upload, 'object')

  if (typeof Media.upload !== 'object') {
    return
  }

  assert.deepEqual(Media.upload.filenameCompoundIndex, ['prefix', 'filename'])
  assert.deepEqual(Media.upload.mimeTypes, [...MEDIA_UPLOAD_MIME_TYPES])
})

test('media upload hook rejects SVG and accepts a matching PNG signature', async () => {
  const hook = Media.hooks?.beforeValidate?.[0]

  assert.equal(typeof hook, 'function')

  if (typeof hook !== 'function') {
    return
  }

  const request = (file: { data: Buffer; mimetype: string; name: string }) => ({
    context: {},
    file: {
      ...file,
      size: file.data.length,
    },
  })

  await assert.rejects(
    hook({
      req: request({
        data: Buffer.from('<svg></svg>'),
        mimetype: 'image/svg+xml',
        name: 'image.svg',
      }),
    } as never),
    /지원하지 않는 파일 확장자/,
  )

  await assert.doesNotReject(
    hook({
      req: request({
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        mimetype: 'image/png',
        name: 'image.png',
      }),
    } as never),
  )
})
