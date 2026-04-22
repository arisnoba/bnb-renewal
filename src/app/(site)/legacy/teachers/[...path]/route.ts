import fs from 'node:fs/promises'
import path from 'node:path'

const teacherImageRoots = [
  path.resolve(process.cwd(), 'public/legacy/teachers'),
  path.resolve(process.cwd(), 'tmp/c0/images/teachers'),
]

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params
  const segments = params.path ?? []

  if (segments.length === 0 || segments.some((segment) => segment === '..')) {
    return new Response('Not found', { status: 404 })
  }

  const filePath = await findTeacherImage(segments)

  if (!filePath) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const file = await fs.readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()

    return new Response(file, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

async function findTeacherImage(segments: string[]) {
  for (const root of teacherImageRoots) {
    const filePath = path.resolve(root, ...segments)

    if (!filePath.startsWith(`${root}${path.sep}`)) {
      continue
    }

    try {
      await fs.access(filePath)
      return filePath
    } catch {
      continue
    }
  }

  return undefined
}
