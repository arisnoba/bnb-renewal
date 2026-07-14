import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import { resolveAdminImageDeletionTarget } from './adminImageDeletionTarget'

const r2Config = {
  bucket: 'test-bucket',
  publicBaseUrl: 'https://media.example.com',
}

test('admin-images R2 key와 공개 URL만 삭제 대상으로 허용한다', () => {
  assert.deepEqual(
    resolveAdminImageDeletionTarget('admin-images/2026/07/image.jpg', r2Config),
    {
      key: 'admin-images/2026/07/image.jpg',
      kind: 'r2',
    },
  )
  assert.deepEqual(
    resolveAdminImageDeletionTarget(
      'https://media.example.com/admin-images/2026/07/image.jpg',
      r2Config,
    ),
    {
      key: 'admin-images/2026/07/image.jpg',
      kind: 'r2',
    },
  )
})

test('같은 R2의 다른 prefix와 다른 origin은 삭제 대상으로 허용하지 않는다', () => {
  assert.equal(
    resolveAdminImageDeletionTarget('https://media.example.com/media/site-logo.png', r2Config),
    null,
  )
  assert.equal(
    resolveAdminImageDeletionTarget(
      'https://media.example.com/inquiries/attachments/private.pdf',
      r2Config,
    ),
    null,
  )
  assert.equal(
    resolveAdminImageDeletionTarget(
      'https://untrusted.example.com/admin-images/2026/07/image.jpg',
      r2Config,
    ),
    null,
  )
  assert.equal(resolveAdminImageDeletionTarget('admin-images/../media/site-logo.png', r2Config), null)
})

test('기존 로컬 admin-images 경로는 전용 업로드 루트 안에서만 허용한다', () => {
  assert.deepEqual(
    resolveAdminImageDeletionTarget('/uploads/admin-images/2026/07/image.jpg', r2Config),
    {
      kind: 'local',
      path: path.resolve(process.cwd(), 'public/uploads/admin-images/2026/07/image.jpg'),
    },
  )
  assert.equal(
    resolveAdminImageDeletionTarget('/uploads/admin-images/../../outside.jpg', r2Config),
    null,
  )
})
