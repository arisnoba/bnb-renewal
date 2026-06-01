import assert from 'node:assert/strict'
import test from 'node:test'

import type { Media, SocialLink } from '@/payload-types'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  SOCIAL_LINKS_LIMIT,
  SocialLinksList,
  buildSocialLinksFindOptions,
} from './SocialLinksSection'

const image = {
  id: 1,
  alt: '인스타그램 이미지',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: '/media/social.jpg',
} as Media

function socialLink(data: Partial<SocialLink>): SocialLink {
  return {
    center: 'art',
    createdAt: '2026-01-01T00:00:00.000Z',
    displayStatus: 'published',
    externalUrl: 'https://www.instagram.com/baewoo',
    id: 1,
    representativeImage: image,
    title: '인스타그램',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...data,
  } as SocialLink
}

test('social links query uses center, published status, newest sort, and limit', () => {
  assert.deepEqual(buildSocialLinksFindOptions('kids'), {
    collection: 'social-links',
    depth: 1,
    limit: SOCIAL_LINKS_LIMIT,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    where: {
      center: {
        equals: 'kids',
      },
      displayStatus: {
        equals: 'published',
      },
    },
  })
})

test('social links section renders nothing when no visible items exist', () => {
  assert.equal(renderToStaticMarkup(<SocialLinksList links={[]} />), '')
  assert.equal(
    renderToStaticMarkup(
      <SocialLinksList links={[socialLink({ externalUrl: '', representativeImage: image })]} />,
    ),
    '',
  )
})

test('social links render image anchors to external URLs', () => {
  const html = renderToStaticMarkup(<SocialLinksList links={[socialLink({})]} />)

  assert.match(html, /href="https:\/\/www\.instagram\.com\/baewoo"/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /src="\/media\/social\.jpg\?2026-01-01T00%3A00%3A00\.000Z"/)
  assert.match(html, /alt="인스타그램 이미지"/)
})

test('social links render representative image URL when upload media is empty', () => {
  const html = renderToStaticMarkup(
    <SocialLinksList
      links={[
        socialLink({
          representativeImage: null,
          representativeImageUrl: 'https://cdn.example.com/social.jpg',
        }),
      ]}
    />,
  )

  assert.match(html, /src="https:\/\/cdn\.example\.com\/social\.jpg"/)
})
