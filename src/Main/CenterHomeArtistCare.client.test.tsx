import assert from 'node:assert/strict'
import test from 'node:test'

import { artistCareSlidesOffsetAfter } from './CenterHomeArtistCare.client'

test('center home artist care keeps enough trailing space for the last card to become active', () => {
  assert.equal(artistCareSlidesOffsetAfter(390, 288), 102)
  assert.equal(artistCareSlidesOffsetAfter(1160, 360), 800)
})

test('center home artist care does not add trailing space when dimensions are unavailable', () => {
  assert.equal(artistCareSlidesOffsetAfter(0, 288), 0)
  assert.equal(artistCareSlidesOffsetAfter(390, 0), 0)
  assert.equal(artistCareSlidesOffsetAfter(288, 390), 0)
})
