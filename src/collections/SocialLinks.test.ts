import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field } from 'payload'

import { SocialLinks } from './SocialLinks'

type NamedField = Field & {
  admin?: {
    components?: {
      Field?: unknown
    }
    condition?: (data: Record<string, unknown>, siblingData: Record<string, unknown>) => boolean
    description?: unknown
    hidden?: unknown
    position?: unknown
  }
  defaultValue?: unknown
  hasMany?: unknown
  label?: unknown
  name: string
  options?: unknown[]
  required?: unknown
  relationTo?: unknown
  validate?: (value: unknown, options: { siblingData?: Record<string, unknown> }) => unknown
}

function findNamedField(fields: Field[], fieldName: string): NamedField | undefined {
  for (const field of fields) {
    if ('name' in field && field.name === fieldName) {
      return field as NamedField
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nestedField = findNamedField(field.fields as Field[], fieldName)

      if (nestedField) {
        return nestedField
      }
    }
  }

  return undefined
}

function getField(collection: CollectionConfig, fieldName: string) {
  const field = findNamedField(collection.fields, fieldName)

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`)

  return field
}

test('social links are configured as center-scoped SNS content', () => {
  assert.equal(SocialLinks.slug, 'social-links')
  assert.equal(SocialLinks.labels?.plural, 'SNS 링크')
  assert.equal(SocialLinks.labels?.singular, 'SNS 링크')
  assert.equal(SocialLinks.admin?.group, '메인설정')
  assert.equal(SocialLinks.admin?.useAsTitle, 'title')
  assert.equal(SocialLinks.defaultSort, '-createdAt')
  assert.deepEqual(SocialLinks.admin?.defaultColumns, [
    'title',
    'center',
    'snsType',
    'externalUrl',
    'displayStatus',
    'createdAt',
    'updatedAt',
  ])
})

test('social links use a single center and image URL fallback fields', async () => {
  const center = getField(SocialLinks, 'center')
  const snsType = getField(SocialLinks, 'snsType')
  const externalUrl = getField(SocialLinks, 'externalUrl')
  const representativeImage = getField(SocialLinks, 'representativeImage')
  const displayStatus = getField(SocialLinks, 'displayStatus')
  const imagePreview = getField(SocialLinks, 'imagePreview')
  const fieldOrder = SocialLinks.fields
    .filter((field): field is NamedField => 'name' in field)
    .map((field) => field.name)

  assert.equal(center.type, 'select')
  assert.equal(center.label, '센터 선택')
  assert.equal(center.defaultValue, undefined)
  assert.equal(center.hasMany, undefined)
  assert.equal(center.required, true)
  assert.deepEqual(
    center.options?.map((option) =>
      option && typeof option === 'object' && 'value' in option ? option.value : undefined,
    ),
    ['art', 'exam', 'kids', 'highteen', 'avenue'],
  )
  assert.equal(await center.validate?.('', {}), '센터를 선택해야 합니다.')

  assert.equal(snsType.type, 'select')
  assert.equal(snsType.defaultValue, undefined)
  assert.equal(snsType.required, true)
  assert.deepEqual(
    snsType.options?.map((option) =>
      option && typeof option === 'object' && 'value' in option ? option.value : undefined,
    ),
    ['instagram', 'youtube'],
  )
  assert.equal(await snsType.validate?.('', {}), 'SNS 타입을 선택해야 합니다.')

  assert.equal(representativeImage.type, 'upload')
  assert.equal(representativeImage.relationTo, 'media')
  assert.equal(representativeImage.admin?.condition?.({}, {}), false)
  assert.equal(representativeImage.admin?.condition?.({}, { snsType: 'instagram' }), true)
  assert.equal(representativeImage.admin?.condition?.({}, { snsType: 'youtube' }), false)
  assert.equal(
    await representativeImage.validate?.(null, {
      siblingData: {
        externalUrl: 'https://www.instagram.com/p/example/',
        snsType: 'instagram',
      },
    }),
    '대표 이미지를 등록해야 합니다.',
  )
  assert.equal(
    await representativeImage.validate?.(null, {
      siblingData: {
        externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        snsType: 'youtube',
      },
    }),
    true,
  )
  assert.equal(
    await representativeImage.validate?.(1, {
      siblingData: {
        externalUrl: 'https://www.instagram.com/p/example/',
        snsType: 'instagram',
      },
    }),
    true,
  )

  assert.equal(await externalUrl.validate?.('', {}), 'SNS 링크를 입력해야 합니다.')
  assert.equal(externalUrl.required, true)
  assert.equal(externalUrl.admin?.condition?.({}, {}), false)
  assert.equal(externalUrl.admin?.condition?.({}, { snsType: 'instagram' }), true)
  assert.equal(externalUrl.admin?.condition?.({}, { snsType: 'youtube' }), true)
  assert.equal(await externalUrl.validate?.('/instagram', {}), 'http:// 또는 https:// URL만 입력할 수 있습니다.')
  assert.equal(await externalUrl.validate?.('ftp://example.com', {}), 'http:// 또는 https:// URL만 입력할 수 있습니다.')
  assert.equal(
    await externalUrl.validate?.('https://www.instagram.com/baewoo', {
      siblingData: { snsType: 'instagram' },
    }),
    true,
  )
  assert.equal(
    await externalUrl.validate?.('http://www.youtube.com/@baewoo', {
      siblingData: { snsType: 'youtube' },
    }),
    '유효한 유튜브 링크를 입력해야 합니다.',
  )
  assert.equal(
    await externalUrl.validate?.('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      siblingData: { snsType: 'youtube' },
    }),
    true,
  )

  assert.equal(fieldOrder.includes('externalUrl'), true)

  assert.equal(displayStatus.type, 'select')
  assert.equal(displayStatus.defaultValue, 'published')
  assert.equal(displayStatus.admin?.position, 'sidebar')

  assert.equal(imagePreview.type, 'ui')
  assert.equal(imagePreview.admin?.position, 'sidebar')
  assert.equal(
    imagePreview.admin?.components?.Field,
    '@/components/payload/SocialLinkImagePreviewField#SocialLinkImagePreviewField',
  )
})

test('social links normalize explicit SNS type before validation', async () => {
  const hook = SocialLinks.hooks?.beforeValidate?.[0]

  assert.ok(hook, 'beforeValidate hook이 있어야 합니다.')

  const normalized = await hook({
    collection: SocialLinks,
    context: {},
    data: {
      center: 'art',
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      snsType: 'youtube',
    },
    global: null,
    operation: 'create',
    originalDoc: null,
    req: {
      user: null,
    },
  } as never)

  assert.equal(normalized?.snsType, 'youtube')
  assert.equal(normalized?.displayStatus, 'published')
})

test('social links do not infer missing SNS type before validation', async () => {
  const hook = SocialLinks.hooks?.beforeValidate?.[0]

  assert.ok(hook, 'beforeValidate hook이 있어야 합니다.')

  const normalized = await hook({
    collection: SocialLinks,
    context: {},
    data: {
      center: 'art',
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    global: null,
    operation: 'create',
    originalDoc: null,
    req: {
      user: null,
    },
  } as never)

  assert.equal(normalized?.snsType, '')
})
