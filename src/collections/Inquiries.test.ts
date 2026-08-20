import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field, Validate } from 'payload'

import { appendConsultationHistory, Inquiries, setDerivedInquiryFields } from './Inquiries'

type NamedField = Field & {
  name: string
  options?: unknown[]
  validate?: Validate
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

test('inquiry statuses use consultation labels without changing stored values', () => {
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

  const completedOption = status.options?.find(
    (option) =>
      option && typeof option === 'object' && 'value' in option && option.value === 'completed',
  )

  assert.deepEqual(completedOption, {
    label: '상담 완료',
    value: 'completed',
  })

  const spamOption = status.options?.find(
    (option) =>
      option && typeof option === 'object' && 'value' in option && option.value === 'spam',
  )

  assert.deepEqual(spamOption, {
    label: '상담 취소',
    value: 'spam',
  })
})

test('confirmed consultation date uses a date-time picker and stays hidden for partnerships', () => {
  const scheduledAt = getField(Inquiries, 'scheduledAt')

  assert.equal(scheduledAt.type, 'date')
  assert.equal(scheduledAt.label, '확정 상담 일시')
  assert.deepEqual(scheduledAt.admin?.date, {
    displayFormat: 'yyyy-MM-dd HH:mm',
    pickerAppearance: 'dayAndTime',
  })
  assert.equal(scheduledAt.admin?.position, 'sidebar')
  assert.equal(scheduledAt.admin?.condition?.({}, { inquiryType: 'art' } as never, {} as never), true)
  assert.equal(
    scheduledAt.admin?.condition?.({}, { inquiryType: 'partnership' } as never, {} as never),
    false,
  )
})

test('reservation status requires a confirmed date on submit while preserving existing values', async () => {
  const status = getField(Inquiries, 'status')
  const scheduledAt = getField(Inquiries, 'scheduledAt')

  assert.equal(
    await status.validate?.('inProgress', {
      event: 'submit',
      previousValue: 'new',
      siblingData: { inquiryType: 'art' },
    } as never),
    '예약 완료 또는 상담 완료로 변경하려면 확정 상담 일시를 입력해야 합니다.',
  )
  assert.equal(
    await status.validate?.('inProgress', {
      event: 'submit',
      previousValue: 'new',
      siblingData: { inquiryType: 'art', scheduledAt: '2026-08-21T06:00:00.000Z' },
    } as never),
    true,
  )
  assert.equal(
    await status.validate?.('completed', {
      event: 'submit',
      previousValue: 'inProgress',
      siblingData: { inquiryType: 'art' },
    } as never),
    true,
  )
  assert.equal(
    await scheduledAt.validate?.(null, {
      event: 'submit',
      previousValue: '2026-08-21T06:00:00.000Z',
      siblingData: { status: 'inProgress' },
    } as never),
    '예약 완료 또는 상담 완료 상태에서는 확정 상담 일시를 비울 수 없습니다.',
  )
})

test('consultation updates append one protected history entry with the acting admin', async () => {
  const result = await appendConsultationHistory({
    data: {
      consultationHistory: [{ action: 'statusChanged', changedBy: '조작된 값' }],
      scheduledAt: '2026-08-21T06:00:00.000Z',
      status: 'inProgress',
    },
    operation: 'update',
    originalDoc: {
      consultationHistory: [],
      inquiryType: 'art',
      scheduledAt: null,
      status: 'new',
    },
    req: {
      user: { email: 'manager@example.com', id: 7, name: '로컬 관리자' },
    },
  } as never)

  const history = (result as { consultationHistory?: Record<string, unknown>[] })
    .consultationHistory

  assert.equal(history?.length, 1)
  assert.deepEqual(
    history?.map(({ action, changedBy, changedById, fromStatus, toScheduledAt, toStatus }) => ({
      action,
      changedBy,
      changedById,
      fromStatus,
      toScheduledAt,
      toStatus,
    })),
    [
      {
        action: 'reservationConfirmed',
        changedBy: '로컬 관리자',
        changedById: '7',
        fromStatus: 'new',
        toScheduledAt: '2026-08-21T06:00:00.000Z',
        toStatus: 'inProgress',
      },
    ],
  )
  assert.match(String(history?.[0]?.changedAt), /^\d{4}-\d{2}-\d{2}T/)
})

test('unchanged consultation values preserve existing history without adding duplicates', async () => {
  const existingHistory = [
    {
      action: 'reservationConfirmed',
      changedAt: '2026-08-19T05:00:00.000Z',
      changedBy: '로컬 관리자',
    },
  ]
  const result = await appendConsultationHistory({
    data: {
      consultationHistory: [],
      memo: '통화 완료',
    },
    operation: 'update',
    originalDoc: {
      consultationHistory: existingHistory,
      inquiryType: 'art',
      scheduledAt: '2026-08-21T06:00:00.000Z',
      status: 'inProgress',
    },
    req: { user: { id: 7, name: '로컬 관리자' } },
  } as never)

  assert.deepEqual(
    (result as { consultationHistory?: unknown[] }).consultationHistory,
    existingHistory,
  )
})

test('partial inquiry updates preserve derived center and title values', async () => {
  const result = await setDerivedInquiryFields({
    data: { scheduledAt: '2026-08-21T06:00:00.000Z', status: 'inProgress' },
    operation: 'update',
    originalDoc: {
      applicantName: '김하늘',
      guardianPhone: '01012345678',
      inquiryType: 'kids',
    },
  } as never)

  assert.deepEqual(
    {
      center: (result as Record<string, unknown>).center,
      displayName: (result as Record<string, unknown>).displayName,
      primaryPhone: (result as Record<string, unknown>).primaryPhone,
    },
    {
      center: 'kids',
      displayName: '김하늘',
      primaryPhone: '01012345678',
    },
  )
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
