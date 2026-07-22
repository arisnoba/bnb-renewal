import { crawlerOrigin, generateSitemapXml } from '@/lib/crawlerFiles'

const cacheControl = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'

export function GET(request: Request) {
  return new Response(generateSitemapXml(crawlerOrigin(request)), {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
