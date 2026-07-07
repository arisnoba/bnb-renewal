import assert from 'node:assert/strict'
import test from 'node:test'

import type { Media } from '@/payload-types'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  MainBannerSlider,
  shouldProfileSetMarquee,
  type MainBannerSlide,
} from './BannerSlider.client'

const image = {
  id: 1,
  alt: '배너 이미지',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: '/media/banner.jpg',
} as Media

const mobileImage = {
  ...image,
  id: 2,
  alt: '모바일 배너 이미지',
  url: '/media/banner-mobile.jpg',
} as Media

const desktopVideo = {
  ...image,
  id: 3,
  alt: '데스크톱 배너 영상',
  url: '/media/banner-desktop.mp4',
} as Media

function render(slide: MainBannerSlide) {
  return renderToStaticMarkup(<MainBannerSlider banners={[slide]} />)
}

test('main banner renders marquee links when linked content exists', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [{ href: '/art#profiles', label: '김배우' }],
    title: '메인 배너',
  })

  assert.match(html, /href="\/art#profiles"/)
  assert.match(html, /김배우/)
})

test('main banner renders profile cards when linked profiles exist', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [
      {
        type: 'card',
        buttonLabel: '프로필 보기',
        href: '/art/profiles/kim-actor',
        image: {
          ...image,
          alt: '김배우 프로필',
          url: '/media/profile.jpg',
        },
        imageAlt: '김배우',
        label: '김배우 | 아이돌 연습생 역',
        name: '김배우',
        roleLabel: '아이돌 연습생 역',
      },
    ],
    title: '메인 배너',
  })

  assert.match(html, /src="\/media\/profile\.jpg\?2026-01-01T00%3A00%3A00\.000Z"/)
  assert.match(html, /김배우/)
  assert.match(html, /아이돌 연습생 역/)
  assert.match(html, /프로필 보기/)
  assert.match(html, /href="\/art\/profiles\/kim-actor"/)
})

test('main banner profile cards start centered without duplicate marquee set', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [
      {
        type: 'card',
        buttonLabel: '프로필 보기',
        href: '/art/profiles/kim-actor',
        image,
        imageAlt: '김배우',
        label: '김배우',
        name: '김배우',
        roleLabel: '배우',
      },
    ],
    title: '메인 배너',
  })

  assert.match(html, /data-marquee="false"/)
  assert.match(html, /section-main-banner__profile-track[^"]*justify-center/)
  assert.match(html, /section-main-banner__profile-set[^"]*px-5/)
  assert.doesNotMatch(html, /aria-hidden="true" class="section-main-banner__profile-set"/)
})

test('main banner profile cards marquee as soon as the profile set is wider than the viewport', () => {
  assert.equal(shouldProfileSetMarquee(721, 720), true)
  assert.equal(shouldProfileSetMarquee(720, 720), false)
  assert.equal(shouldProfileSetMarquee(700, 720), false)
})

test('main banner renders exam review cards with review buttons', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [
      {
        type: 'card',
        buttonLabel: '후기 보기',
        href: '/exam/passed-reviews/seoul-art-pass',
        image: '/legacy/exam-student.jpg',
        imageAlt: '이학생',
        label: '이학생 | 한예종, 세종대',
        name: '이학생',
        roleLabel: '한예종, 세종대',
      },
    ],
    title: '입시 배너',
  })

  assert.match(html, /src="\/legacy\/exam-student\.jpg"/)
  assert.match(html, /이학생/)
  assert.match(html, /한예종, 세종대/)
  assert.match(html, /후기 보기/)
  assert.match(html, /href="\/exam\/passed-reviews\/seoul-art-pass"/)
})

test('main banner renders exam broadcaster as brand text without badge background', () => {
  const html = renderToStaticMarkup(
    <MainBannerSlider
      banners={[
        {
          broadcaster: '배우앤배움 입시센터 합격자',
          desktopImage: image,
          title: '세종대 국민대',
        },
      ]}
      center="exam"
    />,
  )

  assert.match(html, /section-main-banner__badge[^"]*text-brand/)
  assert.match(html, /section-main-banner__badge[^"]*bg-transparent/)
  assert.doesNotMatch(html, /section-main-banner__badge[^"]*bg-\[#78a8ff\]/)
  assert.doesNotMatch(html, /section-main-banner__badge[^"]*rounded-full/)
})

test('main banner aligns exam decorative logos to the desktop statistics slot', () => {
  const html = renderToStaticMarkup(
    <MainBannerSlider
      banners={[
        {
          decorImages: [{ alt: '세종대', image }],
          desktopImage: image,
          title: '입시 배너',
        },
      ]}
      center="exam"
    />,
  )

  assert.match(html, /section-main-banner__logo-deco-layer/)
  assert.match(html, /grid-cols-\[minmax\(0,1fr\)_minmax\(240px,260px\)\]/)
  assert.match(html, /section-main-banner__logo-deco-wrap[^"]*self-end/)
  assert.match(html, /section-main-banner__logo-deco-wrap[^"]*items-end/)
  assert.match(
    html,
    /section-main-banner__logo-deco-wrap[^"]*min-\[769px\]:mb-\[var\(--section-main-banner-copy-bottom-offset\)\]/,
  )
  assert.doesNotMatch(html, /section-main-banner__logo-deco-wrap[^"]*items-center/)
  assert.doesNotMatch(html, /section-main-banner__logo-deco-wrap[^"]*right-\[8vw\]/)
  assert.doesNotMatch(html, /section-main-banner__logo-deco-wrap[^"]*top-1\/2/)
})

test('main banner skips marquee links when linked content is empty', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [],
    title: '메인 배너',
  })

  assert.doesNotMatch(html, /href=/)
})

test('main banner video uses viewport-specific image posters', () => {
  const html = render({
    desktopImage: image,
    desktopVideo,
    mobileImage,
    title: '메인 배너',
  })

  assert.match(html, /poster="\/media\/banner\.jpg\?2026-01-01T00%3A00%3A00\.000Z"/)
  assert.match(html, /poster="\/media\/banner-mobile\.jpg\?2026-01-01T00%3A00%3A00\.000Z"/)
})

test('main banner does not render statistics panels without statistics data', () => {
  const html = renderToStaticMarkup(
    <MainBannerSlider
      banners={[{ desktopImage: image, title: '입시 배너' }]}
      center="exam"
      statistics={null}
    />,
  )

  assert.doesNotMatch(html, /section-main-banner__stats/)
  assert.doesNotMatch(html, /section-main-banner__mobile-stats/)
  assert.doesNotMatch(html, /이달의 스케줄/)
})
