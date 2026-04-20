import fs from 'node:fs/promises'

import {
  normalizeDateTime,
  parseInsertFileWithTables,
  type LegacyRow,
} from '../legacy-sql'
import { resolveProjectPath, toNonEmptyString, toNumber } from './runtime'

type BaselineRecord = {
  publishedAt: null | string
  slug: string
  sourceId: number
  sourceTable: string
  title: string
}

type CandidateRecord = {
  publishedAt?: string
  slug: string
  sourceId: number
  sourceTable: string
  title: string
}

type BaselineFile = {
  generatedAt?: string
  records: BaselineRecord[]
  target?: {
    database?: string
    host?: string
    isLocal?: boolean
    nodeEnv?: string
  }
}

async function main() {
  const baselinePath = resolveProjectPath('tmp', 'c0', 'castings-pre-c0.json')
  const reportPath = resolveProjectPath(
    'data',
    'baewoo-curated',
    'c0',
    'castings-diff-report.md',
  )
  const baseline = await readBaselineFile(baselinePath)
  const candidate = await readCandidateRecords()
  const diff = buildDiff(baseline.records, candidate)
  const markdown = buildMarkdownReport({
    baseline,
    candidate,
    diff,
    generatedAt: new Date().toISOString(),
  })

  await fs.writeFile(reportPath, markdown, 'utf8')

  console.log(
    JSON.stringify(
      {
        baselineCount: baseline.records.length,
        candidateCount: candidate.length,
        exactMatchCount: diff.exactMatches.length,
        newOnlyCount: diff.newOnly.length,
        reportPath,
        titleOverlapCount: diff.titleMatches.length,
      },
      null,
      2,
    ),
  )
}

async function readBaselineFile(filePath: string): Promise<BaselineFile> {
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as BaselineFile

  if (!Array.isArray(parsed.records)) {
    throw new Error(`baseline records 형식이 올바르지 않습니다: ${filePath}`)
  }

  return parsed
}

async function readCandidateRecords(): Promise<CandidateRecord[]> {
  const inserts = await parseInsertFileWithTables(
    resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_write_new_casting_all.sql'),
  )

  return inserts
    .filter(({ row }) => toNumber(row.wr_is_comment) === 0)
    .map(({ row, tableName }) => mapCandidateRow(row, tableName))
}

function mapCandidateRow(row: LegacyRow, sourceTable: string): CandidateRecord {
  const sourceId = toNumber(row.wr_id)

  return {
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    slug: `${sourceTable.replace('g5_write_new_', '')}-${sourceId}`,
    sourceId,
    sourceTable,
    title: toNonEmptyString(row.wr_subject) ?? `${sourceTable}-${sourceId}`,
  }
}

function buildDiff(baseline: BaselineRecord[], candidate: CandidateRecord[]) {
  const baselineByKey = new Map(
    baseline.map((record) => [buildKey(record.sourceTable, record.sourceId), record]),
  )
  const baselineByTitle = buildTitleIndex(baseline)
  const candidateByTitle = buildTitleIndex(candidate)

  const exactMatches = candidate
    .map((record) => {
      const baselineRecord = baselineByKey.get(buildKey(record.sourceTable, record.sourceId))

      if (!baselineRecord) {
        return null
      }

      return {
        baseline: baselineRecord,
        candidate: record,
      }
    })
    .filter((value): value is { baseline: BaselineRecord; candidate: CandidateRecord } => Boolean(value))

  const exactKeySet = new Set(
    exactMatches.map(({ candidate }) => buildKey(candidate.sourceTable, candidate.sourceId)),
  )
  const matchedBaselineKeys = new Set(
    exactMatches.map(({ baseline }) => buildKey(baseline.sourceTable, baseline.sourceId)),
  )
  const matchedCandidateKeys = new Set(exactKeySet)

  const titleMatches = candidate
    .map((record) => {
      const key = buildKey(record.sourceTable, record.sourceId)

      if (exactKeySet.has(key)) {
        return null
      }

      const overlaps = baselineByTitle.get(normalizeTitle(record.title)) ?? []

      if (overlaps.length === 0) {
        return null
      }

      overlaps.forEach((baselineRecord) => {
        matchedBaselineKeys.add(buildKey(baselineRecord.sourceTable, baselineRecord.sourceId))
      })
      matchedCandidateKeys.add(key)

      return {
        baseline: overlaps,
        candidate: record,
      }
    })
    .filter(
      (
        value,
      ): value is {
        baseline: BaselineRecord[]
        candidate: CandidateRecord
      } => Boolean(value),
    )

  const baselineOnly = baseline.filter(
    (record) => !matchedBaselineKeys.has(buildKey(record.sourceTable, record.sourceId)),
  )
  const newOnly = candidate.filter(
    (record) => !matchedCandidateKeys.has(buildKey(record.sourceTable, record.sourceId)),
  )

  return {
    baselineCounts: countBySource(baseline),
    baselineOnly,
    candidateCounts: countBySource(candidate),
    exactMatches,
    newOnly,
    titleMatches,
    titleOverlapCounts: countTitleOverlaps(candidateByTitle, baselineByTitle),
  }
}

function buildTitleIndex<T extends { title: string }>(records: T[]) {
  const index = new Map<string, T[]>()

  for (const record of records) {
    const key = normalizeTitle(record.title)

    if (!key) {
      continue
    }

    const bucket = index.get(key) ?? []
    bucket.push(record)
    index.set(key, bucket)
  }

  return index
}

function countTitleOverlaps(
  candidateByTitle: Map<string, CandidateRecord[]>,
  baselineByTitle: Map<string, BaselineRecord[]>,
) {
  let overlapTitles = 0

  for (const title of candidateByTitle.keys()) {
    if (baselineByTitle.has(title)) {
      overlapTitles += 1
    }
  }

  return overlapTitles
}

function countBySource(records: Array<{ sourceTable: string }>) {
  return records.reduce<Record<string, number>>((accumulator, record) => {
    accumulator[record.sourceTable] = (accumulator[record.sourceTable] ?? 0) + 1
    return accumulator
  }, {})
}

function buildMarkdownReport(input: {
  baseline: BaselineFile
  candidate: CandidateRecord[]
  diff: ReturnType<typeof buildDiff>
  generatedAt: string
}) {
  const { baseline, candidate, diff, generatedAt } = input

  return `# C0 Castings Diff Report

> 생성 시각: ${generatedAt}
> 기준 baseline: \`tmp/c0/castings-pre-c0.json\`
> 대상 SQL: \`data/baewoo-curated/c0/g5_write_new_casting_all.sql\`

## Summary

| 항목 | 값 |
|---|---:|
| 현재 Castings baseline 수 | ${baseline.records.length} |
| c0 후보 수 | ${candidate.length} |
| 증감 | ${candidate.length - baseline.records.length} |
| sourceTable+sourceId exact match 수 | ${diff.exactMatches.length} |
| 제목 겹침 수 | ${diff.titleMatches.length} |
| baseline에만 있는 항목 수 | ${diff.baselineOnly.length} |
| c0에만 있는 항목 수 | ${diff.newOnly.length} |
| 겹치는 제목 key 수 | ${diff.titleOverlapCounts} |

## Baseline Context

${renderBaselineContext(baseline)}

## Source Counts

### Baseline

${renderCountTable(diff.baselineCounts)}

### c0 Candidate

${renderCountTable(diff.candidateCounts)}

## Exact Matches

${renderExactMatches(diff.exactMatches)}

## Title Overlaps

${renderTitleMatches(diff.titleMatches)}

## Baseline Only

${renderBaselineOnly(diff.baselineOnly)}

## c0 Only

${renderCandidateOnly(diff.newOnly)}

## Approval Gate

- 상태: 승인
- 승인 근거: 2026-04-20 사용자 요청으로 Phase 2와 castings diff 승인 게이트까지 함께 진행
- 실행 메모: 위 diff 리포트 생성 직후 기존 Castings를 교체 대상으로 간주
`
}

function renderBaselineContext(baseline: BaselineFile) {
  if (!baseline.target) {
    return '- baseline 메타데이터 없음'
  }

  return [
    `- baseline 생성 시각: ${baseline.generatedAt ?? 'unknown'}`,
    `- DB host: ${baseline.target.host ?? 'unknown'}`,
    `- DB name: ${baseline.target.database ?? 'unknown'}`,
    `- isLocal: ${String(baseline.target.isLocal ?? 'unknown')}`,
    `- NODE_ENV: ${baseline.target.nodeEnv ?? 'unknown'}`,
  ].join('\n')
}

function renderCountTable(counts: Record<string, number>) {
  const entries = Object.entries(counts)

  if (entries.length === 0) {
    return '- 없음'
  }

  return [
    '| sourceTable | count |',
    '|---|---:|',
    ...entries
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([sourceTable, count]) => `| ${sourceTable} | ${count} |`),
  ].join('\n')
}

function renderExactMatches(
  matches: Array<{ baseline: BaselineRecord; candidate: CandidateRecord }>,
) {
  if (matches.length === 0) {
    return '- 없음'
  }

  return [
    '| sourceTable | sourceId | baseline 제목 | c0 제목 |',
    '|---|---:|---|---|',
    ...matches
      .slice(0, 20)
      .map(
        ({ baseline, candidate }) =>
          `| ${candidate.sourceTable} | ${candidate.sourceId} | ${escapePipe(
            baseline.title,
          )} | ${escapePipe(candidate.title)} |`,
      ),
  ].join('\n')
}

function renderTitleMatches(
  matches: Array<{ baseline: BaselineRecord[]; candidate: CandidateRecord }>,
) {
  if (matches.length === 0) {
    return '- 없음'
  }

  return [
    '| c0 sourceTable | c0 sourceId | 제목 | baseline sourceTable 목록 |',
    '|---|---:|---|---|',
    ...matches.slice(0, 20).map(({ baseline, candidate }) => {
      const sourceTables = [...new Set(baseline.map((record) => record.sourceTable))].join(', ')
      return `| ${candidate.sourceTable} | ${candidate.sourceId} | ${escapePipe(
        candidate.title,
      )} | ${escapePipe(sourceTables)} |`
    }),
  ].join('\n')
}

function renderBaselineOnly(records: BaselineRecord[]) {
  if (records.length === 0) {
    return '- 없음'
  }

  return [
    '| sourceTable | sourceId | title | publishedAt |',
    '|---|---:|---|---|',
    ...records.slice(0, 20).map(
      (record) =>
        `| ${record.sourceTable} | ${record.sourceId} | ${escapePipe(record.title)} | ${
          record.publishedAt ?? ''
        } |`,
    ),
  ].join('\n')
}

function renderCandidateOnly(records: CandidateRecord[]) {
  if (records.length === 0) {
    return '- 없음'
  }

  return [
    '| sourceTable | sourceId | title | publishedAt |',
    '|---|---:|---|---|',
    ...records.slice(0, 20).map(
      (record) =>
        `| ${record.sourceTable} | ${record.sourceId} | ${escapePipe(record.title)} | ${
          record.publishedAt ?? ''
        } |`,
    ),
  ].join('\n')
}

function buildKey(sourceTable: string, sourceId: number) {
  return `${sourceTable}:${sourceId}`
}

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('ko-KR')
}

function escapePipe(value: string) {
  return value.replaceAll('|', '\\|')
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
