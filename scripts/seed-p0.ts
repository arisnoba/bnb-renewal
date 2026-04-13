import path from 'node:path'

import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../payload.config'
import {
  createExcerpt,
  normalizeDateTime,
  parseInsertFile,
  type LegacyRow,
} from './legacy-sql'

type SeedOptions = {
  dryRun: boolean
  limit: number
}

type CenterValue = 'all' | 'art' | 'exam' | 'kids' | 'highteen' | 'avenue' | 'unknown'
type PageTypeValue =
  | 'about'
  | 'facility'
  | 'general'
  | 'guide'
  | 'location'
  | 'policy'
  | 'program'
type PublishStatus = 'archived' | 'draft' | 'published'

type PageRecord = {
  center: CenterValue
  excerpt: string
  html: string
  isHtml: boolean
  legacyMeta: Record<string, unknown>
  mobileHtml?: string
  pageType: PageTypeValue
  slug: string
  sourceKey: string
  sourceTable: string
  status: PublishStatus
  title: string
}

type FacultyRecord = {
  bioHtml: string
  center: CenterValue
  displayOrder: number
  gallery: Array<{
    description?: string
    path: string
    title?: string
  }>
  legacyMeta: Record<string, unknown>
  name: string
  profileImagePath?: string
  role?: string
  slug: string
  sourceId: number
  sourceTable: string
  status: PublishStatus
  summary?: string
}

type NewsRecord = {
  authorName?: string
  bodyHtml: string
  category?: string
  center: CenterValue
  displayStatus: PublishStatus
  excerpt: string
  isPublic: boolean
  legacyMeta: Record<string, unknown>
  publishedAt?: string
  slug: string
  sourceId: number
  sourceTable: string
  title: string
  viewCount: number
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const projectRoot = process.cwd()
  const p0Dir = path.join(projectRoot, 'data/baewoo-curated/p0')

  const pageRows = [
    ...(await parseInsertFile(path.join(p0Dir, 'g5_content.sql'))).map((row) => ({
      row,
      sourceTable: 'g5_content',
    })),
    ...(await parseInsertFile(path.join(p0Dir, 'g5_content2.sql'))).map((row) => ({
      row,
      sourceTable: 'g5_content2',
    })),
  ]
  const facultyRows = [
    ...(await parseInsertFile(path.join(p0Dir, 'g5_teacher.sql'))).map((row) => ({
      row,
      sourceTable: 'g5_teacher',
    })),
    ...(await parseInsertFile(path.join(p0Dir, 'g5_teacher2.sql'))).map((row) => ({
      row,
      sourceTable: 'g5_teacher2',
    })),
  ]
  const newsRows = await parseInsertFile(path.join(p0Dir, 'g5_write_new_notice.sql'))

  const pages = ensureUniquePageSlugs(
    pageRows
      .slice(0, options.limit)
      .map(({ row, sourceTable }) => mapPageRow(row, sourceTable)),
  )
  const faculty = facultyRows.slice(0, options.limit).map(({ row, sourceTable }) =>
    mapFacultyRow(row, sourceTable),
  )
  const news = newsRows
    .filter((row) => Number(row.wr_is_comment ?? 0) === 0)
    .slice(0, options.limit)
    .map(mapNewsRow)

  if (options.dryRun) {
    printDryRun({ faculty, news, options, pages })
    return
  }

  const payload = await getPayload({ config })

  await upsertPages(payload, pages)
  await upsertFaculty(payload, faculty)
  await upsertNews(payload, news)

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        faculty: faculty.length,
        limitPerTable: options.limit,
        news: news.length,
        pages: pages.length,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): SeedOptions {
  let dryRun = false
  let limit = 3

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--limit') {
      const next = Number(args[index + 1])

      if (!Number.isFinite(next) || next <= 0) {
        throw new Error(`잘못된 --limit 값입니다: ${args[index + 1]}`)
      }

      limit = next
      index += 1
    }
  }

  return { dryRun, limit }
}

function mapPageRow(row: LegacyRow, sourceTable: string): PageRecord {
  const sourceKey = String(row.co_id ?? '').trim()
  const html = String(row.co_content ?? '')
  const mobileHtml = String(row.co_mobile_content ?? '').trim()

  return {
    center: inferPageCenter(sourceKey),
    excerpt: createExcerpt(html),
    html,
    isHtml: Number(row.co_html ?? 0) === 1,
    legacyMeta: {
      hitCount: Number(row.co_hit ?? 0),
      includeHead: row.co_include_head,
      includeTail: row.co_include_tail,
      mobileSkin: row.co_mobile_skin,
      skin: row.co_skin,
      tagFilterUse: row.co_tag_filter_use,
    },
    mobileHtml: mobileHtml || undefined,
    pageType: classifyPageType(sourceKey),
    slug: mapPageSlug(sourceKey),
    sourceKey,
    sourceTable,
    status: 'published',
    title: String(row.co_subject ?? '').trim() || sourceKey,
  }
}

function mapFacultyRow(row: LegacyRow, sourceTable: string): FacultyRecord {
  const sourceId = Number(row.bn_id ?? 0)
  const gallery = Array.from({ length: 8 }, (_, offset) => {
    const index = offset + 1
    const imagePath = String(row[`it_img${index}`] ?? '').trim()

    if (!imagePath) {
      return null
    }

    const title = String(row[`it_img_title${index}`] ?? '').trim()
    const description = String(row[`it_img_desc${index}`] ?? '').trim()

    return {
      description: description || undefined,
      path: imagePath,
      title: title || undefined,
    }
  }).filter(Boolean) as FacultyRecord['gallery']

  return {
    bioHtml: String(row.message ?? ''),
    center: 'unknown',
    displayOrder: Number(row.bn_order ?? 0),
    gallery,
    legacyMeta: {
      piece: row.piece,
      pr: Array.from({ length: 9 }, (_, offset) => row[`pr_${offset + 1}`]).filter(Boolean),
    },
    name: String(row.name ?? '').trim() || `faculty-${sourceId}`,
    profileImagePath: String(row.bn_bimg ?? '').trim() || undefined,
    role: String(row.subject ?? '').trim() || undefined,
    slug: `faculty-${sourceId}`,
    sourceId,
    sourceTable,
    status: 'published',
    summary: String(row.summary ?? '').trim() || undefined,
  }
}

function mapNewsRow(row: LegacyRow): NewsRecord {
  const sourceId = Number(row.wr_id ?? 0)
  const bodyHtml = String(row.wr_content ?? '')

  return {
    authorName: String(row.wr_name ?? '').trim() || undefined,
    bodyHtml,
    category: String(row.ca_name ?? '').trim() || undefined,
    center: 'unknown',
    displayStatus: 'published',
    excerpt: createExcerpt(bodyHtml),
    isPublic: String(row.public ?? '').trim().toUpperCase() !== 'N',
    legacyMeta: {
      hit: Number(row.wr_hit ?? 0),
      link1: row.wr_link1,
      link2: row.wr_link2,
      option: row.wr_option,
      parent: row.wr_parent,
    },
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    slug: `news-${sourceId}`,
    sourceId,
    sourceTable: 'g5_write_new_notice',
    title: String(row.wr_subject ?? '').trim() || `news-${sourceId}`,
    viewCount: Number(row.wr_hit ?? 0),
  }
}

function mapPageSlug(sourceKey: string): string {
  const routeMap: Record<string, string> = {
    company: 'about',
    cs_call: 'guide/contact-center',
    faq: 'faq',
    map: 'about/directions',
    privacy: 'privacy',
    provision: 'terms',
    sisul: 'about/facilities',
    terms: 'terms',
    useguide: 'guide',
  }

  return routeMap[sourceKey] ?? sourceKey
}

function classifyPageType(sourceKey: string): PageTypeValue {
  if (['privacy', 'terms', 'refund'].includes(sourceKey)) {
    return 'policy'
  }

  if (['faq', 'cs_call', 'enterance', 'useguide'].includes(sourceKey)) {
    return 'guide'
  }

  if (['company', 'greeting', 'history', 'identity', 'parents'].includes(sourceKey)) {
    return 'about'
  }

  if (sourceKey === 'map') {
    return 'location'
  }

  if (sourceKey === 'sisul') {
    return 'facility'
  }

  if (sourceKey === 'profile') {
    return 'program'
  }

  return 'general'
}

function inferPageCenter(sourceKey: string): CenterValue {
  if (['privacy', 'terms', 'refund'].includes(sourceKey)) {
    return 'all'
  }

  return 'unknown'
}

function ensureUniquePageSlugs(records: PageRecord[]): PageRecord[] {
  const slugCounts = new Map<string, number>()

  return records.map((record) => {
    const duplicateIndex = slugCounts.get(record.slug) ?? 0

    slugCounts.set(record.slug, duplicateIndex + 1)

    if (duplicateIndex === 0) {
      return record
    }

    return {
      ...record,
      slug: `${record.slug}-${record.sourceTable}-${record.sourceKey}`,
    }
  })
}

async function upsertPages(payload: Payload, records: PageRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            sourceTable: {
              equals: record.sourceTable,
            },
          },
          {
            sourceKey: {
              equals: record.sourceKey,
            },
          },
        ],
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'pages',
      data: record,
    })
  }
}

async function upsertFaculty(payload: Payload, records: FacultyRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'faculty',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            sourceTable: {
              equals: record.sourceTable,
            },
          },
          {
            sourceId: {
              equals: record.sourceId,
            },
          },
        ],
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'faculty',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'faculty',
      data: record,
    })
  }
}

async function upsertNews(payload: Payload, records: NewsRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'news',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            sourceTable: {
              equals: record.sourceTable,
            },
          },
          {
            sourceId: {
              equals: record.sourceId,
            },
          },
        ],
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'news',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'news',
      data: record,
    })
  }
}

function printDryRun({
  faculty,
  news,
  options,
  pages,
}: {
  faculty: FacultyRecord[]
  news: NewsRecord[]
  options: SeedOptions
  pages: PageRecord[]
}) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        faculty,
        limitPerTable: options.limit,
        news,
        pages,
      },
      null,
      2,
    ),
  )
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
