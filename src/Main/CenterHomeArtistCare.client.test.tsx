import assert from 'node:assert/strict'
import test from 'node:test'

import {
  artistCareExpandedIndex,
  artistCareViewportStartIndex,
  artistCareVisibleSlideCount,
} from './CenterHomeArtistCare.client'

test('center home artist care calculates how many cards fit inside the container', () => {
  assert.equal(artistCareVisibleSlideCount({ containerWidth: 390, slideWidth: 288, spaceBetween: 20 }), 1)
  assert.equal(artistCareVisibleSlideCount({ containerWidth: 1160, slideWidth: 360, spaceBetween: 40 }), 3)
  assert.equal(artistCareVisibleSlideCount({ containerWidth: 0, slideWidth: 288, spaceBetween: 20 }), 1)
})

test('center home artist care keeps the final group filled while active moves across slots', () => {
  assert.equal(
    artistCareViewportStartIndex({ itemCount: 8, selectedIndex: 5, visibleSlideCount: 3 }),
    5,
  )
  assert.equal(
    artistCareViewportStartIndex({ itemCount: 8, selectedIndex: 6, visibleSlideCount: 3 }),
    5,
  )
  assert.equal(
    artistCareViewportStartIndex({ itemCount: 8, selectedIndex: 7, visibleSlideCount: 3 }),
    5,
  )
})

test('center home artist care can still place the last card first on one-card viewports', () => {
  assert.equal(
    artistCareViewportStartIndex({ itemCount: 8, selectedIndex: 7, visibleSlideCount: 1 }),
    7,
  )
})

test('center home artist care uses hover preview only while it is valid', () => {
  assert.equal(artistCareExpandedIndex({ activeIndex: 2, itemCount: 8, previewIndex: null }), 2)
  assert.equal(artistCareExpandedIndex({ activeIndex: 2, itemCount: 8, previewIndex: 5 }), 5)
  assert.equal(artistCareExpandedIndex({ activeIndex: 2, itemCount: 8, previewIndex: 8 }), 2)
  assert.equal(artistCareExpandedIndex({ activeIndex: 2, itemCount: 0, previewIndex: 0 }), -1)
})
