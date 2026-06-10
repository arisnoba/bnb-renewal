import assert from 'node:assert/strict'
import test from 'node:test'

import { centerLogoFor } from './centerLogos'

test('centerLogoFor returns center-specific common logo assets', () => {
  assert.equal(centerLogoFor('art').src, '/assets/common/logo/logo-art.svg')
  assert.equal(centerLogoFor('exam').src, '/assets/common/logo/logo-exam.svg')
  assert.equal(centerLogoFor('highteen').src, '/assets/common/logo/logo-highteen.svg')
  assert.equal(centerLogoFor('kids').src, '/assets/common/logo/logo-kids.svg')
})

test('centerLogoFor falls back to the art logo for avenue until its asset exists', () => {
  assert.equal(centerLogoFor('avenue').src, '/assets/common/logo/logo-art.svg')
  assert.equal(centerLogoFor('avenue').alt, '배우앤배움 애비뉴센터')
})
