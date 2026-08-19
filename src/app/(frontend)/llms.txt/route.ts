import { generateLlmsTxt } from '@/lib/llmsTxt'
import { centerFromHostname } from '@/lib/centerDomains'
import { crawlerOrigin } from '@/lib/crawlerFiles'

export const revalidate = 86400

export function GET(request: Request) {
  const baseUrl = crawlerOrigin(request)
  const center = centerFromHostname(new URL(baseUrl).hostname)

  return new Response(generateLlmsTxt({ baseUrl, center }), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
