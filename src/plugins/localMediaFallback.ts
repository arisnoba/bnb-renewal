import fs from 'node:fs/promises'
import path from 'node:path'

const localMediaDir = path.resolve(process.cwd(), 'public/media')

function localMediaPath(filename: string) {
  const filePath = path.resolve(localMediaDir, path.basename(filename))

  if (!filePath.startsWith(`${localMediaDir}${path.sep}`)) {
    return null
  }

  return filePath
}

function mediaContentType(filename: string) {
  const extension = path.extname(filename).toLowerCase()

  switch (extension) {
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

export async function hasLocalMediaFile(filename: string) {
  const filePath = localMediaPath(filename)

  if (!filePath) {
    return false
  }

  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

export async function localMediaResponse(filename: string) {
  const filePath = localMediaPath(filename)

  if (!filePath) {
    return null
  }

  try {
    const body = await fs.readFile(filePath)

    return new Response(new Uint8Array(body), {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': mediaContentType(filename),
      },
    })
  } catch {
    return null
  }
}
