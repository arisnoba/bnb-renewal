import assert from 'node:assert/strict'
import test from 'node:test'

import { MainStatistics } from '../Main/Statistics'
import { ArtistPress } from './ArtistPress'
import { Curriculums } from './Curriculums'
import { DirectCastings } from './DirectCastings'
import { ExamPassedReviews } from './ExamPassedReviews'
import { ExamPassedVideos } from './ExamPassedVideos'
import { News } from './News'
import { ScreenAppearances } from './ScreenAppearances'
import { SocialLinks } from './SocialLinks'
import { centerFrontendPaths } from './revalidateFrontend'

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

test('center content collections revalidate after change and delete', () => {
  for (const collection of [
    ArtistPress,
    Curriculums,
    DirectCastings,
    ExamPassedReviews,
    ExamPassedVideos,
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
