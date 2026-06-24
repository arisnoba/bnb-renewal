import assert from 'node:assert/strict'
import test from 'node:test'

import configPromise from '../../payload.config'
import {
  adminCenterListFilterComponentPath,
  buildCenterListWhere,
  centerListFilterFieldName,
  selectedCenterFromWhere,
} from '../components/payload/AdminCenterListFilter.utils'

const expectedCenterFilterCollections = [
  'main-banners',
  'social-links',
  'teachers',
  'curriculums',
  'highteen-special-classes',
  'agencies',
  'audition-schedules',
  'casting-directors',
  'direct-castings',
  'casting-appearances',
  'screen-appearances',
  'profiles',
  'artist-press',
  'artist-press-agencies',
  'exam-passed-reviews',
  'exam-passed-videos',
  'exam-results',
  'exam-school-logos',
  'news',
  'faqs',
  'star-cards',
  'inquiries',
  'users',
]

test('center-aware collections receive the global admin quick center filter', async () => {
  const config = await configPromise
  const filteredCollectionSlugs = config.collections
    .filter((collection) =>
      collection.admin?.components?.beforeListTable?.includes(adminCenterListFilterComponentPath),
    )
    .map((collection) => collection.slug)

  assert.deepEqual(filteredCollectionSlugs, expectedCenterFilterCollections)
})

test('center list filter detects single and multi center fields', async () => {
  const config = await configPromise
  const socialLinks = config.collections.find((collection) => collection.slug === 'social-links')
  const faqs = config.collections.find((collection) => collection.slug === 'faqs')
  const media = config.collections.find((collection) => collection.slug === 'media')

  assert.ok(socialLinks)
  assert.ok(faqs)
  assert.ok(media)
  assert.equal(centerListFilterFieldName(socialLinks.fields), 'center')
  assert.equal(centerListFilterFieldName(faqs.fields), 'centers')
  assert.equal(centerListFilterFieldName(media.fields), undefined)
})

test('center list filter preserves other list filters while replacing prior center filters', () => {
  assert.deepEqual(
    buildCenterListWhere({
      center: 'exam',
      existingWhere: {
        and: [
          { displayStatus: { equals: 'published' } },
          { center: { equals: 'art' } },
        ],
      },
      fieldName: 'center',
    }),
    {
      and: [
        { displayStatus: { equals: 'published' } },
        { center: { equals: 'exam' } },
      ],
    },
  )

  assert.deepEqual(
    buildCenterListWhere({
      center: 'kids',
      existingWhere: {
        displayStatus: { equals: 'published' },
        centers: { contains: 'art' },
      },
      fieldName: 'centers',
    }),
    {
      and: [
        { displayStatus: { equals: 'published' } },
        {
          or: [
            { centers: { contains: 'kids' } },
            { centers: { contains: 'all' } },
          ],
        },
      ],
    },
  )

  assert.deepEqual(
    buildCenterListWhere({
      center: 'all',
      existingWhere: {
        displayStatus: { equals: 'draft' },
        center: { equals: 'art' },
      },
      fieldName: 'center',
    }),
    { displayStatus: { equals: 'draft' } },
  )
})

test('center list filter reads the active center from list where clauses', () => {
  assert.equal(
    selectedCenterFromWhere(
      {
        and: [
          { displayStatus: { equals: 'published' } },
          { center: { equals: 'avenue' } },
        ],
      },
      'center',
    ),
    'avenue',
  )
  assert.equal(
    selectedCenterFromWhere(
      {
        or: [
          { centers: { contains: 'highteen' } },
          { centers: { contains: 'all' } },
        ],
      },
      'centers',
    ),
    'highteen',
  )
})
