import assert from 'node:assert/strict'
import test from 'node:test'

import type { ExamPassedReview, MainBanner, Media, Profile } from '@/payload-types'

import { mainBannerAnchorHref, mainBannerMarqueeItems, toSlide } from './BannerSection'

function profile(data: Partial<Profile>): Profile {
  return data as Profile
}

function examReview(data: Partial<ExamPassedReview>): ExamPassedReview {
  return data as ExamPassedReview
}

const profileImage = {
  id: 9,
  alt: '김배우 프로필',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: '/media/profile.jpg',
} as Media

test('main banner slides expose linked profiles for non-exam centers', () => {
  const banner = {
    title: '프로필 배너',
    linkedProfileItems: [
      {
        profile: profile({
          id: 1,
          name: '김배우',
          englishName: 'Kim Actor',
          profileImageMedia: profileImage,
          slug: 'kim-actor',
        }),
        roleLabel: '아이돌 연습생 역',
      },
      {
        profile: profile({
          id: 2,
          name: '',
          englishName: 'English Name',
          profileImagePath: '/legacy/profile.jpg',
          slug: 'english-name',
        }),
        roleLabel: '여주 역',
      },
      { profile: 3, roleLabel: '무시되는 항목' },
    ],
    linkedExamReviewItems: [{ review: examReview({ id: 10, title: '합격후기' }) }],
  } as MainBanner

  assert.equal(mainBannerAnchorHref('art'), '/art#profiles')
  assert.deepEqual(mainBannerMarqueeItems(banner, 'art'), [
    {
      type: 'profile',
      href: '/profiles/kim-actor',
      image: profileImage,
      imageAlt: '김배우',
      label: '김배우 | 아이돌 연습생 역',
      name: '김배우',
      roleLabel: '아이돌 연습생 역',
    },
    {
      type: 'profile',
      href: '/profiles/english-name',
      image: '/legacy/profile.jpg',
      imageAlt: 'English Name',
      label: 'English Name | 여주 역',
      name: 'English Name',
      roleLabel: '여주 역',
    },
  ])
  assert.deepEqual(toSlide(banner, 'avenue').marqueeItems, [
    {
      type: 'profile',
      href: '/profiles/kim-actor',
      image: profileImage,
      imageAlt: '김배우',
      label: '김배우 | 아이돌 연습생 역',
      name: '김배우',
      roleLabel: '아이돌 연습생 역',
    },
    {
      type: 'profile',
      href: '/profiles/english-name',
      image: '/legacy/profile.jpg',
      imageAlt: 'English Name',
      label: 'English Name | 여주 역',
      name: 'English Name',
      roleLabel: '여주 역',
    },
  ])
})

test('main banner profile links fall back to center anchor when slug is missing', () => {
  const banner = {
    linkedProfileItems: [{ profile: profile({ id: 1, name: '김배우', slug: '' }) }],
  } as MainBanner

  assert.deepEqual(mainBannerMarqueeItems(banner, 'art'), [
    {
      type: 'profile',
      href: '/art#profiles',
      image: null,
      imageAlt: '김배우',
      label: '김배우',
      name: '김배우',
      roleLabel: '',
    },
  ])
})

test('main banner slides expose linked exam reviews for exam center', () => {
  const banner = {
    title: '입시 배너',
    linkedProfileItems: [{ profile: profile({ id: 1, name: '김배우' }) }],
    linkedExamReviewItems: [
      {
        review: examReview({ id: 10, title: '서울예대 합격', studentName: '이학생' }),
        resultLabel: '한예종, 세종대',
      },
      {
        review: examReview({ id: 11, title: '', studentName: '박학생' }),
        resultLabel: '건국대',
      },
      { review: 12, resultLabel: '무시되는 항목' },
    ],
  } as MainBanner

  assert.equal(mainBannerAnchorHref('exam'), '/exam#exam-passed-reviews')
  assert.deepEqual(toSlide(banner, 'exam').marqueeItems, [
    { href: '/exam#exam-passed-reviews', label: '이학생 | 한예종, 세종대' },
    { href: '/exam#exam-passed-reviews', label: '박학생 | 건국대' },
  ])
})
