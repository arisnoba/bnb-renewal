import assert from 'node:assert/strict'
import test from 'node:test'

import { Classrooms } from './Classrooms'

test('classroom settings use title and multi-upload photos', () => {
  const title = Classrooms.fields.find((field) => 'name' in field && field.name === 'title')
  const photos = Classrooms.fields.find((field) => 'name' in field && field.name === 'photos')

  assert.equal(Classrooms.slug, 'classrooms')
  assert.equal(Classrooms.admin?.group, '교육')
  assert.equal(Classrooms.admin?.useAsTitle, 'title')
  assert.ok(title)
  assert.ok(photos)

  assert.equal(title.type, 'text')
  assert.equal(title.label, '강의실명')
  assert.equal(photos.type, 'upload')
  assert.equal(photos.label, '강의실 사진')
  assert.equal(photos.relationTo, 'media')
  assert.equal(photos.hasMany, true)
})
