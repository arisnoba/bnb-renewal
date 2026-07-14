import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig } from 'payload'

import { Agencies } from './Agencies'
import { ArtistPress } from './ArtistPress'
import { CastingDirectors } from './CastingDirectors'
import { DirectCastings } from './DirectCastings'
import { ExamPassedReviews } from './ExamPassedReviews'
import { ExamResults } from './ExamResults'
import { Faqs } from './Faqs'
import { HighteenSpecialClasses } from './HighteenSpecialClasses'
import { MainBanners } from './MainBanners'
import { News } from './News'
import { SocialLinks } from './SocialLinks'
import { StarCards } from './StarCards'

const displayStatusCollections = [
  Agencies,
  ArtistPress,
  CastingDirectors,
  ExamPassedReviews,
  ExamResults,
  Faqs,
  HighteenSpecialClasses,
  News,
  SocialLinks,
  StarCards,
]

async function readAccess(config: CollectionConfig, user?: unknown) {
  const access = config.access?.read

  assert.equal(typeof access, 'function', `${config.slug} read access가 필요합니다.`)

  return access?.({ req: { user } } as never)
}

test('비로그인 사용자는 공개 상태 문서만 읽을 수 있다', async () => {
  for (const config of displayStatusCollections) {
    assert.deepEqual(await readAccess(config), {
      displayStatus: {
        equals: 'published',
      },
    })
  }

  assert.deepEqual(await readAccess(MainBanners), {
    status: {
      equals: 'published',
    },
  })
})

test('로그인 관리자와 센터 관리자의 기존 읽기 범위를 유지한다', async () => {
  assert.equal(await readAccess(News, { role: 'master' }), true)
  assert.deepEqual(await readAccess(News, { center: 'kids', role: 'manager' }), {
    or: [
      { centers: { contains: 'kids' } },
      { centers: { contains: 'all' } },
    ],
  })
  assert.deepEqual(await readAccess(SocialLinks, { center: 'kids', role: 'manager' }), {
    center: {
      equals: 'kids',
    },
  })
  assert.equal(await readAccess(MainBanners, { center: 'kids', role: 'manager' }), true)
})

test('기존 비공개 다이렉트캐스팅 API는 비로그인 요청을 계속 거부한다', async () => {
  assert.equal(await readAccess(DirectCastings), false)
})

test('캐스팅 디렉터 회사는 등록 가능한 회사만 선택하도록 구성한다', () => {
  const companyField = CastingDirectors.fields
    ?.flatMap((field) => ('fields' in field && Array.isArray(field.fields) ? field.fields : [field]))
    .find((field) => 'name' in field && field.name === 'company')

  assert.equal(companyField?.type, 'select')
  assert.deepEqual(companyField?.options, [
    { label: 'BNB Casting', value: 'BNB Casting' },
    { label: 'CNA Agency', value: 'CNA Agency' },
    { label: 'ARKO LAB', value: 'ARKO LAB' },
    { label: 'IMGround', value: 'IMGround' },
    { label: 'BX Model Agency', value: 'BX Model Agency' },
  ])
})
