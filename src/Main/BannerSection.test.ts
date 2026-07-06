import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  ExamPassedReview,
  ExamSchoolLogo,
  Main,
  MainBanner,
  MainStatistic,
  Media,
  Profile,
} from '@/payload-types'

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

function examSchool(data: Partial<ExamSchoolLogo>): ExamSchoolLogo {
  return data as ExamSchoolLogo
}

const originalNodeEnv = process.env.NODE_ENV
const originalR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL

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
  } as unknown as MainBanner

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
        school: examSchool({
          id: 100,
          logoMedia: {
            id: 1000,
            alt: '세종대 로고',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            url: '/legacy/sejong-logo.png',
          } as Media,
          schoolName: '세종대',
        }),
        resultLabel: '한예종, 세종대',
        reviews: [
          {
            review: examReview({
              id: 10,
              slug: 'seoul-art-pass',
              studentImagePath: '/legacy/exam-student-1.jpg',
              studentName: '이학생',
              title: '서울예대 합격',
            }),
          },
          {
            review: examReview({
              id: 11,
              slug: 'park-pass',
              studentImagePath: '/legacy/exam-student-2.jpg',
              studentName: '박학생',
              title: '',
            }),
          },
        ],
      },
      { resultLabel: '건국대', reviews: [{ review: 12 }] },
    ],
  } as unknown as MainBanner

  assert.equal(mainBannerAnchorHref('exam'), '/exam#exam-passed-reviews')
  const slide = toSlide(banner, 'exam')

  assert.deepEqual(slide.decorImages, [
    {
      alt: '한예종, 세종대',
      image: {
        id: 1000,
        alt: '세종대 로고',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        url: '/legacy/sejong-logo.png',
      },
    },
  ])
  assert.deepEqual(slide.marqueeItems, [
    {
      type: 'card',
      buttonLabel: '후기 보기',
      href: '/exam/passed-reviews/seoul-art-pass',
      image: '/legacy/exam-student-1.jpg',
      imageAlt: '이학생',
      label: '이학생 | 한예종, 세종대',
      name: '이학생',
      roleLabel: '한예종, 세종대',
    },
    {
      type: 'card',
      buttonLabel: '후기 보기',
      href: '/exam/passed-reviews/park-pass',
      image: '/legacy/exam-student-2.jpg',
      imageAlt: '박학생',
      label: '박학생 | 한예종, 세종대',
      name: '박학생',
      roleLabel: '한예종, 세종대',
    },
  ])
})

test('main banner exam review links fall back to center anchor when slug is missing', () => {
  const banner = {
    linkedExamReviewItems: [
      {
        resultLabel: '한예종',
        reviews: [
          {
            review: examReview({
              id: 10,
              studentName: '이학생',
              title: '서울예대 합격',
            }),
          },
        ],
      },
    ],
  } as unknown as MainBanner

  assert.deepEqual(mainBannerMarqueeItems(banner, 'exam'), [
    {
      type: 'card',
      buttonLabel: '후기 보기',
      href: '/exam#exam-passed-reviews',
      image: null,
      imageAlt: '이학생',
      label: '이학생 | 한예종',
      name: '이학생',
      roleLabel: '한예종',
    },
  ])
})

test('main banner rewrites exam review media paths to R2 URLs in production', () => {
  setNodeEnv('production')
  process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com'

  const banner = {
    title: '입시 배너',
    linkedExamReviewItems: [
      {
        school: examSchool({
          id: 100,
          logoMedia: {
            id: 1000,
            alt: '세종대 로고',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            url: '/media/exam-school-logos/images/1/sejong-logo.png',
          } as Media,
          schoolName: '세종대',
        }),
        resultLabel: '한예종',
        reviews: [
          {
            review: examReview({
              id: 10,
              slug: 'r2-pass',
              studentImagePath:
                '/media/exam-passed-reviews/images/1/exam-passed-review-image-1-large.jpg',
              studentName: '이학생',
              title: '서울예대 합격',
            }),
          },
        ],
      },
    ],
  } as unknown as MainBanner

  const slide = toSlide(banner, 'exam')

  assert.deepEqual(slide.decorImages?.[0], {
    alt: '한예종',
    image: {
      id: 1000,
      alt: '세종대 로고',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      url: '/media/exam-school-logos/images/1/sejong-logo.png',
    },
  })
  assert.deepEqual(slide.marqueeItems?.[0], {
    type: 'card',
    buttonLabel: '후기 보기',
    href: '/exam/passed-reviews/r2-pass',
    image: 'https://cdn.example.com/media/exam-passed-reviews/images/1/exam-passed-review-image-1-large.jpg',
    imageAlt: '이학생',
    label: '이학생 | 한예종',
    name: '이학생',
    roleLabel: '한예종',
  })
})

test('main banner statistics are disabled for exam center', () => {
  const statistics = {
    artTotalWorkCount: 10,
    examTotalWorkCount: 20,
  } as MainStatistic

  assert.equal(mainBannerStatistics(statistics, 'art')?.totalWorkCount, 10)
  assert.equal(mainBannerStatistics(statistics, 'exam'), null)
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

test.after(() => {
  setNodeEnv(originalNodeEnv)

  if (originalR2PublicBaseUrl === undefined) {
    delete process.env.R2_PUBLIC_BASE_URL
  } else {
    process.env.R2_PUBLIC_BASE_URL = originalR2PublicBaseUrl
  }
})

function setNodeEnv(value: typeof process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

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
