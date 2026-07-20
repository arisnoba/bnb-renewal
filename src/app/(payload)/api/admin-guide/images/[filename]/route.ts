import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getPayloadClient } from '@/lib/payload'

type RouteContext = {
  params: Promise<{
    filename: string
  }>
}

const allowedFileName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:jpe?g|png|webp)$/i
const contentTypes: Record<string, string> = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: RouteContext) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('로그인이 필요합니다.', {
      headers: { 'Cache-Control': 'private, no-store' },
      status: 401,
    })
  }

  const { filename } = await params

  if (!allowedFileName.test(filename) || path.basename(filename) !== filename) {
    return new Response('이미지를 찾을 수 없습니다.', { status: 404 })
  }

  try {
    const filePath = path.join(
      process.cwd(),
      'deliverables',
      'admin-guide',
      'images',
      filename,
    )
    const body = await readFile(filePath)
    const contentType = contentTypes[path.extname(filename).toLowerCase()]

    return new Response(body, {
      headers: {
        'Cache-Control': 'private, max-age=3600',
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('이미지를 찾을 수 없습니다.', { status: 404 })
  }
}
