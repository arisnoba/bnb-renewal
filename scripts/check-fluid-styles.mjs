#!/usr/bin/env node
/**
 * fluid-styling static check.
 *
 * Usage:
 *   node scripts/check-fluid-styles.mjs
 *   node scripts/check-fluid-styles.mjs <file...>
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC_DIRS = ['src']
const TOKEN_FILES = [/src\/styles\/_mixins\.scss$/]

const RULES = [
  {
    id: 'no-raw-clamp',
    level: 'error',
    files: /\.(scss|css)$/,
    test: line => /(^|[^\w-])clamp\(/.test(line) && !/^\s*(\/\/|\/?\*)/.test(line),
    message: 'raw clamp() 손작성 금지 - fluid-clamp() 함수 또는 fluid-* mixin 사용',
  },
  {
    id: 'no-arbitrary-clamp-class',
    level: 'error',
    files: /\.(tsx|jsx)$/,
    test: line => /\[clamp\(/.test(line),
    message: 'className 안의 clamp() arbitrary value 금지 - 토큰 클래스 사용',
  },
  {
    id: 'no-nested-bem',
    level: 'error',
    files: /\.scss$/,
    test: line => /&__/.test(line),
    message: '`&__` 중첩 BEM 금지 - grep 가능한 풀네임 selector 사용',
  },
  {
    id: 'no-adhoc-font-size',
    level: 'warn',
    files: /\.(scss|css)$/,
    test: line => /font-size:\s*\d+px/.test(line),
    message: '고정 px font-size - 타입 스케일 슬롯으로 해결 가능한지 검토',
  },
  {
    id: 'review-arbitrary-text-size',
    level: 'warn',
    files: /\.(tsx|jsx)$/,
    test: line => /\btext-\[\d+px\]/.test(line),
    message: '임의 텍스트 크기(text-[Npx]) - 반복되면 슬롯 추가 검토',
  },
]

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) return []

    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(full)

    return /\.(tsx|jsx|scss|css)$/.test(entry.name) ? [full] : []
  })
}

const args = process.argv.slice(2)
const targets = (args.length ? args : SRC_DIRS.flatMap(collectFiles)).filter(
  file =>
    /\.(tsx|jsx|scss|css)$/.test(file) &&
    fs.existsSync(file) &&
    !TOKEN_FILES.some(pattern => pattern.test(file)),
)

const findings = []
for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.files.test(file) && rule.test(line)) {
        findings.push({ file, line: index + 1, rule })
      }
    }
  })
}

if (findings.length === 0) {
  console.log(`fluid-styling 검사 통과 (${targets.length}개 파일)`)
  process.exit(0)
}

const errors = findings.filter(finding => finding.rule.level === 'error')
for (const { file, line, rule } of findings) {
  const tag = rule.level === 'error' ? 'ERROR' : 'WARN'
  console.log(`${tag} ${file}:${line} [${rule.id}] ${rule.message}`)
}
console.log(`\nfluid-styling 검사: error ${errors.length}건, warn ${findings.length - errors.length}건`)

process.exit(errors.length > 0 ? 1 : 0)
