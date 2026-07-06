import assert from 'node:assert/strict'
import test from 'node:test'

import {
  reviewIdsFromRows,
  reviewRowsFromPickerValue,
} from './MainBannerExamReviewsPickerField.utils'

test('main banner exam review picker reads stored review rows', () => {
  assert.deepEqual(
    reviewIdsFromRows([
      { review: 3 },
      { review: { id: 5, title: '중앙대 합격후기' } },
      { review: { relationTo: 'exam-passed-reviews', value: 7 } },
      { review: 3 },
      { review: null },
    ]),
    [3, 5, 7],
  )
})

test('main banner exam review picker writes selected reviews into stored rows', () => {
  assert.deepEqual(
    reviewRowsFromPickerValue(
      [
        { relationTo: 'exam-passed-reviews', value: 5 },
        { relationTo: 'exam-passed-reviews', value: 7 },
        { relationTo: 'exam-passed-reviews', value: 5 },
      ],
      [
        { id: 'row-a', review: 3 },
        { id: 'row-b', review: 5 },
      ],
    ),
    [
      { id: 'row-b', review: 5 },
      { review: 7 },
    ],
  )
})
