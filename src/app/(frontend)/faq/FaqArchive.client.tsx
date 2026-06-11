'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useRef, useState } from 'react'

import type { CenterSlug } from '@/lib/centers'
import { FilterChips } from '../_components/FilterChips'

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
  const categoryItems = [
    {
      active: !activeCategory,
      count: totalCount,
      href: `/${center}/faq`,
      label: '전체',
    },
    ...categoryTabs.map((category) => ({
      active: activeCategory === category.value,
      count: category.count,
      href: `/${center}/faq?category=${category.value}`,
      label: category.label,
    })),
  ]
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
            className="section-faq-list__search-input type-title-m font-bold leading-[1.4]"
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
            <Search aria-hidden="true" size={18} strokeWidth={2.4} />
          </button>
        </form>

        <FilterChips
          ariaLabel="FAQ 분류"
          className="section-faq-list__tabs"
          countClassName="section-faq-list__tab-count type-label-m font-extrabold leading-none"
          itemClassName="section-faq-list__tab type-title-m font-bold leading-[1.4]"
          items={categoryItems}
          tone="brand"
        />
      </div>

      <div className="section-faq-list__items">
        {visibleFaqs.length > 0 ? (
          visibleFaqs.map((faq, index) => (
            <details className="section-faq-item" key={faq.id} open={index === 0}>
              <summary className="section-faq-item__summary">
                <span className="section-faq-item__index type-label-m font-extrabold leading-[1.2]">
                  Q
                </span>
                <span className="section-faq-item__question type-title-m leading-[1.4]">
                  {faq.title}
                </span>
                <span className="section-faq-item__icon" aria-hidden="true" />
              </summary>
              <div className="section-faq-item__answer type-body-m leading-[1.5]">
                <MarkdownAnswer content={faq.answer} />
              </div>
            </details>
          ))
        ) : (
          <div className="section-faq-list__empty type-title-s font-bold">
            {normalizedSearchQuery ? '검색 결과가 없습니다.' : '표시할 FAQ가 없습니다.'}
          </div>
        )}
      </div>
    </>
  )
}

type MarkdownBlock =
  | {
      href: string
      label: string
      type: 'button'
    }
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

        if (block.type === 'button') {
          return <MarkdownButton href={block.href} key={index} label={block.label} />
        }

        return (
          <p className="section-faq-answer__paragraph" key={index}>
            {renderInlineMarkdownLinks(block.lines.join('\n'))}
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
      <table className="section-faq-answer__table type-body-s">
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

function MarkdownButton({ href, label }: { href: string; label: string }) {
  if (!isSafeFaqHref(href)) {
    return (
      <p className="section-faq-answer__paragraph">
        {`[${label}](${href})`}
      </p>
    )
  }

  if (isInternalFaqHref(href)) {
    return (
      <Link
        className="section-faq-answer__button type-label-m font-extrabold leading-[1.2]"
        href={href}
      >
        {label}
      </Link>
    )
  }

  return (
    <a
      className="section-faq-answer__button type-label-m font-extrabold leading-[1.2]"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
    </a>
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

    const button = parseMarkdownLink(line)

    if (button) {
      flushParagraph()
      blocks.push({
        href: button.href,
        label: button.label,
        type: 'button',
      })
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

function renderInlineMarkdownLinks(text: string) {
  const nodes: React.ReactNode[] = []
  const linkPattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkPattern.exec(text))) {
    const [raw, label, href] = match

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (isSafeFaqHref(href)) {
      nodes.push(
        isInternalFaqHref(href) ? (
          <Link className="section-faq-answer__link" href={href} key={match.index}>
            {label}
          </Link>
        ) : (
          <a
            className="section-faq-answer__link"
            href={href}
            key={match.index}
            rel="noopener noreferrer"
            target="_blank"
          >
            {label}
          </a>
        ),
      )
    } else {
      nodes.push(raw)
    }

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function parseMarkdownLink(line: string) {
  const match = line.trim().match(/^\[([^\]\n]+)\]\(([^)\s]+)\)$/)

  if (!match) {
    return null
  }

  return {
    href: match[2],
    label: match[1],
  }
}

function isInternalFaqHref(href: string) {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#')
}

function isSafeFaqHref(href: string) {
  return (
    isInternalFaqHref(href) ||
    href.startsWith('#') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
}
