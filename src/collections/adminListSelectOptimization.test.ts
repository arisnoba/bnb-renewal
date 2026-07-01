import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field, Tab } from 'payload'

import { ArtistPress } from './ArtistPress'
import { ArtistPressAgencies } from './ArtistPressAgencies'
import { BroadcastStations } from './BroadcastStations'
import { Classrooms } from './Classrooms'
import { Faqs } from './Faqs'
import { Inquiries } from './Inquiries'
import { MainBanners } from './MainBanners'
import { News } from './News'
import { applyAdminListSelectOptimization } from './adminListSelectOptimization'

type FieldWithName = Field & {
  fields?: Field[]
  name: string
}

function transform(collection: CollectionConfig) {
  return applyAdminListSelectOptimization([collection])[0]
}

function isNamedField(field: Field, name: string): field is FieldWithName {
  return 'name' in field && field.name === name
}

function findNamedField(fields: Field[], name: string): FieldWithName | undefined {
  for (const field of fields) {
    if (isNamedField(field, name)) {
      return field
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs as Tab[]) {
        const nestedField = findNamedField(tab.fields, name)

        if (nestedField) {
          return nestedField
        }
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nestedField = findNamedField(field.fields, name)

      if (nestedField) {
        return nestedField
      }
    }
  }

  return undefined
}

function getNamedField(collection: CollectionConfig, name: string) {
  const field = findNamedField(collection.fields, name)

  assert.ok(field, `${collection.slug}.${name} 필드가 있어야 합니다.`)

  return field
}

function assertHiddenFromList(field: Field) {
  const admin = field.admin as Record<string, unknown> | undefined

  assert.equal(admin?.disableGroupBy, true)
  assert.equal(admin?.disableListColumn, true)
  assert.equal(admin?.disableListFilter, true)
}

test('admin list optimization enables select API for collections', () => {
  for (const collection of [Faqs, Inquiries, MainBanners, News]) {
    assert.equal(transform(collection).admin?.enableListViewSelectAPI, true)
  }
})

test('FAQ answer fields are removed from list columns and filters', () => {
  const collection = transform(Faqs)

  assertHiddenFromList(getNamedField(collection, 'sharedAnswer'))
  assertHiddenFromList(getNamedField(collection, 'variants'))
  assertHiddenFromList(getNamedField(collection, 'answer'))
})

test('inquiry hidden detail fields are removed from list columns and filters', () => {
  const collection = transform(Inquiries)

  for (const fieldName of ['preferredTime', 'region', 'occupation', 'schoolLevel']) {
    assertHiddenFromList(getNamedField(collection, fieldName))
  }

  assert.deepEqual(collection.admin?.defaultColumns, [
    'displayName',
    'inquiryType',
    'primaryPhone',
    'preferredDate',
    'status',
    'createdAt',
  ])
})

test('main banner detail and media fields are removed from list columns and filters', () => {
  const collection = transform(MainBanners)

  for (const fieldName of [
    'broadcaster',
    'description',
    'desktopImage',
    'mobileImage',
    'desktopVideo',
    'mobileVideo',
    'linkedProfileItems',
    'linkedExamReviewItems',
  ]) {
    assertHiddenFromList(getNamedField(collection, fieldName))
  }
})

test('news legacy metrics and SEO fields are removed from list columns and filters', () => {
  const collection = transform(News)

  assertHiddenFromList(getNamedField(collection, 'viewCount'))

  const metaTab = (collection.fields.find((field) => field.type === 'tabs') as { tabs: Tab[] }).tabs.find(
    (tab) => ('name' in tab && tab.name === 'meta') || tab.label === 'SEO',
  )

  assert.ok(metaTab, 'news SEO 탭이 있어야 합니다.')

  for (const field of metaTab.fields) {
    assertHiddenFromList(field)
  }
})

test('image default columns are removed from compact admin lists', () => {
  assert.deepEqual(transform(ArtistPressAgencies).admin?.defaultColumns, [
    'agencyName',
    'authorName',
    'updatedAt',
  ])
  assert.deepEqual(transform(BroadcastStations).admin?.defaultColumns, [
    'stationName',
    'slug',
    'updatedAt',
  ])
  assert.deepEqual(transform(Classrooms).admin?.defaultColumns, ['title', 'updatedAt'])
})

test('artist press SEO and media fields are removed from list columns and filters', () => {
  const collection = transform(ArtistPress)

  assertHiddenFromList(getNamedField(collection, 'thumbnailMedia'))
  assertHiddenFromList(getNamedField(collection, 'body'))

  const metaTab = (collection.fields.find((field) => field.type === 'tabs') as { tabs: Tab[] }).tabs.find(
    (tab) => ('name' in tab && tab.name === 'meta') || tab.label === 'SEO',
  )

  assert.ok(metaTab, 'artist-press SEO 탭이 있어야 합니다.')

  for (const field of metaTab.fields) {
    assertHiddenFromList(field)
  }
})
