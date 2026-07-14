import assert from 'node:assert/strict'
import test from 'node:test'
import type { Payload } from 'payload'

import {
  artistPressArchiveDepth,
  artistPressArchiveSelect,
  findArtistPressPage,
} from './ArtistPressArchive'

test('artist press archive selects agency relation for logo fallback', () => {
  assert.equal(artistPressArchiveDepth, 2)
  assert.equal(artistPressArchiveSelect.agency, true)
  assert.equal(artistPressArchiveSelect.agencyLogoMedia, true)
})

test('출신 아티스트 조회는 정상적인 빈 페이지를 그대로 반환한다', async () => {
  const emptyPage = {
    docs: [],
    page: 1,
    totalDocs: 0,
    totalPages: 0,
  }
  const payload = {
    find: async () => emptyPage,
  } as unknown as Payload

  assert.deepEqual(await findArtistPressPage({ center: 'art', page: 1, payload }), emptyPage)
})

test('출신 아티스트 조회 실패를 빈 페이지로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(
    findArtistPressPage({ center: 'art', page: 1, payload }),
    databaseError,
  )
})
