import assert from 'node:assert/strict'
import test from 'node:test'

import {
  centerSlugFromPathname,
  footerAddressLines,
  footerCenterInfoForPathname,
  type FooterCenterInfo,
} from './centerInfo'

const centerInfos: FooterCenterInfo[] = [
  {
    address: '서울특별시 서초구 사평대로55길 126',
    centerName: '아트센터',
    operationRegistrationNumber: '제10617호',
    url: '/art',
  },
  {
    address: '서울특별시 강남구 입시로 1\n2층',
    centerName: '배우앤배움 입시센터 학원',
    operationRegistrationNumber: '제99999호',
    url: '/exam',
  },
]

test('centerSlugFromPathname reads the first URL segment', () => {
  assert.equal(centerSlugFromPathname('/exam/news'), 'exam')
  assert.equal(centerSlugFromPathname('/profiles/kim'), null)
})

test('footerCenterInfoForPathname selects center-specific footer information', () => {
  const centerInfo = footerCenterInfoForPathname(centerInfos, '/exam')

  assert.equal(centerInfo.centerName, '배우앤배움 입시센터 학원')
  assert.equal(centerInfo.operationRegistrationNumber, '제99999호')
})

test('footerAddressLines renders company and selected center lines', () => {
  assert.deepEqual(footerAddressLines(centerInfos[1]!), [
    '(주)비앤비 인더스트리 | 사업자등록번호 : 105-87-39761',
    '배우앤배움 입시센터 학원 | 운영등록번호 : 제99999호',
    '서울특별시 강남구 입시로 1',
    '2층',
  ])
})
