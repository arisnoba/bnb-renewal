import assert from 'node:assert/strict'
import test from 'node:test'

import { familySitesFromFooter } from './familySites'

test('family sites use local fallback links with mobile-specific kid label', () => {
  const familySites = familySitesFromFooter(null)

  assert.deepEqual(
    familySites.map((site) => ({
      href: site.href,
      label: site.label,
      mobileLabel: site.mobileLabel,
    })),
    [
      { href: '/art', label: 'ART CENTER', mobileLabel: undefined },
      { href: '/exam', label: 'EXAM CENTER', mobileLabel: undefined },
      { href: '/highteen', label: 'HIGH TEEN CENTER', mobileLabel: undefined },
      { href: '/kids', label: 'KIDS CENTER', mobileLabel: 'KID CENTER' },
      { href: '/avenue', label: 'AVENUE CENTER', mobileLabel: undefined },
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
  assert.equal(familySites.find((site) => site.name === '아트센터')?.href, '/art')
})
