import assert from 'node:assert/strict'
import test from 'node:test'

import { familySitesFromFooter } from './familySites'

test('family sites use center subdomains with mobile-specific kid label', () => {
  const familySites = familySitesFromFooter(null)

  assert.deepEqual(
    familySites.map((site) => ({
      href: site.href,
      label: site.label,
      mobileLabel: site.mobileLabel,
    })),
    [
      { href: 'https://art.baewooenm.com', label: 'ART CENTER', mobileLabel: undefined },
      { href: 'https://exam.baewooenm.com', label: 'EXAM CENTER', mobileLabel: undefined },
      {
        href: 'https://highteen.baewooenm.com',
        label: 'HIGH TEEN CENTER',
        mobileLabel: undefined,
      },
      {
        href: 'https://kids.baewooenm.com',
        label: 'KIDS CENTER',
        mobileLabel: 'KID CENTER',
      },
      {
        href: 'https://avenue.baewooenm.com',
        label: 'AVENUE CENTER',
        mobileLabel: undefined,
      },
    ],
  )
})

test('family sites prefer footer center URLs when configured', () => {
  const familySites = familySitesFromFooter({
    centerInfos: [
      {
        address: '서울시 서초구',
        centerName: '입시센터',
        operationRegistrationNumber: '제1호',
        url: 'https://exam.example.com',
      },
    ],
  })

  assert.equal(familySites.find((site) => site.name === '입시센터')?.href, 'https://exam.example.com')
  assert.equal(familySites.find((site) => site.name === '아트센터')?.href, 'https://art.baewooenm.com')
})

test('family sites normalize legacy official center URLs', () => {
  const familySites = familySitesFromFooter({
    centerInfos: [
      {
        address: '서울시 서초구',
        centerName: '아트센터',
        operationRegistrationNumber: '제1호',
        url: 'https://www.baewooenm.com/art',
      },
      {
        address: '서울시 강남구',
        centerName: '키즈센터',
        operationRegistrationNumber: '제2호',
        url: '/kids',
      },
    ],
  })

  assert.equal(familySites.find((site) => site.name === '아트센터')?.href, 'https://art.baewooenm.com')
  assert.equal(familySites.find((site) => site.name === '키즈센터')?.href, 'https://kids.baewooenm.com')
})
