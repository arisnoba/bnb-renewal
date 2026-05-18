import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getCenterLabel } from '@/lib/centers'
import { getPayloadClient } from '@/lib/payload'
import type { Faq } from '@/payload-types'

import { TestNavigation } from '../_components/TestNavigation'
import { testNavigationGroups } from '../_components/testNavigationData'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'FAQ 테스트',
}

type Args = {
  searchParams: Promise<{
    center?: string
  }>
}

const testCenters = ['art', 'exam', 'highteen', 'kids'] as const
type CenterSlug = (typeof testCenters)[number]

export default async function FaqTestPage({ searchParams: searchParamsPromise }: Args) {
  const searchParams = await searchParamsPromise
  const activeCenter = normalizeCenter(searchParams.center)
  const faqsResult = await getFaqs()
  const faqs = faqsResult.ok ? faqsResult.faqs : []
  const visibleFaqs = faqs
    .map((faq) => ({
      answer: answerForCenter(faq, activeCenter),
      faq,
    }))
    .filter((item) => item.answer)

  return (
    <main className="pt-24 pb-24">
      <section className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              FAQ Test
            </p>
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">FAQ 테스트</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Payload FAQ 데이터를 센터별 프론트 노출 방식으로 확인합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/test">테스트 목록</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mt-10">
        <TestNavigation groups={testNavigationGroups} />
      </section>

      <section className="container mt-10">
        <div className="flex flex-wrap gap-2">
          {testCenters.map((center) => (
            <Button
              asChild
              key={center}
              variant={activeCenter === center ? 'default' : 'outline'}
            >
              <Link href={`/test/faq?center=${center}`}>{getCenterLabel(center)}</Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="container mt-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <dl className="grid gap-4 text-sm md:grid-cols-4">
            <InfoItem label="센터" value={getCenterLabel(activeCenter)} />
            <InfoItem label="전체 FAQ" value={`${faqs.length}건`} />
            <InfoItem label="표시 FAQ" value={`${visibleFaqs.length}건`} />
            <InfoItem label="경로" value={`/test/faq?center=${activeCenter}`} />
          </dl>
          {faqsResult.ok ? null : (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {faqsResult.message}
            </p>
          )}
        </div>
      </section>

      <section className="container mt-8">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {visibleFaqs.length > 0 ? (
            visibleFaqs.map(({ answer, faq }) => (
              <article className="bg-card p-6" key={faq.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {categoryLabel(faq.category)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-normal">
                      {faq.title}
                    </h2>
                  </div>
                  <span className="w-fit rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {faq.answerMode === 'shared' ? '공통 답변' : getCenterLabel(activeCenter)}
                  </span>
                </div>
                <div className="mt-5 text-sm leading-7 text-muted-foreground">
                  <MarkdownAnswer content={answer} />
                </div>
              </article>
            ))
          ) : (
            <div className="bg-card px-4 py-12 text-center text-sm text-muted-foreground">
              표시할 FAQ가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

async function getFaqs() {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'faqs',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: 'displayOrder',
    })

    return {
      faqs: result.docs as Faq[],
      ok: true as const,
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : String(error),
      ok: false as const,
    }
  }
}

function normalizeCenter(value: string | undefined): CenterSlug {
  return testCenters.includes(value as CenterSlug) ? (value as CenterSlug) : 'art'
}

function answerForCenter(faq: Faq, center: CenterSlug) {
  if (faq.answerMode === 'shared') {
    return faq.sharedAnswer?.trim() ?? ''
  }

  const variant = faq.variants?.find((item) => {
    if (center === 'art') {
      return item.centerArt
    }
    if (center === 'exam') {
      return item.centerExam
    }
    if (center === 'highteen') {
      return item.centerHighteen
    }
    if (center === 'kids') {
      return item.centerKids
    }

    return item.centerAvenue
  })

  return variant?.answer?.trim() ?? ''
}

function categoryLabel(value: Faq['category']) {
  const labels: Record<Faq['category'], string> = {
    admission: '입학/상담',
    casting: '캐스팅/프로필',
    class: '수업/과정',
    etc: '기타',
    exam: '입시',
    starcard: '스타카드',
    tuition: '수강료/할인',
  }

  return labels[value] ?? value
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-all font-medium">{value}</dd>
    </div>
  )
}

type MarkdownBlock =
  | {
      rows: string[][]
      type: 'table'
    }
  | {
      lines: string[]
      type: 'paragraph'
    }

function MarkdownAnswer({ content }: { content: string }) {
  const blocks = toMarkdownBlocks(content)

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return <MarkdownTable key={index} rows={block.rows} />
        }

        return (
          <p className="whitespace-pre-wrap" key={index}>
            {block.lines.join('\n')}
          </p>
        )
      })}
    </div>
  )
}

function MarkdownTable({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead className="bg-muted/50 text-foreground">
          <tr>
            {head.map((cell, index) => (
              <th className="border-b border-border px-3 py-2 font-semibold" key={index}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr className="border-t border-border" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-3 py-2 align-top" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function toMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split('\n')
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return
    }

    blocks.push({
      lines: paragraph,
      type: 'paragraph',
    })
    paragraph = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (!line.trim()) {
      flushParagraph()
      continue
    }

    if (isMarkdownTableStart(lines, index)) {
      flushParagraph()

      const rows: string[][] = [parseMarkdownTableRow(line)]
      index += 2

      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        rows.push(parseMarkdownTableRow(lines[index]))
        index += 1
      }

      blocks.push({
        rows,
        type: 'table',
      })
      index -= 1
      continue
    }

    paragraph.push(line)
  }

  flushParagraph()
  return blocks
}

function isMarkdownTableStart(lines: string[], index: number) {
  return isMarkdownTableRow(lines[index]) && isMarkdownTableDivider(lines[index + 1])
}

function isMarkdownTableRow(line: string | undefined) {
  return Boolean(line?.trim().startsWith('|') && line.trim().endsWith('|'))
}

function isMarkdownTableDivider(line: string | undefined) {
  if (!line || !isMarkdownTableRow(line)) {
    return false
  }

  return parseMarkdownTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell))
}

function parseMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}
