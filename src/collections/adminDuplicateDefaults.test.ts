import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field, FieldHook } from 'payload'

import { Curriculums } from './Curriculums'
import { Inquiries } from './Inquiries'
import { MainBanners } from './MainBanners'
import { News } from './News'
import {
  applyAdminDuplicateDefaults,
  duplicatedAdminPublishedAt,
  duplicatedAdminStatus,
  duplicatedAdminTitle,
} from './adminDuplicateDefaults'

type FieldWithHooks = Field & {
  name: string
  hooks?: {
    beforeDuplicate?: FieldHook[]
  }
}

function findField(fields: Field[], name: string): FieldWithHooks | undefined {
  for (const field of fields) {
    if ('name' in field && field.name === name) {
      return field as FieldWithHooks
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const nestedField = findField(tab.fields, name)

        if (nestedField) {
          return nestedField
        }
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nestedField = findField(field.fields, name)

      if (nestedField) {
        return nestedField
      }
    }
  }

  return undefined
}

function transformedCollection(collection: CollectionConfig) {
  const [transformed] = applyAdminDuplicateDefaults([collection])

  return transformed
}

function beforeDuplicateHook(collection: CollectionConfig, fieldName: string) {
  return findField(collection.fields, fieldName)?.hooks?.beforeDuplicate?.[0]
}

test('duplicate titles use one Korean copy suffix', () => {
  assert.equal(duplicatedAdminTitle('커리큘럼 제목'), '커리큘럼 제목 - 복제됨')
  assert.equal(
    duplicatedAdminTitle('커리큘럼 제목 - 복제됨'),
    '커리큘럼 제목 - 복제됨',
  )
  assert.equal(duplicatedAdminTitle('  커리큘럼 제목  '), '커리큘럼 제목 - 복제됨')
  assert.equal(duplicatedAdminTitle(undefined), undefined)
})

test('curriculum duplicates are distinguished by their admin title', async () => {
  const collection = transformedCollection(Curriculums)
  const titleHook = beforeDuplicateHook(collection, 'title')

  assert.equal(typeof titleHook, 'function')
  assert.equal(
    await titleHook?.({ value: '연기 입문' } as never),
    '연기 입문 - 복제됨',
  )
})

test('publishable collection duplicates become drafts with a current publish date', async () => {
  const before = Date.now()
  const collection = transformedCollection(News)
  const titleHook = beforeDuplicateHook(collection, 'title')
  const statusHook = beforeDuplicateHook(collection, 'displayStatus')
  const publishedAtHook = beforeDuplicateHook(collection, 'publishedAt')

  assert.equal(await titleHook?.({ value: '새 소식' } as never), '새 소식 - 복제됨')
  assert.equal(await statusHook?.({ value: 'published' } as never), 'draft')

  const publishedAt = await publishedAtHook?.({
    value: '2020-01-01T00:00:00.000Z',
  } as never)

  assert.equal(typeof publishedAt, 'string')
  assert.ok(Date.parse(publishedAt as string) >= before)
  assert.ok(Date.parse(publishedAt as string) <= Date.now())
})

test('existing duplicate hooks and non-publishing workflow statuses are preserved', () => {
  const mainBanners = transformedCollection(MainBanners)
  const inquiries = transformedCollection(Inquiries)

  assert.equal(
    beforeDuplicateHook(mainBanners, 'title'),
    beforeDuplicateHook(MainBanners, 'title'),
  )
  assert.equal(
    beforeDuplicateHook(mainBanners, 'status'),
    beforeDuplicateHook(MainBanners, 'status'),
  )
  assert.equal(beforeDuplicateHook(inquiries, 'status'), undefined)
})

test('duplicate status and publish date helpers return safe defaults', () => {
  assert.equal(duplicatedAdminStatus(), 'draft')
  assert.equal(Date.parse(duplicatedAdminPublishedAt()) <= Date.now(), true)
})
