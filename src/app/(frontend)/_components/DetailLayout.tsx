import Link from 'next/link'
import React from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import { Media } from '@/components/Media/Renderer'
import type { CenterSlug } from '@/lib/centers'
import type { Media as PayloadMedia } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { FloatingDock } from './FloatingDock.client'

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
      <section className={cn('section-detail section-p-t-sm section-p-b-lg', sectionClassName)}>
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
    <DetailContainer className="mb-10" width={width}>
      <div className="border-b-2 border-foreground pb-7">
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
        <div className="mb-6 flex items-start justify-between gap-8 type-label-l font-semibold leading-[1.35] text-muted-foreground">
          <div>{eyebrow}</div>
          {dateTime && <time className='font-medium' dateTime={dateTime}>{formatDate(dateTime)}</time>}
        </div>
      )}
      <h1 className="type-headline-xl font-bold leading-[1.35] text-foreground">
        {title}
      </h1>
      {description && (
        <div className="mt-10 type-body-m font-medium leading-[1.65] text-muted-foreground">
          {description}
        </div>
      )}
    </header>
  )
}

type DetailMediaProps = {
  alt?: string
  className?: string
  imageClassName?: string
  pictureClassName?: string
  priority?: boolean
  resource: PayloadMedia
  size: string
}

export function DetailMedia({
  alt,
  className,
  imageClassName,
  pictureClassName,
  priority,
  resource,
  size,
}: DetailMediaProps) {
  return (
    <Media
      alt={alt}
      htmlElement={null}
      imgClassName={cn(
        'mx-auto w-full max-w-full h-auto max-h-full object-contain',
        imageClassName,
      )}
      pictureClassName={cn('block w-full', className, pictureClassName)}
      priority={priority}
      resource={resource}
      size={size}
    />
  )
}

type DetailPagerProps = {
  listHref?: string
  listLabel?: string
  nextHref?: string | null
  nextLabel?: string
  previousHref?: string | null
  previousLabel?: string
  tone?: 'dark' | 'light'
  width?: DetailWidth
}

export function DetailPager({
  listHref,
  listLabel = '목록',
  nextHref,
  nextLabel = '다음 글',
  previousHref,
  previousLabel = '이전 글',
  tone = 'light',
  width = 'narrow',
}: DetailPagerProps) {
  return (
    <>
      <DetailContainer className="mt-16" width={width}>
        <nav
          aria-label="상세 페이지 하단 이동"
          className="flex min-h-22 items-center justify-between gap-6 border-t-2 border-foreground py-8"
        >
          <DetailPagerLink direction="previous" href={previousHref} label={previousLabel} />
          <DetailPagerLink direction="next" href={nextHref} label={nextLabel} />
        </nav>
      </DetailContainer>
      {/* <div aria-hidden="true" className="h-24 md:h-28" /> */}
      <FloatingDock
        ariaLabel="상세 페이지 빠른 이동"
        className="section-detail__dock"
        items={[
          {
            ariaLabel: `이전 글: ${previousLabel}`,
            href: previousHref,
            kind: 'previous',
            label: previousLabel,
            shortLabel: '이전',
          },
          {
            ariaLabel: `${listLabel} 목록`,
            href: listHref,
            kind: 'list',
            label: listLabel,
            shortLabel: '목록',
          },
          {
            ariaLabel: `다음 글: ${nextLabel}`,
            href: nextHref,
            kind: 'next',
            label: nextLabel,
            shortLabel: '다음',
          },
        ]}
        showIcons
        tone={tone}
      />
    </>
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
