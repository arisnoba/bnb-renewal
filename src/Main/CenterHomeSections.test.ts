import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import type { Media, Profile, ScreenAppearance } from '@/payload-types'

import { hasSearchableHomeCurriculum } from './centerHomeCourseSearch'
import { screenAppearanceSlide } from './screenAppearanceSlides'

const profileImage = {
  id: 1,
  alt: '김배우 프로필',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: '/media/profile.jpg',
} as Media

const sceneImage = {
  id: 2,
  alt: '출연장면',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: '/media/scene.jpg',
} as Media

function appearance(data: Partial<ScreenAppearance>): ScreenAppearance {
  return {
    appearanceType: 'drama',
    bodyImages: [],
    id: 1,
    performerName: '김배우',
    publishedAt: '2026-01-01T00:00:00.000Z',
    slug: 'sample-screen',
    title: '샘플 출연장면',
    ...data,
  } as ScreenAppearance
}

function profile(data: Partial<Profile>): Profile {
  return data as Profile
}

test('center home screen appearance thumbnails prefer linked profile images', () => {
  const slide = screenAppearanceSlide(
    appearance({
      actorInputMode: 'profile',
      bodyImages: [{ image: sceneImage }],
      linkedProfiles: [
        profile({
          id: 10,
          name: '김배우',
          profileImageMedia: profileImage,
        }),
      ],
      thumbnailPath: '/media/thumbnail.jpg',
    }),
    'art',
  )

  assert.equal(slide.profileImageUrl, '/media/profile.jpg?2026-01-01T00%3A00%3A00.000Z')
  assert.equal(slide.sceneImageUrl, '/media/scene.jpg?2026-01-01T00%3A00%3A00.000Z')
})

test('center home screen appearance thumbnails do not fall back to scene images', () => {
  const slide = screenAppearanceSlide(
    appearance({
      actorInputMode: 'profile',
      bodyImages: [{ image: sceneImage }],
      linkedProfiles: [
        profile({
          id: 10,
          name: '김배우',
        }),
      ],
      thumbnailPath: '/media/thumbnail.jpg',
    }),
    'art',
  )

  assert.equal(slide.profileImageUrl, '')
  assert.equal(slide.sceneImageUrl, '/media/scene.jpg?2026-01-01T00%3A00%3A00.000Z')
})

test('center home screen appearance labels fall back to linked profile names', () => {
  const slide = screenAppearanceSlide(
    appearance({
      actorInputMode: 'profile',
      linkedProfiles: [
        profile({
          id: 10,
          name: '임단우',
          profileImageMedia: profileImage,
        }),
      ],
      performerName: null,
    }),
    'highteen',
  )

  assert.equal(slide.performerName, '임단우')
})

test('center home course search is only exposed for searchable curriculum centers', () => {
  assert.equal(hasSearchableHomeCurriculum('art'), true)
  assert.equal(hasSearchableHomeCurriculum('highteen'), true)
  assert.equal(hasSearchableHomeCurriculum('exam'), false)
  assert.equal(hasSearchableHomeCurriculum('kids'), false)
  assert.equal(hasSearchableHomeCurriculum('avenue'), false)
})

test('center home data query does not convert Payload failures to empty sections', () => {
  const source = readFileSync(new URL('./CenterHomeSections.tsx', import.meta.url), 'utf8')
  const querySource = source.slice(source.indexOf('const queryCenterHomeData'))

  assert.doesNotMatch(querySource, /catch\s*\{/)
  assert.doesNotMatch(querySource, /\.catch\(\(\) => \(\{ docs: \[\] \}\)\)/)
})
