import assert from 'node:assert/strict'
import test from 'node:test'

import { Media } from './Media'

test('media upload uses prefix and filename as the duplicate boundary', () => {
  assert.equal(typeof Media.upload, 'object')

  if (typeof Media.upload !== 'object') {
    return
  }

  assert.deepEqual(Media.upload.filenameCompoundIndex, ['prefix', 'filename'])
})
