'use client'

import Link from 'next/link'
import React, { useMemo, useRef, useState } from 'react'

import type { CenterSlug } from '@/lib/centers'

export type FaqCategoryTab = {
  count: number
  label: string
  value: string
}

type FaqDisplayItem = {
  answer: string
  category?: string | null
  id: number | string
  title: string
}

type FaqArchiveClientProps = {
  activeCategory: string | null
  categoryTabs: FaqCategoryTab[]
  center: CenterSlug
  faqs: FaqDisplayItem[]
  totalCount: number
}

export function FaqArchiveClient({
  activeCategory,
  categoryTabs,
  center,
  faqs,
  totalCount,
}: FaqArchiveClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('ko-KR')
  const visibleFaqs = useMemo(() => {
    if (!normalizedSearchQuery) {
      return faqs
    }

    return faqs.filter((faq) => {
      const searchableText = `${faq.title}\n${faq.answer}`.toLocaleLowerCase('ko-KR')

      return searchableText.includes(normalizedSearchQuery)
    })
  }, [faqs, normalizedSearchQuery])

  return (
    <>
      <div className="section-faq-list__tools">
        <form
          action={`/${center}/faq`}
          className="section-faq-list__search"
          onSubmit={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
          role="search"
        >
          <input
            aria-label="FAQ 검색어"
            className="section-faq-list__search-input"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="궁금한 내용을 검색해보세요."
            ref={inputRef}
            type="search"
            value={searchQuery}
          />
          <button
            aria-label="FAQ 검색"
            className="section-faq-list__search-button"
            type="submit"
          >
            <span aria-hidden="true" />
          </button>
        </form>

        <nav className="section-faq-list__tabs" aria-label="FAQ 분류">
          <CategoryLink
            active={!activeCategory}
            count={totalCount}
            href={`/${center}/faq`}
            label="전체"
          />
          {categoryTabs.map((category) => (
            <CategoryLink
              active={activeCategory === category.value}
              count={category.count}
              href={`/${center}/faq?category=${category.value}`}
              key={category.value}
              label={category.label}
            />
          ))}
        </nav>
      </div>

      <div className="section-faq-list__items">
        {visibleFaqs.length > 0 ? (
          visibleFaqs.map((faq, index) => (
            <details className="section-faq-item" key={faq.id} open={index === 0}>
              <summary className="section-faq-item__summary">
                <span className="section-faq-item__index">Q</span>
                <span className="section-faq-item__question">{faq.title}</span>
                <span className="section-faq-item__icon" aria-hidden="true" />
              </summary>
              <div className="section-faq-item__answer">
                <MarkdownAnswer content={faq.answer} />
              </div>
            </details>
          ))
        ) : (
          <div className="section-faq-list__empty">
            {normalizedSearchQuery ? '검색 결과가 없습니다.' : '표시할 FAQ가 없습니다.'}
          </div>
        )}
      </div>
    </>
  )
}

function CategoryLink({
  active,
  count,
  href,
  label,
}: {
  active: boolean
  count: number
  href: string
  label: string
}) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className="section-faq-list__tab"
      data-active={active ? 'true' : 'false'}
      href={href}
    >
      <span>{label}</span>
      <span className="section-faq-list__tab-count">{count}</span>
    </Link>
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
    <div className="section-faq-answer">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return <MarkdownTable key={index} rows={block.rows} />
        }

        return (
          <p className="section-faq-answer__paragraph" key={index}>
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
    <div className="section-faq-answer__table-wrap">
      <table className="section-faq-answer__table">
        <thead>
          <tr>
            {head.map((cell, index) => (
              <th key={index}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
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
