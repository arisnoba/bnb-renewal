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

test('inquiry public form options stay aligned with storage select values', () => {
  assert.deepEqual(optionValues(getField(Inquiries, 'preferredTime')), [
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ])
  assert.deepEqual(optionValues(getField(Inquiries, 'inflowSource')), [
    '포털 사이트(구글, 네이버)',
    'SNS(인스타그램, 스레드 등)',
    '유튜브',
    '네이버카페',
    '지인소개',
    'AI(GPT, gemini, claude)',
    '기타',
  ])
})

test('in-progress inquiries use the reservation-complete label without changing stored values', () => {
  const status = getField(Inquiries, 'status')
  const inProgressOption = status.options?.find(
    (option) =>
      option &&
      typeof option === 'object' &&
      'value' in option &&
      option.value === 'inProgress',
  )

  assert.deepEqual(inProgressOption, {
    label: '예약 완료',
    value: 'inProgress',
  })
})

test('inquiry access remains global for masters and center-scoped for other admins', async () => {
  const read = Inquiries.access?.read
  const update = Inquiries.access?.update

  assert.equal(await read?.({ req: { user: undefined } } as never), false)
  assert.equal(await update?.({ req: { user: { role: 'master' } } } as never), true)

  for (const access of [read, update]) {
    assert.deepEqual(
      await access?.({ req: { user: { center: 'kids', role: 'manager' } } } as never),
      {
        center: {
          equals: 'kids',
        },
      },
    )
  }
})

test('inquiry edits use the list-redirecting save button', () => {
  assert.equal(
    Inquiries.admin?.components?.edit?.SaveButton,
    '@/components/payload/InquirySaveButton#InquirySaveButton',
  )
})
