import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import type { CenterSlug } from '@/lib/centers'

import { getFacilityImages } from './facilityImages'

const expectedFacilities: Record<CenterSlug, { count: number; folder: string }> = {
  art: { count: 34, folder: 'art-avenue' },
  avenue: { count: 34, folder: 'art-avenue' },
  exam: { count: 39, folder: 'exam' },
  highteen: { count: 32, folder: 'highteen' },
  kids: { count: 34, folder: 'kids' },
}

test('facility galleries use the image folder assigned to each center', () => {
  for (const [center, expected] of Object.entries(expectedFacilities)) {
    const images = getFacilityImages(center as CenterSlug)

    assert.equal(images.length, expected.count)
    assert.ok(
      images.every((image) => image.src.startsWith(`/assets/facilities/${expected.folder}/`)),
    )
  }
})

test('every configured facility image exists in public assets', () => {
  for (const center of Object.keys(expectedFacilities) as CenterSlug[]) {
    for (const image of getFacilityImages(center)) {
      assert.equal(
        existsSync(path.join(process.cwd(), 'public', image.src)),
        true,
        `${center} 시설 이미지가 없습니다: ${image.src}`,
      )
    }
  }
})

test('exam facility gallery preserves the image number gap in its folder', () => {
  const sources = getFacilityImages('exam').map((image) => image.src)

  assert.ok(sources.includes('/assets/facilities/exam/img_35.png'))
  assert.ok(!sources.includes('/assets/facilities/exam/img_36.png'))
  assert.ok(!sources.includes('/assets/facilities/exam/img_37.png'))
  assert.ok(sources.includes('/assets/facilities/exam/img_38.png'))
})
