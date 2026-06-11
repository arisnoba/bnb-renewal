import assert from 'node:assert/strict'
import test from 'node:test'

import { centers } from '@/lib/centers'

import { getHeaderMenu, headerCenterFromPathname } from './menu'

function labelsFor(center: Parameters<typeof getHeaderMenu>[0]) {
  return getHeaderMenu(center).flatMap((group) => [group.label, ...group.items.map((item) => item.label)])
}

function supportLabelsFor(center: Parameters<typeof getHeaderMenu>[0]) {
  return getHeaderMenu(center).find((group) => group.key === 'support')?.items.map((item) => item.label) ?? []
}

function labelsForGroup(center: Parameters<typeof getHeaderMenu>[0], key: string) {
  return getHeaderMenu(center).find((group) => group.key === key)?.items.map((item) => item.label) ?? []
}

test('headerCenterFromPathname reads the first center segment with art fallback', () => {
  assert.equal(headerCenterFromPathname('/exam/news'), 'exam')
  assert.equal(headerCenterFromPathname('/kids/profiles/kim-seoha'), 'kids')
  assert.equal(headerCenterFromPathname('/news/news-highteen-1890'), 'art')
})

test('art mega menu exposes Figma baseline menu labels', () => {
  const menu = getHeaderMenu('art')
  const labels = labelsFor('art')

  assert.deepEqual(
    menu.map((group) => group.label),
    ['배우앤배움', '교육', '캐스팅', '아티스트', '지원센터'],
  )
  assert.ok(labels.includes('센터 소개'))
  assert.ok(labels.includes('등급제 교육관리시스템'))
  assert.ok(labels.includes('드라마ㆍ광고 출연장면'))
  assert.ok(labels.includes('캐스팅 시스템'))
  assert.ok(labels.includes('이달의 촬영ㆍ오디션 스케줄'))
  assert.ok(labels.includes('BNB출신 아티스트'))
  assert.ok(labels.includes('NEWS&NOTICE'))
  assert.ok(!labels.includes('매니지먼트 시스템'))
  assert.ok(!labels.includes('온라인 상담신청'))
  assert.ok(labelsForGroup('art', 'artist').includes('BNB출신 아티스트'))
  assert.ok(labelsForGroup('art', 'artist').includes('BNB 루키'))
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'artist')
      ?.items.find((item) => item.label === 'BNB출신 아티스트')?.href,
    '/art/artist-press',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'artist')
      ?.items.find((item) => item.label === 'BNB 루키')?.href,
    '/art/rookies',
  )
})

test('exam mega menu swaps casting and artist columns for exam-specific content', () => {
  const menu = getHeaderMenu('exam')
  const groupLabels = menu.map((group) => group.label)
  const labels = labelsFor('exam')

  assert.deepEqual(labelsForGroup('exam', 'about'), labelsForGroup('art', 'about'))
  assert.ok(groupLabels.includes('합격현황'))
  assert.ok(groupLabels.includes('합격자 소개'))
  assert.ok(labels.includes('입시반 커리큘럼'))
  assert.ok(labels.includes('대학교 합격현황'))
  assert.ok(labels.includes('수강생 합격후기'))
  assert.ok(!labels.includes('대표인사말'))
  assert.ok(!labels.includes('연혁'))
  assert.ok(!labels.includes('자회사 안내'))
  assert.ok(!labels.includes('장학제도'))
  assert.ok(!labels.includes('온라인 상담신청'))
})

test('all center support menus match art support labels', () => {
  const artSupportLabels = supportLabelsFor('art')

  for (const center of Object.keys(centers) as Parameters<typeof getHeaderMenu>[0][]) {
    assert.deepEqual(supportLabelsFor(center), artSupportLabels)
  }
})

test('avenue mega menu uses the avenue one-page structure', () => {
  const labels = labelsFor('avenue')

  assert.ok(labels.includes('애비뉴센터 소개'))
  assert.ok(labels.includes('제휴업체'))
  assert.ok(labels.includes('캐스팅/모집 안내'))
  assert.ok(!labels.includes('온라인 상담신청'))
  assert.ok(labels.includes('NEWS&NOTICE'))
})
