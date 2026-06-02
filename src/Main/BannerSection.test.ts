import assert from 'node:assert/strict'
import test from 'node:test'

import type { ExamPassedReview, Main, MainBanner, MainStatistic, Media, Profile } from '@/payload-types'

import {
  mainBannerAnchorHref,
  mainBannerAutoplaySettings,
  mainBannerMarqueeItems,
  mainBannerStatistics,
  toSlide,
} from './BannerSection'

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
        roleLabel: '아이돌 연습생',
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
      type: 'card',
      buttonLabel: '프로필 보기',
      href: '/art/profiles/kim-actor',
      image: profileImage,
      imageAlt: '김배우',
      label: '김배우 | 아이돌 연습생 역',
      name: '김배우',
      roleLabel: '아이돌 연습생 역',
    },
    {
      type: 'card',
      buttonLabel: '프로필 보기',
      href: '/art/profiles/english-name',
      image: '/legacy/profile.jpg',
      imageAlt: 'English Name',
      label: 'English Name | 여주 역',
      name: 'English Name',
      roleLabel: '여주 역',
    },
  ])
  assert.deepEqual(toSlide(banner, 'avenue').marqueeItems, [
    {
      type: 'card',
      buttonLabel: '프로필 보기',
      href: '/avenue/profiles/kim-actor',
      image: profileImage,
      imageAlt: '김배우',
      label: '김배우 | 아이돌 연습생 역',
      name: '김배우',
      roleLabel: '아이돌 연습생 역',
    },
    {
      type: 'card',
      buttonLabel: '프로필 보기',
      href: '/avenue/profiles/english-name',
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
      type: 'card',
      buttonLabel: '프로필 보기',
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
        review: examReview({
          id: 10,
          studentImagePath: '/legacy/exam-student-1.jpg',
          studentName: '이학생',
          title: '서울예대 합격',
        }),
        resultLabel: '한예종, 세종대',
      },
      {
        review: examReview({
          id: 11,
          studentImagePath: '/legacy/exam-student-2.jpg',
          studentName: '박학생',
          title: '',
        }),
        resultLabel: '건국대',
      },
      { review: 12, resultLabel: '무시되는 항목' },
    ],
  } as MainBanner

  assert.equal(mainBannerAnchorHref('exam'), '/exam#exam-passed-reviews')
  assert.deepEqual(toSlide(banner, 'exam').marqueeItems, [
    {
      type: 'card',
      buttonLabel: '후기 보기',
      href: '/exam#exam-passed-reviews',
      image: '/legacy/exam-student-1.jpg',
      imageAlt: '이학생',
      label: '이학생 | 한예종, 세종대',
      name: '이학생',
      roleLabel: '한예종, 세종대',
    },
    {
      type: 'card',
      buttonLabel: '후기 보기',
      href: '/exam#exam-passed-reviews',
      image: '/legacy/exam-student-2.jpg',
      imageAlt: '박학생',
      label: '박학생 | 건국대',
      name: '박학생',
      roleLabel: '건국대',
    },
  ])
})

test('main banner autoplay settings use center-specific main values', () => {
  assert.deepEqual(mainBannerAutoplaySettings(null, 'art'), {
    autoplayDelay: 5000,
    autoplayEnabled: true,
  })
  assert.deepEqual(
    mainBannerAutoplaySettings(
      {
        artBannerAutoplay: false,
        artBannerAutoplayDelay: 2800,
      } as Main,
      'art',
    ),
    {
      autoplayDelay: 2800,
      autoplayEnabled: false,
    },
  )
  assert.deepEqual(
    mainBannerAutoplaySettings(
      {
        examBannerAutoplay: true,
        examBannerAutoplayDelay: 0,
      } as Main,
      'exam',
    ),
    {
      autoplayDelay: 5000,
      autoplayEnabled: true,
    },
  )
})

test('main banner statistics expose center-specific values', () => {
  assert.deepEqual(
    mainBannerStatistics(
      {
        artTotalWorkCount: 268,
        artMonthlyLeadSupporting: {
          auditionCount: 142,
          directorMeetingCount: 17,
        },
        artMonthlyMinorExtra: {
          castingConfirmedCount: 41,
          listupCount: 173,
        },
        examTotalWorkCount: 99,
      } as MainStatistic,
      'art',
    ),
    {
      groups: [
        {
          items: [
            { label: '오디션 진행', value: 142 },
            { label: '최종 감독 미팅', value: 17 },
          ],
          title: '이달의 주·조연',
        },
        {
          items: [
            { label: '리스트업 인원', value: 173 },
            { label: '캐스팅 확정', value: 41 },
          ],
          title: '이달의 조·단역',
        },
      ],
      totalWorkCount: 268,
    },
  )
})
