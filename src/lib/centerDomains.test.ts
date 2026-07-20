import assert from 'node:assert/strict'
import test from 'node:test'

import type { CenterSlug } from './centers'

import {
  centerDomainRoute,
  centerFromHostname,
  centerOrigin,
  publicCenterPath,
} from './centerDomains'

const centerSlugs: CenterSlug[] = ['art', 'avenue', 'exam', 'highteen', 'kids']

test('each center subdomain rewrites clean public paths to the existing center route', () => {
  for (const center of centerSlugs) {
    const rootRoute = centerDomainRoute(new URL(`${centerOrigin(center)}/`))
    const detailRoute = centerDomainRoute(
      new URL(`${centerOrigin(center)}/teachers/teacher-1?page=2`),
    )

    assert.equal(rootRoute?.type, 'rewrite')
    assert.equal(rootRoute?.url.pathname, `/${center}`)
    assert.equal(detailRoute?.type, 'rewrite')
    assert.equal(detailRoute?.url.pathname, `/${center}/teachers/teacher-1`)
    assert.equal(detailRoute?.url.search, '?page=2')
  }
})

test('center-prefixed paths redirect to clean paths on the matching subdomain', () => {
  const route = centerDomainRoute(
    new URL('https://art.baewooenm.com/art/teachers?category=camera'),
  )

  assert.equal(route?.type, 'redirect')
  assert.equal(route?.url.href, 'https://art.baewooenm.com/teachers?category=camera')
})

test('cross-center paths redirect to the requested center subdomain', () => {
  const route = centerDomainRoute(new URL('https://art.baewooenm.com/exam/consult'))

  assert.equal(route?.type, 'redirect')
  assert.equal(route?.url.href, 'https://exam.baewooenm.com/consult')
})

test('legacy center paths on the primary domain redirect to center subdomains', () => {
  const wwwRoute = centerDomainRoute(
    new URL('https://www.baewooenm.com/highteen/schedule?year=2026'),
  )
  const apexRoute = centerDomainRoute(new URL('https://baewooenm.com/kids'))

  assert.equal(wwwRoute?.type, 'redirect')
  assert.equal(wwwRoute?.url.href, 'https://highteen.baewooenm.com/schedule?year=2026')
  assert.equal(apexRoute?.type, 'redirect')
  assert.equal(apexRoute?.url.href, 'https://kids.baewooenm.com/')
})

test('the primary gate and shared operational routes are not rewritten', () => {
  assert.equal(centerDomainRoute(new URL('https://www.baewooenm.com/')), null)
  assert.equal(centerDomainRoute(new URL('https://exam.baewooenm.com/admin')), null)
  assert.equal(centerDomainRoute(new URL('https://kids.baewooenm.com/robots.txt')), null)
  assert.equal(centerDomainRoute(new URL('https://preview.example.com/art')), null)
})

test('center domain helpers only match complete center segments', () => {
  assert.equal(centerFromHostname('ART.baewooenm.com'), 'art')
  assert.equal(centerFromHostname('artist.baewooenm.com'), null)
  assert.equal(publicCenterPath('/art', 'art'), '/')
  assert.equal(publicCenterPath('/art/news/1', 'art'), '/news/1')
  assert.equal(publicCenterPath('/artist/news/1', 'art'), '/artist/news/1')
})
