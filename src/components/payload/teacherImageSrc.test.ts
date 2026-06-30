import assert from 'node:assert/strict'
import test from 'node:test'

import { getTeacherImageSrc } from './teacherImageSrc'

test('resolves stored R2 media object keys through the admin image preview route', () => {
  assert.equal(
    getTeacherImageSrc('media/teachers/gallery-images/84/teacher-gallery-image-84-photo1.png', {}),
    '/api/admin-images?key=media%2Fteachers%2Fgallery-images%2F84%2Fteacher-gallery-image-84-photo1.png',
  )
})

test('resolves slash-prefixed R2 media paths through the admin image preview route', () => {
  assert.equal(
    getTeacherImageSrc('/media/teachers/gallery-images/84/teacher gallery photo.png', {}),
    '/api/admin-images?key=media%2Fteachers%2Fgallery-images%2F84%2Fteacher%20gallery%20photo.png',
  )
})

test('preserves existing API media URLs', () => {
  assert.equal(
    getTeacherImageSrc('/api/media/file/image.png?prefix=media%2Fteachers', {}),
    '/api/media/file/image.png?prefix=media%2Fteachers',
  )
})

test('keeps legacy teacher image fallback behavior', () => {
  assert.equal(
    getTeacherImageSrc('photo1.png', {
      sourceDb: 'baewoo',
      sourceId: 84,
      sourceTable: 'g5_teacher',
    }),
    '/legacy/teachers/baewoo/g5_teacher/84/photo1.png',
  )
})
