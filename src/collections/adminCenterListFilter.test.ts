import assert from 'node:assert/strict'
import test from 'node:test'

import configPromise from '../../payload.config'
import {
  adminCenterListFilterComponentPath,
  buildCenterListWhere,
  buildExamResultTypeListWhere,
  centerListFilterConfig,
  centerListFilterFieldName,
  selectedExamResultTypeFromWhere,
  selectedCenterFromWhere,
} from '../components/payload/AdminCenterListFilter.utils'

const expectedQuickFilterCollections = [
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
  'exam-results',
  'news',
  'faqs',
  'star-cards',
  'inquiries',
  'users',
]

test('center-aware collections receive quick filters except fixed exam collections', async () => {
  const config = await configPromise
  const filteredCollectionSlugs = config.collections
    .filter((collection) =>
      collection.admin?.components?.beforeListTable?.includes(adminCenterListFilterComponentPath),
    )
    .map((collection) => collection.slug)

  assert.deepEqual(filteredCollectionSlugs, expectedQuickFilterCollections)
})

test('center list filter detects single and multi center fields', async () => {
  const config = await configPromise
  const socialLinks = config.collections.find((collection) => collection.slug === 'social-links')
  const curriculums = config.collections.find((collection) => collection.slug === 'curriculums')
  const faqs = config.collections.find((collection) => collection.slug === 'faqs')
  const screenAppearances = config.collections.find((collection) => collection.slug === 'screen-appearances')
  const media = config.collections.find((collection) => collection.slug === 'media')

  assert.ok(socialLinks)
  assert.ok(curriculums)
  assert.ok(faqs)
  assert.ok(screenAppearances)
  assert.ok(media)
  assert.equal(centerListFilterFieldName(socialLinks.fields), 'center')
  assert.deepEqual(centerListFilterConfig(curriculums.fields), {
    fieldName: 'centers',
    hasMany: false,
  })
  assert.equal(centerListFilterFieldName(faqs.fields), 'centers')
  assert.deepEqual(centerListFilterConfig(faqs.fields), {
    fieldName: 'centers',
    hasMany: true,
  })
  assert.deepEqual(centerListFilterConfig(screenAppearances.fields), {
    fieldName: 'centers',
    hasMany: false,
  })
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
      center: 'highteen',
      existingWhere: {
        displayStatus: { equals: 'published' },
        centers: { equals: 'art' },
      },
      fieldName: 'centers',
      hasMany: false,
    }),
    {
      and: [
        { displayStatus: { equals: 'published' } },
        { centers: { equals: 'highteen' } },
      ],
    },
  )

  assert.deepEqual(
    buildCenterListWhere({
      center: 'kids',
      existingWhere: {
        or: {
          0: { centers: { contains: 'art' } },
          1: { centers: { contains: 'all' } },
        },
      },
      fieldName: 'centers',
      hasMany: false,
    }),
    { centers: { equals: 'kids' } },
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
  assert.equal(
    selectedCenterFromWhere(
      {
        sort: 'name',
        where: {
          or: {
            0: { centers: { contains: 'kids' } },
            1: { centers: { contains: 'all' } },
          },
        },
      },
      'centers',
    ),
    'kids',
  )
  assert.equal(
    selectedCenterFromWhere(
      {
        page: 1,
        sort: '-id',
        where: {
          and: {
            0: { displayStatus: { equals: 'published' } },
            1: { centers: { equals: 'art' } },
          },
        },
      },
      'centers',
    ),
    'art',
  )
})

test('exam result type list filter preserves other filters while replacing prior school filters', () => {
  assert.deepEqual(
    buildExamResultTypeListWhere({
      existingWhere: {
        and: [
          { displayStatus: { equals: 'published' } },
          { resultType: { equals: 'arts_high_school' } },
        ],
      },
      resultType: 'university',
    }),
    {
      and: [
        { displayStatus: { equals: 'published' } },
        { resultType: { equals: 'university' } },
      ],
    },
  )

  assert.deepEqual(
    buildExamResultTypeListWhere({
      existingWhere: {
        displayStatus: { equals: 'draft' },
        resultType: { equals: 'university' },
      },
      resultType: 'all',
    }),
    { displayStatus: { equals: 'draft' } },
  )

  assert.deepEqual(
    buildExamResultTypeListWhere({
      existingWhere: {
        displayStatus: { equals: 'published' },
        centers: { contains: 'art' },
      },
      resultType: 'arts_high_school',
    }),
    {
      and: [
        { displayStatus: { equals: 'published' } },
        { resultType: { equals: 'arts_high_school' } },
      ],
    },
  )
})

test('exam result type list filter reads the active school filter from list where clauses', () => {
  assert.equal(
    selectedExamResultTypeFromWhere({
      and: [
        { displayStatus: { equals: 'published' } },
        { resultType: { equals: 'arts_high_school' } },
      ],
    }),
    'arts_high_school',
  )

  assert.equal(
    selectedExamResultTypeFromWhere({
      page: 1,
      sort: '-publishedAt',
      where: {
        resultType: { equals: 'university' },
      },
    }),
    'university',
  )
})
