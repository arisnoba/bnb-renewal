import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field, GlobalConfig } from 'payload'

import { Footer, restrictCenterFooterUpdates } from './config'

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
  validate?: (value: unknown, options: Record<string, unknown>) => unknown
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

  assert.equal(Footer.label, '센터 정보')
  assert.equal(typeof Footer.access?.update, 'function')
  assert.equal(Footer.hooks?.beforeChange?.includes(restrictCenterFooterUpdates), true)
  assert.equal(Footer.fields.some((item) => 'name' in item && item.name === 'navItems'), false)
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

  for (const fieldName of ['youtubeUrl', 'naverBlogUrl', 'instagramUrl']) {
    const socialField = getNestedField(field, fieldName)

    assert.equal(socialField.type, 'text')
    assert.equal(socialField.required, undefined)
  }
})

test('footer center sns fields validate optional http URLs', async () => {
  const field = getField(Footer, 'centerInfos')
  const youtubeUrl = getNestedField(field, 'youtubeUrl')

  assert.equal(await youtubeUrl.validate?.('', {}), true)
  assert.equal(await youtubeUrl.validate?.('https://www.youtube.com/@bnb', {}), true)
  assert.equal(await youtubeUrl.validate?.('/youtube', {}), 'http:// 또는 https:// URL만 입력할 수 있습니다.')
})

test('footer update access allows global admins and center managers only', async () => {
  const updateAccess = Footer.access?.update

  assert.ok(updateAccess, 'footer update access가 있어야 합니다.')
  assert.equal(await updateAccess({ req: { user: undefined } } as never), false)
  assert.equal(await updateAccess({ req: { user: { role: 'admin' } } } as never), true)
  assert.equal(
    await updateAccess({ req: { user: { role: 'manager', center: 'exam' } } } as never),
    true,
  )
  assert.equal(await updateAccess({ req: { user: { role: 'manager' } } } as never), false)
})

test('footer preserves other center rows for center managers', () => {
  const data = restrictCenterFooterUpdates({
    context: {},
    data: {
      centerInfos: [
        {
          address: '아트 변경 주소',
          centerName: '아트센터',
          operationRegistrationNumber: '아트 변경',
          url: '/art',
        },
        {
          address: '입시 변경 주소',
          centerName: '입시센터',
          operationRegistrationNumber: '입시 변경',
          url: '/exam',
        },
      ],
    },
    global: Footer as never,
    originalDoc: {
      centerInfos: [
        {
          address: '아트 기존 주소',
          centerName: '아트센터',
          operationRegistrationNumber: '아트 기존',
          url: '/art',
        },
        {
          address: '입시 기존 주소',
          centerName: '입시센터',
          operationRegistrationNumber: '입시 기존',
          url: '/exam',
        },
      ],
    },
    req: {
      user: {
        center: 'exam',
        role: 'manager',
      },
    },
  } as never) as Record<string, unknown>

  assert.deepEqual(data.centerInfos, [
    {
      address: '아트 기존 주소',
      centerName: '아트센터',
      operationRegistrationNumber: '아트 기존',
      url: '/art',
    },
    {
      address: '입시 변경 주소',
      centerName: '입시센터',
      operationRegistrationNumber: '입시 변경',
      url: '/exam',
    },
  ])
})
