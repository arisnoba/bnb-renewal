import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field, GlobalConfig } from 'payload'

import { Footer } from './config'

type NamedField = Field & {
  name: string
  admin?: {
    components?: {
      RowLabel?: unknown
    }
    initCollapsed?: boolean
  }
  fields?: Field[]
  labels?: unknown
  required?: unknown
}

function getField(global: GlobalConfig, fieldName: string) {
  const field = global.fields.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(field, `footer.${fieldName} 필드가 있어야 합니다.`)

  return field
}

function getNestedField(field: NamedField, fieldName: string) {
  const nestedField = field.fields?.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(nestedField, `footer.${field.name}.${fieldName} 필드가 있어야 합니다.`)

  return nestedField
}

test('footer center infos expose required center fields with row labels', () => {
  const field = getField(Footer, 'centerInfos')

  assert.equal(field.type, 'array')
  assert.deepEqual(field.labels, {
    plural: '센터 정보',
    singular: '센터 정보',
  })
  assert.equal(field.maxRows, 5)
  assert.equal(field.admin?.initCollapsed, true)
  assert.equal(field.admin?.components?.RowLabel, '@/Footer/RowLabel#CenterInfoRowLabel')

  for (const fieldName of [
    'centerName',
    'url',
    'operationRegistrationNumber',
    'address',
  ]) {
    assert.equal(getNestedField(field, fieldName).required, true)
  }
})
