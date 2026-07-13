import { generateLlmsTxt } from '@/lib/llmsTxt'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 86400

export function GET() {
  return new Response(generateLlmsTxt({ baseUrl: getServerSideURL() }), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
