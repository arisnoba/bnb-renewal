import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detailModules = [
  './artist-press/ArtistPressDetailPage.tsx',
  './casting-status/CastingStatusDetailPage.tsx',
  './curriculum/CurriculumDetailPage.tsx',
  './direct-castings/DirectCastingDetailPage.tsx',
  './exam-passed-reviews/ExamPassedReviewDetailPage.tsx',
  './exam-results/ExamResultDetailPage.tsx',
  './profiles/ProfileDetailPage.tsx',
  './screen-appearances/ScreenAppearanceDetailPage.tsx',
  './teachers/TeacherDetailPage.tsx',
] as const

test('상세 조회 장애를 문서 미존재나 빈 탐색 결과로 변환하지 않는다', () => {
  for (const modulePath of detailModules) {
    const source = readFileSync(new URL(modulePath, import.meta.url), 'utf8')

    assert.doesNotMatch(source, /\.catch\(\(\) => null\)/, modulePath)
    assert.doesNotMatch(source, /\.catch\(\(\) => \(\{ docs: \[\] \}\)\)/, modulePath)
  }
})

test('캐스팅 출연현황 조회 장애를 빈 메인 화면으로 변환하지 않는다', () => {
  const source = readFileSync(
    new URL('./casting-status/CastingStatusPage.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(source, /catch\(\(\) => getEmptyCastingStatusOverview\(\)\)/)
})
