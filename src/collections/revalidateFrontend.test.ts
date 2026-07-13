import assert from 'node:assert/strict'
import test from 'node:test'

import { MainStatistics } from '../Main/Statistics'
import { ArtistPress } from './ArtistPress'
import { Curriculums, curriculumDetailFrontendPaths } from './Curriculums'
import { DirectCastings } from './DirectCastings'
import { ExamResults, examResultDetailFrontendPaths } from './ExamResults'
import { ExamPassedReviews } from './ExamPassedReviews'
import { ExamPassedVideos } from './ExamPassedVideos'
import { Faqs } from './Faqs'
import { News, newsDetailFrontendPaths } from './News'
import { ScreenAppearances } from './ScreenAppearances'
import { SocialLinks } from './SocialLinks'
import {
  centerFrontendCacheTags,
  centerFrontendPaths,
  revalidateFrontendPaths,
} from './revalidateFrontend'

test('center frontend paths include home and section suffixes without duplicates', () => {
  assert.deepEqual(
    centerFrontendPaths({
      centers: ['art'],
      previousCenters: ['art'],
      suffixes: ['', 'news'],
    }),
    ['/art', '/art/news'],
  )
})

test('news detail frontend paths include current and previous slugs', () => {
  assert.deepEqual(
    newsDetailFrontendPaths({
      centers: ['art'],
      previousCenters: ['kids'],
      slugs: ['news-new', 'news-old', 'news-new'],
    }),
    [
      '/art/news/news-new',
      '/art/news/news-old',
      '/kids/news/news-new',
      '/kids/news/news-old',
    ],
  )
})

test('news detail frontend paths expand all centers', () => {
  assert.deepEqual(
    newsDetailFrontendPaths({
      centers: ['all'],
      slugs: ['news-all'],
    }),
    [
      '/art/news/news-all',
      '/exam/news/news-all',
      '/kids/news/news-all',
      '/highteen/news/news-all',
      '/avenue/news/news-all',
    ],
  )
})

test('exam result detail frontend paths include result type routes', () => {
  assert.deepEqual(
    examResultDetailFrontendPaths({
      centers: ['exam'],
      resultTypes: ['university', 'arts_high_school'],
      slugs: ['101', '101'],
    }),
    ['/exam/university-results/101', '/exam/arts-high-results/101'],
  )
})

test('curriculum detail frontend paths include avenue for shared art content', () => {
  assert.deepEqual(
    curriculumDetailFrontendPaths({
      centers: ['art'],
      previousCenters: ['highteen'],
      slugs: ['123', '123', 'old-slug'],
    }),
    [
      '/art/curriculum/123',
      '/art/curriculum/old-slug',
      '/highteen/curriculum/123',
      '/highteen/curriculum/old-slug',
      '/avenue/curriculum/123',
      '/avenue/curriculum/old-slug',
    ],
  )
})

test('center frontend cache tags include current and previous centers without duplicates', () => {
  assert.deepEqual(
    centerFrontendCacheTags({
      centers: ['art', 'all'],
      prefixes: ['frontend_artist_press'],
      previousCenters: ['kids', 'art'],
    }),
    [
      'frontend_artist_press_art',
      'frontend_artist_press_exam',
      'frontend_artist_press_kids',
      'frontend_artist_press_highteen',
      'frontend_artist_press_avenue',
    ],
  )
})

test('frontend revalidation clears paths and cache tags', () => {
  const pathCalls: string[] = []
  const tagCalls: string[] = []

  revalidateFrontendPaths({
    paths: ['/art/artist-press'],
    reason: 'artist press',
    req: {
      context: {},
      payload: {
        logger: {
          info: () => undefined,
        },
      },
    } as never,
    revalidate: ((path: string, type: 'page' | 'layout') => {
      pathCalls.push(`${path}:${type}`)
    }) as never,
    revalidateCacheTag: ((tag: string, profile: string) => {
      tagCalls.push(`${tag}:${profile}`)
    }) as never,
    tags: ['frontend_artist_press_art', 'frontend_artist_press_art', ''],
  })

  assert.deepEqual(pathCalls, ['/art/artist-press:page'])
  assert.deepEqual(tagCalls, ['frontend_artist_press_art:max'])
})

test('center content collections revalidate after change and delete', () => {
  for (const collection of [
    ArtistPress,
    Curriculums,
    DirectCastings,
    ExamResults,
    ExamPassedReviews,
    ExamPassedVideos,
    Faqs,
    News,
    ScreenAppearances,
    SocialLinks,
  ]) {
    assert.ok(collection.hooks?.afterChange?.length, `${collection.slug} afterChange hook 필요`)
    assert.ok(collection.hooks?.afterDelete?.length, `${collection.slug} afterDelete hook 필요`)
  }
})

test('main statistics revalidates center home pages after change', () => {
  assert.ok(MainStatistics.hooks?.afterChange?.length)
})
