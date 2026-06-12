import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field } from 'payload'

import { ArtistPress } from './ArtistPress'
import { ArtistPressAgencies } from './ArtistPressAgencies'
import { AuditionSchedules } from './AuditionSchedules'
import { BroadcastStations } from './BroadcastStations'
import { DirectCastings } from './DirectCastings'
import { ExamResults } from './ExamResults'
import { Faqs } from './Faqs'
import { ScreenAppearances } from './ScreenAppearances'
import { StarCards } from './StarCards'

type FieldWithName = Field & {
  admin?: {
    className?: string
    components?: {
      Field?: unknown
    }
    condition?: (data: Record<string, unknown>, siblingData: Record<string, unknown>) => boolean
    description?: string
    placeholder?: string
  }
  defaultValue?: unknown
  fields?: Field[]
  label?: unknown
  labels?: unknown
  minRows?: number
  name: string
  options?: unknown
  relationTo?: unknown
  required?: boolean
  validate?: (
    value: unknown,
    options?: {
      operation?: string
      previousValue?: unknown
      req?: { url?: string }
      siblingData?: Record<string, unknown>
    },
  ) => unknown
}

function isNamedField(field: Field, name: string): field is FieldWithName {
  return 'name' in field && field.name === name
}

function fieldNames(fields: Field[]) {
  return fields.flatMap((field) => {
    if (field.type === 'row') {
      return field.fields.flatMap((rowField) =>
        'name' in rowField ? [rowField.name] : [],
      )
    }

    return 'name' in field ? [field.name] : []
  })
}

function findFieldDeep(fields: Field[], name: string): FieldWithName | undefined {
  for (const field of fields) {
    if (isNamedField(field, name)) {
      return field
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findFieldDeep(field.fields, name)

      if (nested) {
        return nested
      }
    }

    if (field.type === 'tabs') {
      const nested = findFieldDeep(
        field.tabs.flatMap((tab) => tab.fields),
        name,
      )

      if (nested) {
        return nested
      }
    }
  }

  return undefined
}

function getField(collection: CollectionConfig, name: string) {
  const field = findFieldDeep(collection.fields, name)

  assert.ok(field, `${collection.slug}.${name} 필드가 있어야 합니다.`)

  return field
}

function validationOptions(
  overrides: {
    operation?: string
    previousValue?: unknown
    req?: { url?: string }
    siblingData?: Record<string, unknown>
  } = {},
) {
  return {
    operation: 'update',
    previousValue: undefined,
    req: {
      url: 'http://localhost:3000/api/test/1',
    },
    siblingData: {},
    ...overrides,
  }
}

test('audition schedules use selectable event type and copy start date in the admin field', async () => {
  const eventType = getField(AuditionSchedules, 'eventType')
  const startDate = getField(AuditionSchedules, 'scheduleStartDate')

  assert.equal(eventType.defaultValue, undefined)
  assert.equal(eventType.admin?.placeholder, '선택해 주세요')
  assert.equal(eventType.admin?.className, 'bnb-admin-required-field')
  assert.equal(await eventType.validate?.('', validationOptions()), '일정 유형을 선택해야 합니다.')
  assert.equal(
    startDate.admin?.components?.Field,
    '@/components/payload/AuditionScheduleStartDateField#AuditionScheduleStartDateField',
  )
})

test('admin validation todo fields use field-level validation', async () => {
  const directCastingCenters = getField(DirectCastings, 'centers')
  const screenAppearanceCenters = getField(ScreenAppearances, 'centers')
  const artistPressAgency = getField(ArtistPress, 'agency')
  const agencyLogo = getField(ArtistPressAgencies, 'logoMedia')
  const broadcastStationLogo = getField(BroadcastStations, 'logoMedia')

  assert.equal(await directCastingCenters.validate?.([], validationOptions()), '노출 센터를 선택해야 합니다.')
  assert.equal(directCastingCenters.admin?.className, 'bnb-admin-required-field')
  assert.equal(await screenAppearanceCenters.validate?.('', validationOptions()), '센터를 선택해야 합니다.')
  assert.equal(screenAppearanceCenters.admin?.className, 'bnb-admin-required-field')
  assert.equal(await artistPressAgency.validate?.(null, validationOptions()), '소속사를 선택해야 합니다.')
  assert.equal(artistPressAgency.admin?.className, 'bnb-admin-required-field')
  assert.equal(await agencyLogo.validate?.(null, validationOptions()), '소속사 로고 이미지를 선택해야 합니다.')
  assert.equal(agencyLogo.admin?.className, 'bnb-admin-required-field')
  assert.equal(await broadcastStationLogo.validate?.(null, validationOptions()), '방송사 로고 이미지를 선택해야 합니다.')
  assert.equal(broadcastStationLogo.admin?.className, 'bnb-admin-required-field')
})

test('exam results use representative image label', () => {
  const thumbnailPath = getField(ExamResults, 'thumbnailPath')

  assert.equal(thumbnailPath.label, '대표 이미지')
})

test('faqs place centers below question and limit center-specific answers', async () => {
  const category = getField(Faqs, 'category')
  const centers = getField(Faqs, 'centers')
  const answerMode = getField(Faqs, 'answerMode')
  const sharedAnswer = getField(Faqs, 'sharedAnswer')
  const variants = getField(Faqs, 'variants')
  const answer = getField(Faqs, 'answer')
  const displayStatus = getField(Faqs, 'displayStatus')

  assert.deepEqual(fieldNames(Faqs.fields.slice(0, 3)), ['title', 'centers', 'category', 'answerMode'])
  assert.equal(centers.admin?.className, undefined)
  assert.deepEqual(answerMode.options, [
    { label: '단일 답변', value: 'shared' },
    { label: '센터별 답변', value: 'centerVariants' },
  ])
  assert.equal(answerMode.admin?.condition?.({}, { centers: ['art'] }), false)
  assert.equal(answerMode.admin?.condition?.({}, { centers: ['art', 'exam'] }), true)
  assert.equal(sharedAnswer.label, '단일 답변')
  assert.match(String(sharedAnswer.admin?.description), /\[수강료 안내 바로가기\]\(\/art#admission\)/)
  assert.match(String(answer.admin?.description), /\[수강료 안내 바로가기\]\(\/art#admission\)/)
  assert.equal(sharedAnswer.admin?.condition?.({}, { answerMode: 'centerVariants', centers: ['art'] }), true)
  assert.equal(variants.admin?.condition?.({}, { answerMode: 'centerVariants', centers: ['art'] }), false)
  assert.equal(await category.validate?.('', validationOptions()), '분류를 선택해야 합니다.')
  assert.equal(category.admin?.className, 'bnb-admin-required-field')
  assert.equal(displayStatus.defaultValue, 'published')
})

test('faq bulk edits ignore unchanged legacy-invalid category', async () => {
  const bulkOptions = {
    operation: 'update',
    previousValue: '',
    req: {
      url: 'http://localhost:3000/api/faqs?where[id][in][0]=1',
    },
  }
  const category = getField(Faqs, 'category')

  assert.equal(await category.validate?.('', bulkOptions), true)
  assert.equal(
    await category.validate?.('', {
      ...bulkOptions,
      previousValue: 'etc',
    }),
    '분류를 선택해야 합니다.',
  )
})

test('faq bulk edits do not clear existing centers with empty transient form values', async () => {
  const hooks = Faqs.hooks?.beforeValidate ?? []
  let data: Record<string, unknown> | undefined = {
    centers: [],
    displayStatus: 'published',
  }
  const originalDoc = {
    answerMode: 'centerVariants',
    centers: ['art', 'exam'],
    displayStatus: 'draft',
    id: 1,
    sharedAnswer: '',
    variants: [{ answer: '아트 답변', centerArt: true }],
  }
  const req = {
    url: 'http://localhost:3000/api/faqs?where[id][in][0]=1',
    user: {
      role: 'admin',
    },
  }

  for (const hook of hooks) {
    data = await hook({
      collection: Faqs,
      context: {},
      data,
      operation: 'update',
      originalDoc,
      req,
    } as never)
  }

  assert.deepEqual(data?.centers, ['art', 'exam'])
  assert.equal(data?.answerMode, 'centerVariants')
})

test('star cards require at least one image and default centers to all', async () => {
  const bodyImages = getField(StarCards, 'bodyImages')
  const category = getField(StarCards, 'category')
  const imageMedia = getField(StarCards, 'imageMedia')
  const centers = getField(StarCards, 'centers')

  assert.equal(bodyImages.minRows, 1)
  assert.deepEqual(
    (category.options as { value: string }[]).map((option) => option.value),
    ['health', 'profile', 'medical', 'hairMakeup', 'beauty', 'cafe'],
  )
  assert.equal(await category.validate?.('', validationOptions()), '분류를 선택해야 합니다.')
  assert.equal(category.admin?.className, 'bnb-admin-required-field')
  assert.equal(await bodyImages.validate?.([], validationOptions()), '이미지를 하나 이상 등록해야 합니다.')
  assert.equal(await imageMedia.validate?.(null, validationOptions()), '이미지를 선택해야 합니다.')
  assert.equal(imageMedia.admin?.className, 'bnb-admin-required-field')
  assert.deepEqual(centers.defaultValue, ['all'])
})
