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

test('resolves legacy paths through the admin image preview route', () => {
  assert.equal(
    getTeacherImageSrc(
      '/legacy/profiles/baewoo/new_profile/761/3717534017_ZSaKudp3_5fb74faac49d8a8b33536df17551d9b0a8ec8b56.png',
      {},
    ),
    '/api/admin-images?key=legacy%2Fprofiles%2Fbaewoo%2Fnew_profile%2F761%2F3717534017_ZSaKudp3_5fb74faac49d8a8b33536df17551d9b0a8ec8b56.png',
  )
})

test('resolves legacy teacher image fallback paths through the admin image preview route', () => {
  assert.equal(
    getTeacherImageSrc('photo1.png', {
      sourceDb: 'baewoo',
      sourceId: 84,
      sourceTable: 'g5_teacher',
    }),
    '/api/admin-images?key=legacy%2Fteachers%2Fbaewoo%2Fg5_teacher%2F84%2Fphoto1.png',
  )
})
