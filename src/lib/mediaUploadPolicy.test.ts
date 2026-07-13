import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADMIN_IMAGE_UPLOAD_LIMIT_BYTES,
  ADMIN_IMAGE_UPLOAD_LIMIT_MESSAGE,
  adminImageUploadSizeError,
  assertAdminImageUploadSize,
} from './mediaUploadPolicy'

test('admin image upload policy rejects images over 2MB', () => {
  assert.equal(
    adminImageUploadSizeError({
      mimetype: 'image/jpeg',
      size: ADMIN_IMAGE_UPLOAD_LIMIT_BYTES + 1,
    }),
    ADMIN_IMAGE_UPLOAD_LIMIT_MESSAGE,
  )
  assert.throws(
    () =>
      assertAdminImageUploadSize({
        mimetype: 'image/png',
        size: ADMIN_IMAGE_UPLOAD_LIMIT_BYTES + 1,
      }),
    /2MB/,
  )
})

test('admin image upload policy allows non-image files over 2MB', () => {
  assert.equal(
    adminImageUploadSizeError({
      mimetype: 'video/mp4',
      size: ADMIN_IMAGE_UPLOAD_LIMIT_BYTES * 20,
    }),
    '',
  )
})
