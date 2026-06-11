#!/usr/bin/env node
/**
 * design-rules.md 기반 공개 프론트엔드 정적 검사.
 *
 * 사용법:
 *   node scripts/check-design-rules.mjs              # src/app/(frontend) 전체 검사
 *   node scripts/check-design-rules.mjs <file...>    # 지정 파일만 검사 (hook용)
 *
 * error  → exit 1 (design-rules.md 절대 규칙 위반)
 * warn   → exit 0 (사람이 판단할 가능성 있는 항목)
 */
import fs from 'node:fs'
import path from 'node:path'

const FRONTEND_DIR = 'src/app/(frontend)'

const RULES = [
  {
    id: 'no-dark-variant',
    level: 'error',
    test: line => /className/.test(line) && /\bdark:/.test(line),
    message: '프론트는 라이트 모드 고정 — `dark:` variant 금지 (design-rules.md §0)',
  },
  {
    id: 'no-fixed-pt-with-top-offset',
    level: 'error',
    test: line => /page-top-offset/.test(line) && /\bpt-(\d|\[)/.test(line),
    message: '`page-top-offset` 페이지에 고정 `pt-*` 금지 — 전역 변수가 offset 담당 (design-rules.md §5)',
  },
  {
    id: 'no-direct-center-brand-class',
    level: 'error',
    test: line => /\b(?:text|bg|border)-brand-(?:art|exam|highteen|kids|avenue)\b/.test(line),
    message: '센터별 브랜드 클래스 직접 지정 금지 — `data-center` + `text-brand`/`bg-brand`/`border-brand` 사용 (design-rules.md §2)',
  },
  {
    id: 'no-text-ui-symbols',
    level: 'warn',
    test: line => /[→←↑↓›‹▶▸▼▾×]/.test(line) && !/^\s*(\/\/|\/?\*)/.test(line),
    message: 'UI 기호 텍스트 문자 사용 의심 — lucide-react 아이콘 + aria-hidden 사용 (design-rules.md §5 아이콘)',
  },
  {
    id: 'no-raw-hex-color',
    level: 'warn',
    test: line =>
      /className/.test(line) &&
      /\[#(?!0c0c0c)[0-9a-fA-F]{3,8}\]/.test(line.replace(/#0C0C0C/gi, '#0c0c0c')),
    message: '임의 HEX 색상 사용 의심 — shadcn/brand 토큰 우선, 예외는 `#0C0C0C`만 (design-rules.md §2)',
  },
]

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(full)
    return /\.(tsx|jsx)$/.test(entry.name) ? [full] : []
  })
}

const args = process.argv.slice(2)
const targets = (args.length ? args : collectFiles(FRONTEND_DIR)).filter(
  file => /\.(tsx|jsx)$/.test(file) && fs.existsSync(file),
)

const findings = []
for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.test(line)) {
        findings.push({ file, line: index + 1, rule })
      }
    }
  })
}

if (findings.length === 0) {
  console.log(`✅ design-rules 검사 통과 (${targets.length}개 파일)`)
  process.exit(0)
}

const errors = findings.filter(f => f.rule.level === 'error')
for (const { file, line, rule } of findings) {
  const tag = rule.level === 'error' ? '❌' : '⚠️'
  console.log(`${tag} ${file}:${line} [${rule.id}] ${rule.message}`)
}
console.log(
  `\ndesign-rules 검사: error ${errors.length}건, warn ${findings.length - errors.length}건 — 기준 문서: design-rules.md / design.md`,
)
process.exit(errors.length > 0 ? 1 : 0)
