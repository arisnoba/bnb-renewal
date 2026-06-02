import assert from 'node:assert/strict'
import test from 'node:test'

import type { Media } from '@/payload-types'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { MainBannerSlider, type MainBannerSlide } from './BannerSlider.client'

const image = {
  id: 1,
  alt: '배너 이미지',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: '/media/banner.jpg',
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
  assert.doesNotMatch(html, /aria-hidden="true" class="section-main-banner__profile-set"/)
})


test('main banner renders exam review cards with review buttons', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [
      {
        type: 'card',
        buttonLabel: '후기 보기',
        href: '/exam#exam-passed-reviews',
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
  assert.match(html, /href="\/exam#exam-passed-reviews"/)
})

test('main banner skips marquee links when linked content is empty', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [],
    title: '메인 배너',
  })

  assert.doesNotMatch(html, /href=/)
})
