import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field } from 'payload'

import { Inquiries } from './Inquiries'

type NamedField = Field & {
  name: string
  options?: unknown[]
}

function getField(collection: CollectionConfig, fieldName: string) {
  const field = collection.fields.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`)

  return field
}

function optionValues(field: NamedField) {
  return field.options?.map((option) =>
    option && typeof option === 'object' && 'value' in option ? option.value : undefined,
  )
}

test('inquiry center-facing options keep the requested center order', () => {
  assert.deepEqual(optionValues(getField(Inquiries, 'inquiryType')), [
    'art',
    'admission',
    'kids',
    'highteen',
    'avenue',
    'partnership',
  ])
  assert.deepEqual(optionValues(getField(Inquiries, 'center')), [
    'art',
    'exam',
    'kids',
    'highteen',
    'avenue',
  ])
})
