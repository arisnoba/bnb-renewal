import assert from 'node:assert/strict'
import test from 'node:test'

import { canonicalPublicUrl } from './publicMetadata'

test('canonicalPublicUrl converts rewritten center paths to public subdomain URLs', () => {
  assert.equal(
    canonicalPublicUrl({
      host: 'art.baewooenm.com',
      pathname: '/art/news/6399',
    }),
    'https://art.baewooenm.com/news/6399'
  )
})

test('canonicalPublicUrl uses the canonical www host for shared routes', () => {
  assert.equal(
    canonicalPublicUrl({ host: 'baewooenm.com', pathname: '/' }),
    'https://www.baewooenm.com/'
  )
})
