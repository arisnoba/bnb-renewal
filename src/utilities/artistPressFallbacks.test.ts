import assert from 'node:assert/strict'
import test from 'node:test'

import type { ArtistPress, ArtistPressAgency, Media } from '@/payload-types'

import {
  getArtistPressAgencyLogoMedia,
  getArtistPressThumbnailMedia,
} from './artistPressFallbacks'

const thumbnailMedia = { id: 10, url: '/media/thumbnail.jpg' } as Media
const metaImageMedia = { id: 11, url: '/media/meta-image.jpg' } as Media
const directAgencyLogoMedia = { id: 20, url: '/media/direct-agency-logo.jpg' } as Media
const linkedAgencyLogoMedia = { id: 21, url: '/media/linked-agency-logo.jpg' } as Media

test('artist press thumbnail falls back to SEO image media', () => {
  assert.equal(
    getArtistPressThumbnailMedia({
      meta: {
        image: metaImageMedia,
      },
    } as Partial<ArtistPress>),
    metaImageMedia,
  )

  assert.equal(
    getArtistPressThumbnailMedia({
      meta: {
        image: metaImageMedia,
      },
      thumbnailMedia,
    } as Partial<ArtistPress>),
    thumbnailMedia,
  )
})

test('artist press agency logo falls back to linked agency logo media', () => {
  const agency = {
    id: 1,
    agencyName: '테스트 소속사',
    logoMedia: linkedAgencyLogoMedia,
  } as ArtistPressAgency

  assert.equal(
    getArtistPressAgencyLogoMedia({
      agency,
    } as Partial<ArtistPress>),
    linkedAgencyLogoMedia,
  )

  assert.equal(
    getArtistPressAgencyLogoMedia({
      agency,
      agencyLogoMedia: directAgencyLogoMedia,
    } as Partial<ArtistPress>),
    directAgencyLogoMedia,
  )
})
