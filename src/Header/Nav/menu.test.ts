import assert from 'node:assert/strict'
import test from 'node:test'

import { centers } from '@/lib/centers'
import { centerPublicHref } from '@/lib/centerDomains'

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

function itemsForGroup(center: Parameters<typeof getHeaderMenu>[0], key: string) {
  return getHeaderMenu(center).find((group) => group.key === key)?.items ?? []
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
  assert.ok(labels.includes('BNB 출연장면'))
  assert.ok(labels.includes('배우 케어 시스템'))
  assert.ok(labels.includes('촬영ㆍ오디션 스케줄'))
  assert.ok(labels.includes('BNB출신 아티스트'))
  assert.ok(labels.includes('NEWS&NOTICE'))
  assert.ok(!labels.includes('매니지먼트 시스템'))
  assert.ok(!labels.includes('온라인 상담신청'))
  assert.ok(labelsForGroup('art', 'artist').includes('BNB출신 아티스트'))
  assert.ok(labelsForGroup('art', 'artist').includes('BNB 루키'))
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'education')
      ?.items.find((item) => item.label === '교육진 소개')?.href,
    'https://art.baewooenm.com/teachers',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'education')
      ?.items.find((item) => item.label === '커리큘럼')?.href,
    'https://art.baewooenm.com/curriculum',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'casting')
      ?.items.find((item) => item.label === 'BNB 출연장면')?.href,
    'https://art.baewooenm.com/screen-appearances',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'casting')
      ?.items.find((item) => item.label === '캐스팅 출연현황')?.href,
    'https://art.baewooenm.com/casting-status',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'casting')
      ?.items.find((item) => item.label === '캐스팅 센터')?.href,
    'https://art.baewooenm.com/casting',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'casting')
      ?.items.find((item) => item.label === '배우 케어 시스템')?.href,
    'https://art.baewooenm.com/casting-system',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'casting')
      ?.items.find((item) => item.label === '촬영ㆍ오디션 스케줄')?.href,
    'https://art.baewooenm.com/schedule',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'artist')
      ?.items.find((item) => item.label === 'BNB출신 아티스트')?.href,
    'https://art.baewooenm.com/artist-press',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'artist')
      ?.items.find((item) => item.label === 'BNB 루키')?.href,
    'https://art.baewooenm.com/rookies',
  )
  assert.equal(
    getHeaderMenu('art')
      .find((group) => group.key === 'support')
      ?.items.find((item) => item.label === '입학안내')?.href,
    'https://art.baewooenm.com/admission',
  )
})

test('exam mega menu swaps casting and artist columns for exam-specific content', () => {
  const menu = getHeaderMenu('exam')
  const groupLabels = menu.map((group) => group.label)
  const labels = labelsFor('exam')

  assert.deepEqual(itemsForGroup('exam', 'about'), [
    { href: 'https://exam.baewooenm.com/company', label: '회사 소개' },
    { href: 'https://exam.baewooenm.com/about', label: '센터 소개' },
    { href: 'https://exam.baewooenm.com/facilities', label: '시설 안내' },
    { href: 'https://exam.baewooenm.com/map', label: '오시는 길' },
  ])
  assert.deepEqual(groupLabels, ['배우앤배움', '교육', '합격현황', '합격자소개', '지원센터'])
  assert.deepEqual(menu.map((group) => [group.key, 'href' in group]), [
    ['about', false],
    ['education', false],
    ['casting', false],
    ['artist', false],
    ['support', false],
  ])
  assert.deepEqual(itemsForGroup('exam', 'education'), [
    { href: 'https://exam.baewooenm.com/management', label: '입시 매니지먼트' },
    { href: 'https://exam.baewooenm.com/special-system', label: '특별한 시스템' },
    { href: 'https://exam.baewooenm.com/entertainment', label: '엔터테인먼트 위탁교육' },
    { href: 'https://exam.baewooenm.com/teachers', label: '교육진 소개' },
    { href: 'https://exam.baewooenm.com/curriculum', label: '커리큘럼' },
  ])
  assert.deepEqual(itemsForGroup('exam', 'casting'), [
    { href: 'https://exam.baewooenm.com/university-results', label: '대학교' },
    { href: 'https://exam.baewooenm.com/arts-high-results', label: '예술고등학교' },
  ])
  assert.deepEqual(itemsForGroup('exam', 'artist'), [
    { href: 'https://exam.baewooenm.com/passed-reviews', label: '합격 후기' },
    { href: 'https://exam.baewooenm.com/passed-videos', label: '합격 영상' },
  ])
  assert.ok(labels.includes('특별한 시스템'))
  assert.ok(!labels.includes('대표인사말'))
  assert.ok(!labels.includes('연혁'))
  assert.ok(!labels.includes('자회사 안내'))
  assert.ok(!labels.includes('장학제도'))
  assert.ok(!labels.includes('입시반 커리큘럼'))
  assert.ok(!labels.includes('수강생 합격후기'))
  assert.ok(!labels.includes('프로필 촬영ㆍ제작'))
  assert.ok(!labels.includes('온라인 상담신청'))
})

test('highteen mega menu matches the approved highteen structure', () => {
  const menu = getHeaderMenu('highteen')

  assert.deepEqual(
    menu.map((group) => group.label),
    ['배우앤배움', '교육', '캐스팅', '아티스트', '지원센터'],
  )
  assert.deepEqual(itemsForGroup('highteen', 'about'), [
    { href: 'https://highteen.baewooenm.com/company', label: '회사 소개' },
    { href: 'https://highteen.baewooenm.com/about', label: '센터 소개' },
    { href: 'https://highteen.baewooenm.com/facilities', label: '시설 안내' },
    { href: 'https://highteen.baewooenm.com/map', label: '오시는 길' },
  ])
  assert.deepEqual(itemsForGroup('highteen', 'education'), [
    { href: 'https://highteen.baewooenm.com/grade-system', label: '등급제 교육관리시스템' },
    { href: 'https://highteen.baewooenm.com/entertainment', label: '엔터테인먼트 위탁교육' },
    { href: 'https://highteen.baewooenm.com/teachers', label: '교육진 소개' },
    { href: 'https://highteen.baewooenm.com/curriculum', label: '커리큘럼' },
    { href: 'https://highteen.baewooenm.com/special-lecture', label: '하이틴센터 특강' },
  ])
  assert.deepEqual(itemsForGroup('highteen', 'casting'), [
    { href: 'https://highteen.baewooenm.com/screen-appearances', label: 'BNB 출연장면' },
    { href: 'https://highteen.baewooenm.com/casting-status', label: '캐스팅 출연현황' },
    { href: 'https://highteen.baewooenm.com/casting', label: '캐스팅 센터' },
    { href: 'https://highteen.baewooenm.com/casting-system', label: '배우 케어 시스템' },
    { href: 'https://highteen.baewooenm.com/schedule', label: '촬영ㆍ오디션 스케줄' },
  ])
  assert.deepEqual(itemsForGroup('highteen', 'artist'), [
    { href: 'https://highteen.baewooenm.com/artist-press', label: 'BNB 출신 아티스트' },
    { href: 'https://highteen.baewooenm.com/rookies', label: 'BNB 루키' },
  ])
  assert.ok(!labelsFor('highteen').includes('대표인사말'))
  assert.ok(!labelsFor('highteen').includes('BNB 캐스팅'))
  assert.ok(!labelsFor('highteen').includes('IMGround 캐스팅'))
  assert.ok(!labelsFor('highteen').includes('BX모델에이전시'))
  assert.ok(!labelsFor('highteen').includes('다이렉트 캐스팅'))
  assert.ok(!labelsFor('highteen').includes('BNB 캐스팅 섭외뉴스'))
  assert.ok(!labelsFor('highteen').includes('매니지먼트 시스템'))
  assert.ok(!labelsFor('highteen').includes('프로필 촬영ㆍ제작'))
  assert.ok(!labelsFor('highteen').includes('오디션 지원하기'))
})

test('kids mega menu matches the approved kids structure', () => {
  assert.deepEqual(
    getHeaderMenu('kids').map((group) => group.label),
    ['배우앤배움', '교육', '캐스팅', '아티스트', '지원센터'],
  )
  assert.deepEqual(itemsForGroup('kids', 'about'), [
    { href: 'https://kids.baewooenm.com/company', label: '회사 소개' },
    { href: 'https://kids.baewooenm.com/about', label: '센터 소개' },
    { href: 'https://kids.baewooenm.com/facilities', label: '시설 안내' },
    { href: 'https://kids.baewooenm.com/map', label: '오시는 길' },
  ])
  assert.deepEqual(itemsForGroup('kids', 'education'), [
    { href: 'https://kids.baewooenm.com/grade-system', label: '등급제 교육관리시스템' },
    { href: 'https://kids.baewooenm.com/entertainment', label: '엔터테인먼트 위탁교육' },
    { href: 'https://kids.baewooenm.com/curriculum', label: '커리큘럼' },
    { href: 'https://kids.baewooenm.com/teachers', label: '교육진 소개' },
  ])
  assert.deepEqual(itemsForGroup('kids', 'casting'), [
    { href: 'https://kids.baewooenm.com/screen-appearances', label: 'BNB 출연장면' },
    { href: 'https://kids.baewooenm.com/casting-status', label: '캐스팅 출연현황' },
    { href: 'https://kids.baewooenm.com/casting', label: '캐스팅 센터' },
    { href: 'https://kids.baewooenm.com/casting-system', label: '배우 케어 시스템' },
    { href: 'https://kids.baewooenm.com/schedule', label: '촬영ㆍ오디션 스케줄' },
  ])
  assert.deepEqual(itemsForGroup('kids', 'artist'), [
    { href: 'https://kids.baewooenm.com/artist-press', label: 'BNB 출신 아티스트' },
    { href: 'https://kids.baewooenm.com/rookies', label: 'BNB 루키' },
  ])
  assert.ok(!labelsFor('kids').includes('대표인사말'))
  assert.ok(!labelsFor('kids').includes('영재 교육과정'))
  assert.ok(!labelsFor('kids').includes('아역배우 교육과정'))
  assert.ok(!labelsFor('kids').includes('아티스트 교육과정'))
  assert.ok(!labelsFor('kids').includes('BNB 캐스팅'))
  assert.ok(!labelsFor('kids').includes('IMGround 캐스팅'))
  assert.ok(!labelsFor('kids').includes('매니지먼트 시스템'))
  assert.ok(!labelsFor('kids').includes('아역배우 프로필'))
  assert.ok(!labelsFor('kids').includes('프로필 촬영ㆍ제작'))
})

test('all center support menus match art support labels', () => {
  const artSupportLabels = supportLabelsFor('art')

  for (const center of Object.keys(centers) as Parameters<typeof getHeaderMenu>[0][]) {
    assert.deepEqual(supportLabelsFor(center), artSupportLabels)
  }
})

test('all center support menus link to the how-to-use page', () => {
  for (const center of Object.keys(centers) as Parameters<typeof getHeaderMenu>[0][]) {
    assert.equal(
      getHeaderMenu(center)
        .find((group) => group.key === 'support')
        ?.items.find((item) => item.label === '학원100%이용법')?.href,
      centerPublicHref(center, '/how-to-use'),
    )
  }
})

test('avenue mega menu matches the art baseline structure for preparation', () => {
  const avenueMenu = getHeaderMenu('avenue')

  assert.deepEqual(
    avenueMenu.map((group) => group.label),
    ['배우앤배움', '교육', '캐스팅', '아티스트', '지원센터'],
  )
  assert.deepEqual(itemsForGroup('avenue', 'about'), [
    { href: 'https://avenue.baewooenm.com/company', label: '회사 소개' },
    { href: 'https://avenue.baewooenm.com/about', label: '센터 소개' },
    { href: 'https://avenue.baewooenm.com/facilities', label: '시설 안내' },
    { href: 'https://avenue.baewooenm.com/map', label: '오시는 길' },
  ])
  assert.deepEqual(itemsForGroup('avenue', 'education'), [
    { href: 'https://avenue.baewooenm.com/grade-system', label: '등급제 교육관리시스템' },
    { href: 'https://avenue.baewooenm.com/entertainment', label: '엔터테인먼트 위탁교육' },
    { href: 'https://avenue.baewooenm.com/teachers', label: '교육진 소개' },
    { href: 'https://avenue.baewooenm.com/curriculum', label: '커리큘럼' },
  ])
  assert.deepEqual(itemsForGroup('avenue', 'casting'), [
    { href: 'https://avenue.baewooenm.com/screen-appearances', label: 'BNB 출연장면' },
    { href: 'https://avenue.baewooenm.com/casting-status', label: '캐스팅 출연현황' },
    { href: 'https://avenue.baewooenm.com/casting', label: '캐스팅 센터' },
    { href: 'https://avenue.baewooenm.com/casting-system', label: '배우 케어 시스템' },
    { href: 'https://avenue.baewooenm.com/schedule', label: '촬영ㆍ오디션 스케줄' },
  ])
  assert.deepEqual(itemsForGroup('avenue', 'artist'), [
    { href: 'https://avenue.baewooenm.com/artist-press', label: 'BNB출신 아티스트' },
    { href: 'https://avenue.baewooenm.com/rookies', label: 'BNB 루키' },
  ])
  assert.deepEqual(itemsForGroup('avenue', 'support'), itemsForGroup('art', 'support').map((item) => ({
    ...item,
    href: item.href.replace('https://art.baewooenm.com/', 'https://avenue.baewooenm.com/'),
  })))
  assert.ok(!labelsFor('avenue').includes('애비뉴센터 소개'))
  assert.ok(!labelsFor('avenue').includes('제휴업체'))
  assert.ok(!labelsFor('avenue').includes('프로필 촬영'))
})

test('center casting status menu items link to the casting status page', () => {
  for (const center of ['kids', 'highteen'] as const) {
    assert.equal(
      getHeaderMenu(center)
        .find((group) => group.key === 'casting')
        ?.items.find((item) => item.href === centerPublicHref(center, '/casting-status'))?.href,
      centerPublicHref(center, '/casting-status'),
    )
  }
})
