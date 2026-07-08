import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getImagePathFieldFileName,
  isProbablyImagePath,
} from './imagePathFieldPreview'

test('detects admin image preview proxy URLs as images from the key parameter', () => {
  assert.equal(
    isProbablyImagePath(
      '/api/admin-images?key=media%2Fexam-passed-reviews%2Fimages%2F1%2Fexam-passed-review-image-1-large.jpg',
    ),
    true,
  )
})

test('uses the proxied object key filename for admin image preview labels', () => {
  assert.equal(
    getImagePathFieldFileName(
      '/api/admin-images?key=media%2Fexam-passed-reviews%2Fimages%2F1%2Fexam-passed-review-image-1-large.jpg',
      '/media/exam-passed-reviews/images/1/exam-passed-review-image-1-large.jpg',
    ),
    'exam-passed-review-image-1-large.jpg',
  )
})

test('keeps non-image extensions out of image previews', () => {
  assert.equal(
    isProbablyImagePath('/api/admin-images?key=media%2Fexam-passed-reviews%2Fdocs%2Fresult.pdf'),
    false,
  )
})
