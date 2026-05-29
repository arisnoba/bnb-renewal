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

test('main banner skips marquee links when linked content is empty', () => {
  const html = render({
    desktopImage: image,
    marqueeItems: [],
    title: '메인 배너',
  })

  assert.doesNotMatch(html, /href=/)
})
