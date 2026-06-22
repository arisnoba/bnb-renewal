import assert from 'node:assert/strict'
import test from 'node:test'

import { adminBarCenterHref } from './centerLinks'

test('adminBarCenterHref keeps the current center page when the target center supports it', () => {
  assert.equal(adminBarCenterHref('/art/news', 'kids'), '/kids/news')
  assert.equal(adminBarCenterHref('/kids/teachers/kim-seoha', 'highteen'), '/highteen/teachers/kim-seoha')
  assert.equal(adminBarCenterHref('/art/casting', 'avenue'), '/avenue/casting')
})

test('adminBarCenterHref sends unsupported center pages to the target center main', () => {
  assert.equal(adminBarCenterHref('/art/grade-system', 'exam'), '/exam')
  assert.equal(adminBarCenterHref('/art/casting', 'exam'), '/exam')
  assert.equal(adminBarCenterHref('/exam/special-system', 'art'), '/art')
  assert.equal(adminBarCenterHref('/highteen/special-lecture', 'kids'), '/kids')
  assert.equal(adminBarCenterHref('/art/curriculum/basic-class', 'kids'), '/kids')
})

test('adminBarCenterHref sends global and center main pages to the target center main', () => {
  assert.equal(adminBarCenterHref('/consult', 'exam'), '/exam')
  assert.equal(adminBarCenterHref('/art', 'kids'), '/kids')
  assert.equal(adminBarCenterHref('/art/not-a-center-page', 'kids'), '/kids')
})
