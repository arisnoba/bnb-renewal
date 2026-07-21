import assert from 'node:assert/strict'
import test from 'node:test'

import { adminBarCenterHref } from './centerLinks'

test('adminBarCenterHref keeps the current center page when the target center supports it', () => {
  assert.equal(adminBarCenterHref('/art/news', 'kids'), 'https://kids.baewooenm.com/news')
  assert.equal(
    adminBarCenterHref('/kids/teachers/kim-seoha', 'highteen'),
    'https://highteen.baewooenm.com/teachers/kim-seoha',
  )
  assert.equal(adminBarCenterHref('/art/casting', 'avenue'), 'https://avenue.baewooenm.com/casting')
  assert.equal(
    adminBarCenterHref('/art/direct-castings', 'kids'),
    'https://kids.baewooenm.com/direct-castings',
  )
  assert.equal(
    adminBarCenterHref('/art/direct-castings/sample-project', 'highteen'),
    'https://highteen.baewooenm.com/direct-castings/sample-project',
  )
  assert.equal(adminBarCenterHref('/art/company', 'kids'), 'https://kids.baewooenm.com/company')
  assert.equal(adminBarCenterHref('/art/consult', 'exam'), 'https://exam.baewooenm.com/consult')
  assert.equal(adminBarCenterHref('/art/curriculum', 'avenue'), 'https://avenue.baewooenm.com/curriculum')
  assert.equal(adminBarCenterHref('/art/curriculum', 'exam'), 'https://exam.baewooenm.com/curriculum')
  assert.equal(adminBarCenterHref('/art/curriculum', 'kids'), 'https://kids.baewooenm.com/curriculum')
  assert.equal(
    adminBarCenterHref('/art/curriculum/basic-class', 'avenue'),
    'https://avenue.baewooenm.com/curriculum/basic-class',
  )
  assert.equal(adminBarCenterHref('/art/grade-system', 'avenue'), 'https://avenue.baewooenm.com/grade-system')
  assert.equal(adminBarCenterHref('/exam/management', 'exam'), 'https://exam.baewooenm.com/management')
  assert.equal(
    adminBarCenterHref('/exam/passed-reviews/student-a', 'exam'),
    'https://exam.baewooenm.com/passed-reviews/student-a',
  )
})

test('adminBarCenterHref supports the public pathname shown on center subdomains', () => {
  assert.equal(adminBarCenterHref('/news', 'kids'), 'https://kids.baewooenm.com/news')
  assert.equal(
    adminBarCenterHref('/teachers/kim-seoha', 'highteen'),
    'https://highteen.baewooenm.com/teachers/kim-seoha',
  )
  assert.equal(adminBarCenterHref('/consult', 'exam'), 'https://exam.baewooenm.com/consult')
})

test('adminBarCenterHref sends unsupported center pages to the target center main', () => {
  assert.equal(adminBarCenterHref('/art/grade-system', 'exam'), 'https://exam.baewooenm.com')
  assert.equal(adminBarCenterHref('/art/casting', 'exam'), 'https://exam.baewooenm.com')
  assert.equal(adminBarCenterHref('/art/casting-status', 'exam'), 'https://exam.baewooenm.com')
  assert.equal(adminBarCenterHref('/art/casting-system', 'exam'), 'https://exam.baewooenm.com')
  assert.equal(adminBarCenterHref('/art/direct-castings', 'exam'), 'https://exam.baewooenm.com')
  assert.equal(adminBarCenterHref('/exam/special-system', 'art'), 'https://art.baewooenm.com')
  assert.equal(adminBarCenterHref('/highteen/special-lecture', 'kids'), 'https://kids.baewooenm.com')
  assert.equal(adminBarCenterHref('/art/curriculum/basic-class', 'kids'), 'https://kids.baewooenm.com')
})

test('adminBarCenterHref sends global and center main pages to the target center main', () => {
  assert.equal(adminBarCenterHref('/', 'exam'), 'https://exam.baewooenm.com')
  assert.equal(adminBarCenterHref('/art', 'kids'), 'https://kids.baewooenm.com')
  assert.equal(adminBarCenterHref('/art/not-a-center-page', 'kids'), 'https://kids.baewooenm.com')
})
