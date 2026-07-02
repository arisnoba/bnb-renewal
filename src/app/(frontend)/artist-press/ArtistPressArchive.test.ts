import assert from 'node:assert/strict'
import test from 'node:test'

import {
  artistPressArchiveDepth,
  artistPressArchiveSelect,
} from './ArtistPressArchive'

test('artist press archive selects agency relation for logo fallback', () => {
  assert.equal(artistPressArchiveDepth, 2)
  assert.equal(artistPressArchiveSelect.agency, true)
  assert.equal(artistPressArchiveSelect.agencyLogoMedia, true)
})
