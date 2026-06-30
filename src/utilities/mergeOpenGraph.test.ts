import assert from 'node:assert/strict'
import test from 'node:test'

import { centerOpenGraphImage, defaultOpenGraphImage, mergeOpenGraph } from './mergeOpenGraph'

test('open graph images resolve to absolute default asset URLs', () => {
  const originalServerUrl = process.env.NEXT_PUBLIC_SERVER_URL
  process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com'

  try {
    assert.deepEqual(defaultOpenGraphImage(), {
      height: 630,
      type: 'image/webp',
      url: 'https://example.com/website-template-OG.webp',
      width: 1200,
    })
    assert.deepEqual(centerOpenGraphImage('kids'), {
      height: 630,
      type: 'image/jpeg',
      url: 'https://example.com/assets/og/og-kids.jpg',
      width: 1200,
    })
  } finally {
    restoreServerUrl(originalServerUrl)
  }
})

test('mergeOpenGraph uses the center image as the fallback image', () => {
  const originalServerUrl = process.env.NEXT_PUBLIC_SERVER_URL
  process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com'

  try {
    const openGraph = mergeOpenGraph({ title: '뉴스 상세' }, { center: 'exam' })
    const images = openGraph?.images

    assert.ok(Array.isArray(images))
    assert.equal(
      (images[0] as { url?: string } | undefined)?.url,
      'https://example.com/assets/og/og-exam.jpg',
    )
    assert.equal(openGraph?.title, '뉴스 상세')
  } finally {
    restoreServerUrl(originalServerUrl)
  }
})

function restoreServerUrl(value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_SERVER_URL')
  } else {
    process.env.NEXT_PUBLIC_SERVER_URL = value
  }
}
