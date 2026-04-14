import fs from 'node:fs/promises'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../payload.config'

type SuccessEntry = {
  ftpSource: string
  localPath: string
  publicPath: string
  remotePath: string
  sourceId: number
}

type SuccessState = {
  downloadedAt: string
  entries: SuccessEntry[]
}

type ApplyOptions = {
  dryRun: boolean
  limit: number | 'all'
  statePath: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const projectRoot = process.cwd()
  const state = await loadSuccessState(path.join(projectRoot, options.statePath))
  const entries = state.entries
    .slice()
    .sort((left, right) => left.sourceId - right.sourceId)
    .slice(0, options.limit === 'all' ? state.entries.length : options.limit)

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          limit: options.limit,
          sample: entries.slice(0, 10),
          total: entries.length,
        },
        null,
        2,
      ),
    )
    return
  }

  const payload = await getPayload({ config })
  let updated = 0
  const missing: number[] = []

  for (const entry of entries) {
    const existing = await payload.find({
      collection: 'profiles',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            sourceTable: {
              equals: 'g5_write_new_profile',
            },
          },
          {
            sourceId: {
              equals: entry.sourceId,
            },
          },
        ],
      },
    })

    const doc = existing.docs[0]

    if (!doc) {
      missing.push(entry.sourceId)
      continue
    }

    if (doc.profileImagePath === entry.publicPath) {
      continue
    }

    await payload.update({
      collection: 'profiles',
      data: {
        profileImagePath: entry.publicPath,
      },
      id: doc.id,
    })

    updated += 1
  }

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        limit: options.limit,
        missingSourceIds: missing,
        total: entries.length,
        updated,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): ApplyOptions {
  let dryRun = false
  let limit: number | 'all' = 'all'
  let statePath = 'tmp/profile-image-download-success.json'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--limit') {
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

    if (arg === '--state-path') {
      const nextArg = String(args[index + 1] ?? '').trim()

      if (!nextArg) {
        throw new Error('`--state-path` 값이 비어 있습니다.')
      }

      statePath = nextArg
      index += 1
    }
  }

  return { dryRun, limit, statePath }
}

async function loadSuccessState(filePath: string): Promise<SuccessState> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<SuccessState>

    if (!Array.isArray(parsed.entries)) {
      throw new Error(`성공 상태 파일 형식이 잘못되었습니다: ${filePath}`)
    }

    return {
      downloadedAt: String(parsed.downloadedAt ?? ''),
      entries: parsed.entries.map((entry) => ({
        ftpSource: String(entry.ftpSource ?? ''),
        localPath: String(entry.localPath ?? ''),
        publicPath: String(entry.publicPath ?? ''),
        remotePath: String(entry.remotePath ?? ''),
        sourceId: Number(entry.sourceId ?? 0),
      })),
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === 'ENOENT') {
      return {
        downloadedAt: '',
        entries: [],
      }
    }

    throw error
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
