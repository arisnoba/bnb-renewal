import Link from 'next/link'
import React from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import type { CenterSlug } from '@/lib/centers'
import { cn } from '@/utilities/ui'

type DetailWidth = 'narrow' | 'wide'

const detailWidthClass: Record<DetailWidth, string> = {
  narrow: 'container-sm',
  wide: 'container',
}

type DetailPageProps = {
  center?: CenterSlug | string
  children: React.ReactNode
  className?: string
  sectionClassName?: string
  tone?: 'dark' | 'light'
}

export function DetailPage({
  center,
  children,
  className,
  sectionClassName,
  tone = 'light',
}: DetailPageProps) {
  return (
    <article
      className={cn(
        'page page-detail page-top-offset',
        tone === 'dark' ? 'page-dark' : 'page-light',
        className,
      )}
      data-center={center}
    >
      <section className={cn('section-detail section-p-block-base', sectionClassName)}>
        {children}
      </section>
    </article>
  )
}

type DetailContainerProps = {
  children: React.ReactNode
  className?: string
  width?: DetailWidth
}

export function DetailContainer({
  children,
  className,
  width = 'narrow',
}: DetailContainerProps) {
  return (
    <div className={cn(detailWidthClass[width], className)}>
      {children}
    </div>
  )
}

type DetailBackLinkProps = {
  href: string
  label: string
  width?: DetailWidth
}

export function DetailBackLink({ href, label, width = 'narrow' }: DetailBackLinkProps) {
  return (
    <DetailContainer className="mb-10 md:mb-16" width={width}>
      <div className="border-b border-foreground pb-7">
        <Link
          className="inline-flex items-center gap-4 type-label-l font-bold text-foreground transition-colors hover:text-brand"
          href={href}
        >
          <ArrowLeft aria-hidden="true" className="size-6" strokeWidth={2.2} />
          <span>{label}</span>
        </Link>
      </div>
    </DetailContainer>
  )
}

type DetailHeaderProps = {
  dateTime?: string | null
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  title: React.ReactNode
}

export function DetailHeader({
  dateTime,
  description,
  eyebrow,
  title,
}: DetailHeaderProps) {
  return (
    <header className="mb-10 md:mb-16">
      {(eyebrow || dateTime) && (
        <div className="mb-7 flex items-start justify-between gap-8 type-label-l font-bold leading-[1.35] text-muted-foreground">
          <div>{eyebrow}</div>
          {dateTime && <time dateTime={dateTime}>{formatDate(dateTime)}</time>}
        </div>
      )}
      <h1 className="type-headline-xl font-extrabold leading-[1.35] text-foreground">
        {title}
      </h1>
      {description && (
        <div className="mt-7 type-body-m font-medium leading-[1.65] text-muted-foreground">
          {description}
        </div>
      )}
    </header>
  )
}

type DetailPagerProps = {
  nextHref?: string | null
  nextLabel?: string
  previousHref?: string | null
  previousLabel?: string
  width?: DetailWidth
}

export function DetailPager({
  nextHref,
  nextLabel = '다음 글',
  previousHref,
  previousLabel = '이전 글',
  width = 'narrow',
}: DetailPagerProps) {
  return (
    <DetailContainer className="mt-16" width={width}>
      <nav
        aria-label="상세 페이지 이동"
        className="flex min-h-22 items-center justify-between gap-6 border-t border-foreground py-8"
      >
        <DetailPagerLink direction="previous" href={previousHref} label={previousLabel} />
        <DetailPagerLink direction="next" href={nextHref} label={nextLabel} />
      </nav>
    </DetailContainer>
  )
}

function DetailPagerLink({
  direction,
  href,
  label,
}: {
  direction: 'next' | 'previous'
  href?: string | null
  label: string
}) {
  const content = (
    <>
      {direction === 'previous' && (
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.4} />
      )}
      <span>{label}</span>
      {direction === 'next' && (
        <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.4} />
      )}
    </>
  )
  const className = cn(
    'inline-flex items-center gap-2 type-label-l font-semibold transition-colors',
    direction === 'next' && 'text-right',
    href ? 'text-foreground hover:text-brand' : 'text-muted-foreground/40',
  )

  if (!href) {
    return (
      <span aria-disabled="true" className={className}>
        {content}
      </span>
    )
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}. ${month}. ${day}`
}
