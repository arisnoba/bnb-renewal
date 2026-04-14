import fs from 'node:fs/promises'
import path from 'node:path'

import { loadLegacyProfileImageManifest } from './profile-images'

type Options = {
  limit: number | 'all'
  outputPath?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const manifest = await loadLegacyProfileImageManifest(process.cwd())
  const sliced = manifest.slice(0, options.limit === 'all' ? manifest.length : options.limit)
  const payload = JSON.stringify(
    {
      entries: sliced,
      total: manifest.length,
    },
    null,
    2,
  )

  if (options.outputPath) {
    const absolutePath = path.join(process.cwd(), options.outputPath)
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, payload)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          total: manifest.length,
          written: sliced.length,
        },
        null,
        2,
      ),
    )
    return
  }

  console.log(payload)
}

function parseArgs(args: string[]): Options {
  let limit: number | 'all' = 'all'
  let outputPath: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--limit') {
      const nextArg = String(args[index + 1] ?? '')

      if (nextArg === 'all') {
        limit = 'all'
        index += 1
        continue
      }

      const next = Number(nextArg)

      if (!Number.isFinite(next) || next <= 0) {
        throw new Error(`잘못된 --limit 값입니다: ${nextArg}`)
      }

      limit = next
      index += 1
      continue
    }

    if (args[index] === '--output') {
      const nextArg = String(args[index + 1] ?? '').trim()

      if (!nextArg) {
        throw new Error('`--output` 값이 비어 있습니다.')
      }

      outputPath = nextArg
      index += 1
      continue
    }
  }

  return { limit, outputPath }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
