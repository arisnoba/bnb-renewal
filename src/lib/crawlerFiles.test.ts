import assert from 'node:assert/strict'
import test from 'node:test'

import {
  crawlerOrigin,
  generateRobotsTxt,
  generateSitemapXml,
  sitemapURLs,
} from './crawlerFiles'

test('crawlerOrigin preserves center hosts and canonicalizes the apex host', () => {
  assert.equal(crawlerOrigin(new Request('https://art.baewooenm.com/robots.txt')), 'https://art.baewooenm.com')
  assert.equal(crawlerOrigin(new Request('https://baewooenm.com/robots.txt')), 'https://www.baewooenm.com')
})

test('crawlerOrigin respects Vercel forwarded host and protocol headers', () => {
  const request = new Request('http://internal.vercel.app/robots.txt', {
    headers: {
      'x-forwarded-host': 'kids.baewooenm.com',
      'x-forwarded-proto': 'https',
    },
  })

  assert.equal(crawlerOrigin(request), 'https://kids.baewooenm.com')
})

test('robots.txt allows public pages, blocks operational paths, and points to the same host sitemap', () => {
  assert.equal(
    generateRobotsTxt('https://exam.baewooenm.com'),
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api',
      '',
      'Sitemap: https://exam.baewooenm.com/sitemap.xml',
      '',
    ].join('\n'),
  )
})

test('center sitemap uses the center menu without leaking URLs from sibling hosts', () => {
  const urls = sitemapURLs('https://exam.baewooenm.com')

  assert.equal(urls[0], 'https://exam.baewooenm.com/')
  assert.ok(urls.includes('https://exam.baewooenm.com/management'))
  assert.ok(urls.includes('https://exam.baewooenm.com/university-results'))
  assert.ok(urls.includes('https://exam.baewooenm.com/arts-high-results'))
  assert.ok(urls.includes('https://exam.baewooenm.com/passed-reviews'))
  assert.ok(urls.includes('https://exam.baewooenm.com/consult'))
  assert.equal(urls.length, new Set(urls).size)
  assert.ok(urls.every((url) => url.startsWith('https://exam.baewooenm.com/')))
  assert.ok(!urls.includes('https://exam.baewooenm.com/casting-status'))
})

test('center sitemap excludes the inactive schedule page', () => {
  for (const center of ['art', 'avenue', 'highteen', 'kids']) {
    assert.ok(!sitemapURLs(`https://${center}.baewooenm.com`).includes(
      `https://${center}.baewooenm.com/schedule`,
    ))
  }
})

test('highteen sitemap excludes the inactive curriculum page', () => {
  assert.ok(
    !sitemapURLs('https://highteen.baewooenm.com').includes(
      'https://highteen.baewooenm.com/curriculum',
    ),
  )
})

test('highteen and kids sitemaps exclude the inactive artist press page', () => {
  for (const center of ['highteen', 'kids']) {
    const urls = sitemapURLs(`https://${center}.baewooenm.com`)

    assert.ok(!urls.includes(`https://${center}.baewooenm.com/artist-press`))
    assert.ok(urls.includes(`https://${center}.baewooenm.com/rookies`))
  }
})

test('primary gate sitemap only exposes the gate root', () => {
  assert.deepEqual(sitemapURLs('https://www.baewooenm.com'), ['https://www.baewooenm.com/'])
})

test('sitemap XML contains the expected namespace and escaped canonical URLs', () => {
  const xml = generateSitemapXml('https://art.baewooenm.com', [
    {
      lastModified: '2026-08-19T01:02:03.000Z',
      url: 'https://art.baewooenm.com/news/6399',
    },
  ])

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
  assert.match(xml, /<loc>https:\/\/art\.baewooenm\.com\/news<\/loc>/)
  assert.match(
    xml,
    /<loc>https:\/\/art\.baewooenm\.com\/news\/6399<\/loc><lastmod>2026-08-19T01:02:03\.000Z<\/lastmod>/,
  )
  assert.doesNotMatch(xml, /https:\/\/(?:exam|kids)\.baewooenm\.com/)
})
