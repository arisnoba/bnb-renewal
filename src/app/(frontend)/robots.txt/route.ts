import { crawlerOrigin, generateRobotsTxt } from '@/lib/crawlerFiles'

const cacheControl = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'

export function GET(request: Request) {
  return new Response(generateRobotsTxt(crawlerOrigin(request)), {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
