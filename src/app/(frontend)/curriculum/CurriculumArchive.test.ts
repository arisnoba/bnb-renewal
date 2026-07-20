import assert from 'node:assert/strict'
import test from 'node:test'

import { curriculumContentCenter } from './CurriculumArchive'

test('커리큘럼 공개 페이지는 각 센터에 등록된 콘텐츠를 조회한다', () => {
  assert.equal(curriculumContentCenter('art'), 'art')
  assert.equal(curriculumContentCenter('highteen'), 'highteen')
  assert.equal(curriculumContentCenter('avenue'), 'avenue')
})
