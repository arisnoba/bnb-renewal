import fs from 'node:fs/promises'
import path from 'node:path'

export type LegacyScalar = number | null | string
export type LegacyRow = Record<string, LegacyScalar>
export type LegacyInsertRecord = {
  row: LegacyRow
  tableName: string
}

export async function parseInsertFile(filePath: string): Promise<LegacyRow[]> {
  const records = await parseInsertFileWithTables(filePath)
  return records.map((record) => record.row)
}

export async function parseInsertFileWithTables(
  filePath: string,
): Promise<LegacyInsertRecord[]> {
  const absolutePath = path.resolve(filePath)
  const sql = await fs.readFile(absolutePath, 'utf8')
  const insertStatements = extractInsertStatements(sql)

  if (insertStatements.length === 0) {
    throw new Error(`INSERT 구문을 찾지 못했습니다: ${filePath}`)
  }

  return insertStatements.flatMap((insertStatement) =>
    parseInsertStatement(insertStatement, filePath),
  )
}

function extractInsertStatements(sql: string): string[] {
  const statements: string[] = []
  let searchFromIndex = 0

  while (true) {
    const startIndex = sql.indexOf('INSERT INTO', searchFromIndex)

    if (startIndex === -1) {
      return statements
    }

    const statement = extractInsertStatementFromIndex(sql, startIndex)
    statements.push(statement.statement)
    searchFromIndex = statement.nextIndex
  }
}

function extractInsertStatementFromIndex(sql: string, startIndex: number) {
  let inString = false
  let escaping = false

  for (let index = startIndex; index < sql.length; index += 1) {
    const char = sql[index]

    if (inString) {
      if (escaping) {
        escaping = false
        continue
      }

      if (char === '\\') {
        escaping = true
        continue
      }

      if (char === "'") {
        inString = false
      }

      continue
    }

    if (char === "'") {
      inString = true
      continue
    }

    if (char === ';') {
      return {
        nextIndex: index + 1,
        statement: sql.slice(startIndex, index),
      }
    }
  }

  throw new Error('INSERT 구문의 종료 지점을 찾지 못했습니다.')
}

function splitTuples(valuesBlock: string): string[] {
  const tuples: string[] = []
  let current = ''
  let depth = 0
  let inString = false
  let escaping = false

  for (const char of valuesBlock) {
    if (inString) {
      current += char

      if (escaping) {
        escaping = false
        continue
      }

      if (char === '\\') {
        escaping = true
        continue
      }

      if (char === "'") {
        inString = false
      }

      continue
    }

    if (char === "'") {
      inString = true
      current += char
      continue
    }

    if (char === '(') {
      if (depth > 0) {
        current += char
      }

      depth += 1
      continue
    }

    if (char === ')') {
      depth -= 1

      if (depth === 0) {
        tuples.push(current)
        current = ''
        continue
      }

      current += char
      continue
    }

    if (depth > 0) {
      current += char
    }
  }

  return tuples
}

function splitFields(tuple: string): string[] {
  const fields: string[] = []
  let current = ''
  let inString = false
  let escaping = false

  for (const char of tuple) {
    if (inString) {
      current += char

      if (escaping) {
        escaping = false
        continue
      }

      if (char === '\\') {
        escaping = true
        continue
      }

      if (char === "'") {
        inString = false
      }

      continue
    }

    if (char === "'") {
      inString = true
      current += char
      continue
    }

    if (char === ',') {
      fields.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  fields.push(current.trim())
  return fields
}

function parseInsertStatement(
  insertStatement: string,
  filePath: string,
): LegacyInsertRecord[] {
  const insertMatch = insertStatement.match(
    /INSERT INTO\s+`([^`]+)`\s+\(([\s\S]*?)\)\s+VALUES\s*([\s\S]*)$/m,
  )

  if (!insertMatch) {
    throw new Error(`INSERT 구문을 파싱하지 못했습니다: ${filePath}`)
  }

  const [, tableName, columnBlock, valuesBlock] = insertMatch
  const columns = [...columnBlock.matchAll(/`([^`]+)`/g)].map((match) => match[1])
  const tuples = splitTuples(valuesBlock)

  return tuples.map((tuple) => {
    const fields = splitFields(tuple)
    const row: LegacyRow = {}

    for (const [index, column] of columns.entries()) {
      row[column] = parseToken(fields[index] ?? 'NULL')
    }

    return {
      row,
      tableName,
    }
  })
}

function parseToken(token: string): LegacyScalar {
  if (!token || token.toUpperCase() === 'NULL') {
    return null
  }

  if (token.startsWith("'") && token.endsWith("'")) {
    return unescapeMysqlString(token.slice(1, -1))
  }

  if (/^-?\d+(\.\d+)?$/.test(token)) {
    return Number(token)
  }

  return token
}

function unescapeMysqlString(value: string): string {
  let result = ''

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (char !== '\\') {
      result += char
      continue
    }

    const next = value[index + 1]

    if (next === undefined) {
      result += char
      continue
    }

    index += 1

    switch (next) {
      case '0':
        result += '\0'
        break
      case 'n':
        result += '\n'
        break
      case 'r':
        result += '\r'
        break
      case 't':
        result += '\t'
        break
      case 'Z':
        result += '\u001a'
        break
      default:
        result += next
    }
  }

  return result
}

export function normalizeDateTime(
  value: LegacyScalar,
): null | string {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith('0000-00-00')) {
    return null
  }

  const isoCandidate = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed
  const parsed = new Date(isoCandidate)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export function createExcerpt(value: LegacyScalar, maxLength = 140): string {
  if (typeof value !== 'string') {
    return ''
  }

  const plainText = value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (plainText.length <= maxLength) {
    return plainText
  }

  return `${plainText.slice(0, maxLength).trim()}…`
}
