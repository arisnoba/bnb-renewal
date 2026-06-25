import assert from 'node:assert/strict'
import test from 'node:test'

import { publishedArtistPressWhere } from './artistPressVisibility'

test('artist press visibility includes art center content for other centers', () => {
  assert.deepEqual(publishedArtistPressWhere('highteen'), {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        or: [
          {
            centers: {
              contains: 'highteen',
            },
          },
          {
            centers: {
              contains: 'all',
            },
          },
          {
            centers: {
              contains: 'art',
            },
          },
        ],
      },
    ],
  })
})

test('artist press visibility keeps non-center queries globally published only', () => {
  assert.deepEqual(publishedArtistPressWhere(), {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
    ],
  })
})
