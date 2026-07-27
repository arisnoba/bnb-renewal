import assert from 'node:assert/strict'
import test from 'node:test'

import { centerLocations } from './centerLocations'
import { centerLogoFor } from './centerLogos'

test('centerLogoFor returns center-specific common logo assets', () => {
  assert.equal(centerLogoFor('art').src, '/assets/common/logo/logo-art.svg')
  assert.equal(centerLogoFor('avenue').src, '/assets/common/logo/logo-avenue.svg')
  assert.equal(centerLogoFor('exam').src, '/assets/common/logo/logo-exam.svg')
  assert.equal(centerLogoFor('highteen').src, '/assets/common/logo/logo-highteen.svg')
  assert.equal(centerLogoFor('kids').src, '/assets/common/logo/logo-kids.svg')
})

test('avenue uses its own logo dimensions and map asset', () => {
  assert.deepEqual(centerLogoFor('avenue'), {
    alt: '배우앤배움 애비뉴센터',
    height: 42,
    src: '/assets/common/logo/logo-avenue.svg',
    width: 138,
  })
  assert.equal(centerLocations.avenue.logoSrc, '/assets/common/logo/logo-avenue.svg')
})
