import assert from 'node:assert/strict'
import test from 'node:test'

import { getHeaderMenu, headerCenterFromPathname } from './menu'

function labelsFor(center: Parameters<typeof getHeaderMenu>[0]) {
  return getHeaderMenu(center).flatMap((group) => [group.label, ...group.items.map((item) => item.label)])
}

test('headerCenterFromPathname reads the first center segment with art fallback', () => {
  assert.equal(headerCenterFromPathname('/exam/news'), 'exam')
  assert.equal(headerCenterFromPathname('/kids/profiles/kim-seoha'), 'kids')
  assert.equal(headerCenterFromPathname('/news/news-highteen-1890'), 'art')
})

test('art mega menu exposes Figma baseline menu labels', () => {
  const labels = labelsFor('art')

  assert.ok(labels.includes('배우앤배움'))
  assert.ok(labels.includes('아트센터 소개'))
  assert.ok(labels.includes('등급제 교육관리시스템'))
  assert.ok(labels.includes('드라마ㆍ광고 출연장면'))
  assert.ok(labels.includes('BNB출신 아티스트'))
  assert.ok(labels.includes('NEWS&NOTICE'))
})

test('exam mega menu swaps casting and artist columns for exam-specific content', () => {
  const menu = getHeaderMenu('exam')
  const groupLabels = menu.map((group) => group.label)
  const labels = labelsFor('exam')

  assert.ok(groupLabels.includes('합격현황'))
  assert.ok(groupLabels.includes('합격자 소개'))
  assert.ok(labels.includes('입시반 커리큘럼'))
  assert.ok(labels.includes('대학교 합격현황'))
  assert.ok(labels.includes('수강생 합격후기'))
  assert.ok(labels.includes('장학제도'))
})

test('avenue mega menu uses the avenue one-page structure', () => {
  const labels = labelsFor('avenue')

  assert.ok(labels.includes('애비뉴센터 소개'))
  assert.ok(labels.includes('제휴업체'))
  assert.ok(labels.includes('캐스팅/모집 안내'))
  assert.ok(labels.includes('온라인 상담신청'))
})
