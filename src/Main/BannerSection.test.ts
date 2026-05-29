import assert from 'node:assert/strict'
import test from 'node:test'

import type { ExamPassedReview, MainBanner, Profile } from '@/payload-types'

import { mainBannerAnchorHref, mainBannerMarqueeItems, toSlide } from './BannerSection'

function profile(data: Partial<Profile>): Profile {
  return data as Profile
}

function examReview(data: Partial<ExamPassedReview>): ExamPassedReview {
  return data as ExamPassedReview
}

test('main banner slides expose linked profiles for non-exam centers', () => {
  const banner = {
    title: '프로필 배너',
    linkedProfiles: [
      profile({ id: 1, name: '김배우', englishName: 'Kim Actor', slug: 'kim-actor' }),
      profile({ id: 2, name: '', englishName: 'English Name', slug: 'english-name' }),
      3,
    ],
    linkedExamReviews: [examReview({ id: 10, title: '합격후기' })],
  } as MainBanner

  assert.equal(mainBannerAnchorHref('art'), '/art#profiles')
  assert.deepEqual(mainBannerMarqueeItems(banner, 'art'), [
    { href: '/profiles/kim-actor', label: '김배우' },
    { href: '/profiles/english-name', label: 'English Name' },
  ])
  assert.deepEqual(toSlide(banner, 'avenue').marqueeItems, [
    { href: '/profiles/kim-actor', label: '김배우' },
    { href: '/profiles/english-name', label: 'English Name' },
  ])
})

test('main banner profile links fall back to center anchor when slug is missing', () => {
  const banner = {
    linkedProfiles: [profile({ id: 1, name: '김배우', slug: '' })],
  } as MainBanner

  assert.deepEqual(mainBannerMarqueeItems(banner, 'art'), [
    { href: '/art#profiles', label: '김배우' },
  ])
})

test('main banner slides expose linked exam reviews for exam center', () => {
  const banner = {
    title: '입시 배너',
    linkedProfiles: [profile({ id: 1, name: '김배우' })],
    linkedExamReviews: [
      examReview({ id: 10, title: '서울예대 합격', studentName: '이학생' }),
      examReview({ id: 11, title: '', studentName: '박학생' }),
      12,
    ],
  } as MainBanner

  assert.equal(mainBannerAnchorHref('exam'), '/exam#exam-passed-reviews')
  assert.deepEqual(toSlide(banner, 'exam').marqueeItems, [
    { href: '/exam#exam-passed-reviews', label: '서울예대 합격' },
    { href: '/exam#exam-passed-reviews', label: '박학생' },
  ])
})
