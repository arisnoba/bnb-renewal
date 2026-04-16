import fs from 'node:fs/promises'
import path from 'node:path'

import {
  createExcerpt,
  normalizeDateTime,
  parseInsertFile,
  type LegacyRow,
  type LegacyScalar,
} from '../legacy-sql'

export type LegacyColumn = {
  mysqlType: string
  name: string
  nullable: boolean
  raw: string
}

export type LegacySqlSummary = {
  columns: LegacyColumn[]
  createTableName: null | string
  fileName: string
  filePath: string
  insertStatementCount: number
  insertTableNames: string[]
  isCreateInsertMismatch: boolean
}

export async function readLegacySqlFile(filePath: string): Promise<string> {
  return fs.readFile(path.resolve(filePath), 'utf8')
}

export async function summarizeLegacySqlFile(
  filePath: string,
): Promise<LegacySqlSummary> {
  const absolutePath = path.resolve(filePath)
  const sql = await readLegacySqlFile(absolutePath)
  const createTableName = extractCreateTableName(sql)
  const insertTableNames = extractInsertTableNames(sql)

  return {
    columns: extractCreateTableColumns(sql),
    createTableName,
    fileName: path.basename(absolutePath),
    filePath: absolutePath,
    insertStatementCount: insertTableNames.length,
    insertTableNames: [...new Set(insertTableNames)],
    isCreateInsertMismatch:
      insertTableNames.length > 0 &&
      createTableName !== null &&
      insertTableNames.some((tableName) => tableName !== createTableName),
  }
}

export function extractCreateTableName(sql: string): null | string {
  const match = sql.match(/CREATE TABLE\s+`([^`]+)`\s*\(/)
  return match?.[1] ?? null
}

export function extractInsertTableNames(sql: string): string[] {
  return [...sql.matchAll(/INSERT INTO\s+`([^`]+)`/g)].map((match) => match[1])
}

export function extractCreateTableColumns(sql: string): LegacyColumn[] {
  const block = extractCreateTableBlock(sql)

  if (!block) {
    return []
  }

  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('`'))
    .map((line) => {
      const match = line.match(/^`([^`]+)`\s+(.+?)(?:,)?$/)

      if (!match) {
        throw new Error(`컬럼 정의를 파싱하지 못했습니다: ${line}`)
      }

      const [, name, rawType] = match
      const mysqlType = rawType
        .replace(/\s+NOT NULL\b/gi, '')
        .replace(/\s+NULL\b/gi, '')
        .replace(/\s+DEFAULT\s+.+$/gi, '')
        .replace(/\s+COMMENT\s+'.*'$/gi, '')
        .trim()

      return {
        mysqlType,
        name,
        nullable: !/\bNOT NULL\b/i.test(rawType),
        raw: rawType.trim(),
      }
    })
}

function extractCreateTableBlock(sql: string): null | string {
  const match = sql.match(/CREATE TABLE\s+`[^`]+`\s*\(([\s\S]*?)\)\s*ENGINE=/m)
  return match?.[1] ?? null
}

export { createExcerpt, normalizeDateTime, parseInsertFile, type LegacyRow, type LegacyScalar }
