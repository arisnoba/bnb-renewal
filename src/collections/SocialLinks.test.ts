import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field } from 'payload'

import { SocialLinks } from './SocialLinks'

type NamedField = Field & {
  admin?: {
    components?: {
      Field?: unknown
    }
    description?: unknown
    position?: unknown
  }
  defaultValue?: unknown
  hasMany?: unknown
  label?: unknown
  name: string
  options?: unknown[]
  relationTo?: unknown
  validate?: (value: unknown, options: { siblingData?: Record<string, unknown> }) => unknown
}

function getField(collection: CollectionConfig, fieldName: string) {
  const field = collection.fields.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

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
    'representativeImageUrl',
    'externalUrl',
    'displayStatus',
    'createdAt',
    'updatedAt',
  ])
})

test('social links use a single center and image URL fallback fields', async () => {
  const center = getField(SocialLinks, 'center')
  const externalUrl = getField(SocialLinks, 'externalUrl')
  const representativeImage = getField(SocialLinks, 'representativeImage')
  const representativeImageUrl = getField(SocialLinks, 'representativeImageUrl')
  const displayStatus = getField(SocialLinks, 'displayStatus')
  const imagePreview = getField(SocialLinks, 'imagePreview')
  const fieldOrder = SocialLinks.fields
    .filter((field): field is NamedField => 'name' in field)
    .map((field) => field.name)

  assert.equal(center.type, 'select')
  assert.equal(center.hasMany, undefined)
  assert.deepEqual(
    center.options?.map((option) =>
      option && typeof option === 'object' && 'value' in option ? option.value : undefined,
    ),
    ['art', 'exam', 'kids', 'highteen', 'avenue'],
  )
  assert.equal(await center.validate?.('', {}), '센터를 선택해야 합니다.')

  assert.ok(
    fieldOrder.indexOf('externalUrl') < fieldOrder.indexOf('representativeImage'),
    '외부 링크가 대표 이미지보다 먼저 배치되어야 합니다.',
  )

  assert.equal(representativeImage.type, 'upload')
  assert.equal(representativeImage.relationTo, 'media')
  assert.equal(
    await representativeImage.validate?.(null, {
      siblingData: {
        externalUrl: 'https://www.instagram.com/p/example/',
        representativeImageUrl: '',
      },
    }),
    '대표 이미지를 업로드하거나 대표 이미지 URL을 입력해야 합니다.',
  )
  assert.equal(
    await representativeImage.validate?.(null, {
      siblingData: {
        externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        representativeImageUrl: '',
      },
    }),
    true,
  )
  assert.equal(
    await representativeImage.validate?.(null, {
      siblingData: {
        externalUrl: 'https://www.instagram.com/p/example/',
        representativeImageUrl: 'https://cdn.example.com/social.jpg',
      },
    }),
    true,
  )

  assert.equal(representativeImageUrl.type, 'text')
  assert.equal(await representativeImageUrl.validate?.('', { siblingData: {} }), '대표 이미지를 업로드하거나 대표 이미지 URL을 입력해야 합니다.')
  assert.equal(
    await representativeImageUrl.validate?.('ftp://example.com/social.jpg', {
      siblingData: {},
    }),
    'http:// 또는 https:// URL만 입력할 수 있습니다.',
  )
  assert.equal(
    await representativeImageUrl.validate?.('', {
      siblingData: {
        externalUrl: 'https://youtu.be/dQw4w9WgXcQ',
      },
    }),
    true,
  )
  assert.match(
    String(representativeImageUrl.admin?.description ?? ''),
    /인스타그램 게시물 URL에서는 이미지를 안정적으로 가져오기 어려우므로/,
  )

  assert.equal(await externalUrl.validate?.('', {}), '외부 링크를 입력해야 합니다.')
  assert.equal(await externalUrl.validate?.('/instagram', {}), 'http:// 또는 https:// URL만 입력할 수 있습니다.')
  assert.equal(await externalUrl.validate?.('ftp://example.com', {}), 'http:// 또는 https:// URL만 입력할 수 있습니다.')
  assert.equal(await externalUrl.validate?.('https://www.instagram.com/baewoo', {}), true)
  assert.equal(await externalUrl.validate?.('http://www.youtube.com/@baewoo', {}), true)

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

test('social links auto-fill YouTube thumbnail URL before validation', async () => {
  const hook = SocialLinks.hooks?.beforeValidate?.[0]

  assert.ok(hook, 'beforeValidate hook이 있어야 합니다.')

  const normalized = await hook({
    collection: SocialLinks,
    context: {},
    data: {
      center: 'art',
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      representativeImageUrl: '',
    },
    global: null,
    operation: 'create',
    originalDoc: null,
    req: {
      user: null,
    },
  } as never)

  assert.equal(
    normalized?.representativeImageUrl,
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  )
  assert.equal(normalized?.displayStatus, 'published')
})
