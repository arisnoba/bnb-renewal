import { crawlerOrigin, generateSitemapXml, type SitemapEntry } from '@/lib/crawlerFiles'
import { queryPublishedSitemapEntries } from '@/lib/sitemapContent'

const cacheControl = 'public, max-age=600, s-maxage=600, stale-while-revalidate=86400'

export const revalidate = 600

export async function GET(request: Request) {
  const origin = crawlerOrigin(request)
  let contentEntries: SitemapEntry[] = []

  try {
    contentEntries = await queryPublishedSitemapEntries(origin)
  } catch (error) {
    console.error('[sitemap] Failed to load published detail URLs', error)
  }

  return new Response(generateSitemapXml(origin, contentEntries), {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
