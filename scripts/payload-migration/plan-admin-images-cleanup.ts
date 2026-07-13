import configPromise from '@payload-config'
import { Pool } from 'pg'

import {
  deleteR2Object,
  destroyR2Client,
  getR2ObjectKey,
  hasR2Config,
  listR2Objects,
  type R2ObjectSummary,
} from '../../src/lib/r2'
import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type AdminImageFieldRef = {
  collection: string
  path: string[]
  source: string
}

type AdminImageReference = {
  collection: string
  docId: string
  path: string
  value: string
}

type CleanupEntry = {
  action: 'deleted' | 'dry-run' | 'failed'
  error?: string
  key: string
  lastModified?: string
  referenced: false
  size?: number
}

type Options = {
  allowEmptyReferenceSet: boolean
  graceDays: number
  limit: 'all' | number
  outputPath: string
  prefix: string
  progressEvery: number
  write: boolean
}

type PayloadLike = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: T[] }>
}

type FieldLike = Record<string, unknown>

const ADMIN_IMAGE_COMPONENT_MARKERS = [
  'ImagePathField#ImagePathField',
  'TeacherAdditionalPhotosField#TeacherAdditionalPhotosField',
  'TeacherAdditionalPhotosField#ProfileAdditionalPhotosField',
  'TeacherAdditionalPhotosField#TeacherAdditionalPhotoHiddenField',
]
const DEFAULT_GRACE_DAYS = 7
const DEFAULT_OUTPUT_PATH = 'tmp/legacy-assets/admin-images-cleanup-plan.json'
const DEFAULT_PREFIX = 'admin-images/'
const MS_PER_DAY = 24 * 60 * 60 * 1000

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  logDbTargetInfo(target, { destructive: options.write })

  if (!hasR2Config()) {
    throw new Error(
      'admin-images 정리에는 R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_BASE_URL 환경변수가 필요합니다.',
    )
  }

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB/R2 삭제는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  let pool: Pool | null = null

  try {
    const config = await configPromise
    pool = new Pool({ connectionString, max: 1 })
    const fieldRefs = collectAdminImageFieldRefs(config.collections ?? [])

    if (fieldRefs.length === 0) {
      throw new Error('admin-images 참조 필드를 찾지 못했습니다. 삭제 후보 산출을 중단합니다.')
    }

    const references = await collectAdminImageReferences(pool, fieldRefs)
    const referencedKeys = new Set(references.map((reference) => reference.key))
    const objects = await listR2Objects(options.prefix)
    const plannedEntries = buildCleanupEntries({
      objects,
      options,
      referencedKeys,
    })

    if (
      !options.allowEmptyReferenceSet &&
      referencedKeys.size === 0 &&
      plannedEntries.length > 0
    ) {
      throw new Error(
        'admin-images 참조 key가 0건인데 삭제 후보가 있습니다. 스캔 오류 가능성이 있어 중단합니다. 정말 전체가 미참조라면 --allow-empty-reference-set 을 명시하세요.',
      )
    }

    const entries = options.write ? await deleteEntries(plannedEntries, options) : plannedEntries
    const output = {
      destructive: options.write,
      fieldRefs: fieldRefs.map((fieldRef) => ({
        collection: fieldRef.collection,
        path: fieldRef.path.join('.'),
        source: fieldRef.source,
      })),
      generatedAt: new Date().toISOString(),
      options,
      referencedKeySamples: [...referencedKeys].slice(0, 20),
      referenceSamples: references.slice(0, 20).map((reference) => ({
        collection: reference.collection,
        docId: reference.docId,
        path: reference.path,
        value: reference.value,
      })),
      totals: buildTotals({
        entries,
        fieldRefs,
        objects,
        references,
        referencedKeys,
      }),
      unreferencedEntries: entries,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          totals: output.totals,
          unreferencedSamples: output.unreferencedEntries.slice(0, 10),
        },
        null,
        2,
      ),
    )
  } finally {
    await pool?.end()
    destroyR2Client()
  }
}

function parseArgs(args: string[]): Options {
  let allowEmptyReferenceSet = false
  let graceDays = DEFAULT_GRACE_DAYS
  let limit: Options['limit'] = 'all'
  let outputPath = DEFAULT_OUTPUT_PATH
  let prefix = DEFAULT_PREFIX
  let progressEvery = 50
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--allow-empty-reference-set') {
      allowEmptyReferenceSet = true
      continue
    }

    if (arg === '--dry-run') {
      write = false
      continue
    }

    if (arg === '--grace-days') {
      graceDays = parseNonNegativeNumber(readRequiredValue(args, index, '--grace-days'), '--grace-days')
      index += 1
      continue
    }

    if (arg === '--limit') {
      const value = readRequiredValue(args, index, '--limit')
      limit = value === 'all' ? 'all' : parsePositiveInt(value, '--limit')
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--prefix') {
      prefix = normalizePrefix(readRequiredValue(args, index, '--prefix'))
      index += 1
      continue
    }

    if (arg === '--progress-every') {
      progressEvery = parsePositiveInt(readRequiredValue(args, index, '--progress-every'), '--progress-every')
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
      outputPath =
        outputPath === DEFAULT_OUTPUT_PATH
          ? 'tmp/legacy-assets/admin-images-cleanup-write-report.json'
          : outputPath
      continue
    }

    throw new Error(`알 수 없는 인자입니다: ${arg}`)
  }

  return {
    allowEmptyReferenceSet,
    graceDays,
    limit,
    outputPath,
    prefix,
    progressEvery,
    write,
  }
}

function collectAdminImageFieldRefs(collections: unknown[]): AdminImageFieldRef[] {
  return collections.flatMap((collection) => {
    if (!isRecord(collection) || typeof collection.slug !== 'string') {
      return []
    }

    return collectFieldRefs({
      collection: collection.slug,
      fields: Array.isArray(collection.fields) ? collection.fields : [],
      path: [],
    })
  })
}

function collectFieldRefs({
  collection,
  fields,
  path,
}: {
  collection: string
  fields: unknown[]
  path: string[]
}): AdminImageFieldRef[] {
  const refs: AdminImageFieldRef[] = []

  for (const rawField of fields) {
    if (!isRecord(rawField)) {
      continue
    }

    const field = rawField as FieldLike
    const type = typeof field.type === 'string' ? field.type : ''
    const name = typeof field.name === 'string' ? field.name : ''

    if (name && usesAdminImageComponent(field)) {
      refs.push({
        collection,
        path: [...path, name],
        source: adminImageComponentSource(field),
      })
    }

    if (type === 'tabs' && Array.isArray(field.tabs)) {
      for (const rawTab of field.tabs) {
        if (!isRecord(rawTab) || !Array.isArray(rawTab.fields)) {
          continue
        }

        const tabName = typeof rawTab.name === 'string' ? rawTab.name : ''
        refs.push(
          ...collectFieldRefs({
            collection,
            fields: rawTab.fields,
            path: tabName ? [...path, tabName] : path,
          }),
        )
      }
      continue
    }

    if (type === 'blocks' && name && Array.isArray(field.blocks)) {
      for (const rawBlock of field.blocks) {
        if (!isRecord(rawBlock) || !Array.isArray(rawBlock.fields)) {
          continue
        }

        refs.push(
          ...collectFieldRefs({
            collection,
            fields: rawBlock.fields,
            path: [...path, name],
          }),
        )
      }
      continue
    }

    if (Array.isArray(field.fields)) {
      refs.push(
        ...collectFieldRefs({
          collection,
          fields: field.fields,
          path: type === 'array' || type === 'group' ? [...path, name] : path,
        }),
      )
    }
  }

  return refs
}

async function collectAdminImageReferences(payload: PayloadLike, fieldRefs: AdminImageFieldRef[]) {
  const references: Array<AdminImageReference & { key: string }> = []
  const refsByCollection = groupBy(fieldRefs, (fieldRef) => fieldRef.collection)

  for (const [collection, refs] of refsByCollection) {
    for (const ref of refs) {
      const rows = await readFieldReferenceRows(payload, collection, ref.path)

      for (const row of rows) {
        const key = adminImageObjectKeyFromValue(row.value)

        if (!key) {
          continue
        }

        references.push({
          collection,
          docId: row.docId,
          key,
          path: ref.path.join('.'),
          value: row.value,
        })
      }
    }
  }

  return references
}

async function readFieldReferenceRows(
  payload: PayloadLike,
  collection: string,
  path: string[],
) {
  if (path.length === 1) {
    const tableName = collectionTableName(collection)
    const columnName = fieldColumnName(path[0] ?? '')
    const result = await payload.query<{ doc_id: unknown; value: unknown }>(
      `
        SELECT "id"::text AS "doc_id", ${quoteIdent(columnName)}::text AS "value"
        FROM ${quoteIdent(tableName)}
        WHERE ${quoteIdent(columnName)} IS NOT NULL
          AND btrim(${quoteIdent(columnName)}::text) <> ''
      `,
    )

    return result.rows.flatMap(toReferenceRow)
  }

  if (path.length === 2) {
    const tableName = `${collectionTableName(collection)}_${fieldColumnName(path[0] ?? '')}`
    const columnName = fieldColumnName(path[1] ?? '')
    const result = await payload.query<{ doc_id: unknown; value: unknown }>(
      `
        SELECT "_parent_id"::text AS "doc_id", ${quoteIdent(columnName)}::text AS "value"
        FROM ${quoteIdent(tableName)}
        WHERE ${quoteIdent(columnName)} IS NOT NULL
          AND btrim(${quoteIdent(columnName)}::text) <> ''
      `,
    )

    return result.rows.flatMap(toReferenceRow)
  }

  throw new Error(
    `admin-images 참조 필드 경로를 SQL로 읽을 수 없습니다: ${collection}.${path.join('.')}`,
  )
}

function toReferenceRow(row: { doc_id: unknown; value: unknown }) {
  const docId = String(row.doc_id ?? '').trim()
  const value = String(row.value ?? '').trim()

  return docId && value ? [{ docId, value }] : []
}

function collectionTableName(collection: string) {
  return safeIdentifier(collection.replaceAll('-', '_'), `collection ${collection}`)
}

function fieldColumnName(fieldName: string) {
  return safeIdentifier(
    fieldName.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`),
    `field ${fieldName}`,
  )
}

function quoteIdent(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function safeIdentifier(value: string, label: string) {
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    throw new Error(`SQL 식별자로 사용할 수 없는 ${label}: ${value}`)
  }

  return value
}

function buildCleanupEntries({
  objects,
  options,
  referencedKeys,
}: {
  objects: R2ObjectSummary[]
  options: Options
  referencedKeys: Set<string>
}): CleanupEntry[] {
  const cutoffMs = Date.now() - options.graceDays * MS_PER_DAY
  const entries = objects
    .filter((object) => object.key.startsWith(options.prefix))
    .filter((object) => !referencedKeys.has(object.key))
    .filter((object) => {
      if (!object.lastModified) {
        return false
      }

      return object.lastModified.getTime() <= cutoffMs
    })
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((object): CleanupEntry => ({
      action: 'dry-run',
      key: object.key,
      lastModified: object.lastModified?.toISOString(),
      referenced: false,
      size: object.size,
    }))

  return options.limit === 'all' ? entries : entries.slice(0, options.limit)
}

async function deleteEntries(entries: CleanupEntry[], options: Options) {
  const deletedEntries: CleanupEntry[] = []

  for (const [index, entry] of entries.entries()) {
    try {
      await deleteR2Object(entry.key)
      deletedEntries.push({
        ...entry,
        action: 'deleted',
      })
    } catch (error) {
      deletedEntries.push({
        ...entry,
        action: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }

    const done = index + 1
    if (done % options.progressEvery === 0 || done === entries.length) {
      console.log(
        JSON.stringify({
          deleted: deletedEntries.filter((item) => item.action === 'deleted').length,
          done,
          failed: deletedEntries.filter((item) => item.action === 'failed').length,
          total: entries.length,
        }),
      )
    }
  }

  return deletedEntries
}

function buildTotals({
  entries,
  fieldRefs,
  objects,
  references,
  referencedKeys,
}: {
  entries: CleanupEntry[]
  fieldRefs: AdminImageFieldRef[]
  objects: R2ObjectSummary[]
  references: Array<AdminImageReference & { key: string }>
  referencedKeys: Set<string>
}) {
  return {
    candidateObjects: entries.length,
    deletedObjects: entries.filter((entry) => entry.action === 'deleted').length,
    failedObjects: entries.filter((entry) => entry.action === 'failed').length,
    referenceFields: fieldRefs.length,
    referencedKeys: referencedKeys.size,
    references: references.length,
    r2Objects: objects.length,
    skippedReferencedObjects: objects.filter((object) => referencedKeys.has(object.key)).length,
  }
}

function usesAdminImageComponent(field: FieldLike) {
  return componentReferences(field.admin).some((reference) =>
    ADMIN_IMAGE_COMPONENT_MARKERS.some((marker) => reference.includes(marker)),
  )
}

function adminImageComponentSource(field: FieldLike) {
  const references = componentReferences(field.admin)
  const marker = ADMIN_IMAGE_COMPONENT_MARKERS.find((candidate) =>
    references.some((reference) => reference.includes(candidate)),
  )

  return marker ?? 'unknown'
}

function componentReferences(value: unknown): string[] {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(componentReferences)
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap(componentReferences)
  }

  return []
}

function adminImageObjectKeyFromValue(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const directKey = normalizeAdminImageKey(trimmed)

  if (directKey) {
    return directKey
  }

  const r2Key = getR2ObjectKey(trimmed)

  return r2Key ? normalizeAdminImageKey(r2Key) : null
}

function normalizeAdminImageKey(value: string) {
  const normalized = value.replace(/^\/+/, '').split('?')[0] ?? ''

  if (!normalized.startsWith('admin-images/')) {
    return null
  }

  if (normalized.includes('..') || normalized.includes('\\')) {
    return null
  }

  return normalized
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const key = getKey(item)
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }

  return groups
}

function normalizePrefix(value: string) {
  const normalized = value.trim().replace(/^\/+/, '')

  return normalized.endsWith('/') ? normalized : `${normalized}/`
}

function readRequiredValue(args: string[], index: number, flag: string) {
  const value = args[index + 1]

  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} 값이 필요합니다.`)
  }

  return value
}

function parsePositiveInt(value: string, flag: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} 값은 1 이상의 정수여야 합니다.`)
  }

  return parsed
}

function parseNonNegativeNumber(value: string, flag: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} 값은 0 이상의 숫자여야 합니다.`)
  }

  return parsed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

void main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
