'use client'

import { useEffect, useState } from 'react'

import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/utilities/ui'

import { handleSmoothAnchorClick } from './SmoothAnchorLink.client'

type FloatingDockItemKind = 'list' | 'next' | 'previous'

type FloatingDockItem = {
  ariaLabel?: string
  href?: string | null
  kind?: FloatingDockItemKind
  label: string
  shortLabel?: string
}

type FloatingDockProps = {
  ariaLabel: string
  className?: string
  items: readonly FloatingDockItem[]
  sectionIds?: readonly string[]
  showAfterSelector?: string
  showIcons?: boolean
  tone?: 'dark' | 'light'
}

export function FloatingDock({
  ariaLabel,
  className,
  items,
  sectionIds = [],
  showAfterSelector,
  showIcons = false,
  tone = 'light',
}: FloatingDockProps) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '')
  const [isVisible, setIsVisible] = useState(!showAfterSelector)

  useEffect(() => {
    let frameId = 0

    function updateDockState() {
      frameId = 0

      const pageTopOffset = getPageTopOffset()
      const trigger = showAfterSelector ? document.querySelector(showAfterSelector) : null
      const footer = document.querySelector('footer')
      const hasPassedTrigger = trigger
        ? trigger.getBoundingClientRect().bottom <= pageTopOffset + 8
        : true
      const isFooterVisible = footer
        ? footer.getBoundingClientRect().top <= window.innerHeight - 8
        : false

      setIsVisible(hasPassedTrigger && !isFooterVisible)

      if (sectionIds.length === 0) {
        return
      }

      const activationY = pageTopOffset + window.innerHeight * 0.24
      let nextActiveId = sectionIds[0] ?? ''

      for (const id of sectionIds) {
        const element = document.getElementById(id)

        if (!element) {
          continue
        }

        if (element.getBoundingClientRect().top <= activationY) {
          nextActiveId = id
        } else {
          break
        }
      }

      setActiveId(nextActiveId)
    }

    function scheduleUpdate() {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateDockState)
    }

    updateDockState()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', scheduleUpdate)

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', scheduleUpdate)
    }
  }, [sectionIds, showAfterSelector])

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'pointer-events-auto fixed inset-x-4 bottom-5 z-40 mx-auto inline-flex w-fit max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border shadow-xl backdrop-blur-md transition-[opacity,transform] duration-200 md:bottom-8',
        tone === 'dark'
          ? 'border-white/15 bg-neutral-950/88 shadow-black/35'
          : 'border-border bg-white/90 shadow-black/15',
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
        className,
      )}
    >
      {items.map((item, index) => {
        const href = item.href ?? null
        const isAnchor = href?.startsWith('#') ?? false
        const isActive = isAnchor && href ? activeId === href.slice(1) : false
        const label = item.shortLabel ?? item.label
        const content = (
          <>
            {showIcons && item.kind !== 'next' ? <DockIcon kind={item.kind} /> : null}
            <span className="select-none">{label}</span>
            {showIcons && item.kind === 'next' ? <DockIcon kind={item.kind} /> : null}
          </>
        )
        const itemClassName = cn(
          'inline-flex h-11 min-w-19 items-center justify-center gap-2 border-r px-3 type-label-m font-bold transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:h-12 md:min-w-24 md:px-5',
          tone === 'dark'
            ? 'border-white/15 focus-visible:ring-offset-neutral-950'
            : 'border-border focus-visible:ring-offset-white',
          href
            ? tone === 'dark'
              ? 'text-white/75 hover:bg-white/10 hover:text-white'
              : 'text-foreground hover:bg-neutral-100 hover:text-brand'
            : tone === 'dark'
              ? 'text-white/25'
              : 'text-muted-foreground/35',
          isActive && (tone === 'dark' ? 'bg-brand text-white' : 'bg-neutral-100 text-brand'),
        )

        if (!href) {
          return (
            <span aria-disabled="true" className={itemClassName} key={`${item.label}-${index}`}>
              {content}
            </span>
          )
        }

        if (isAnchor) {
          return (
            <a
              aria-current={isActive ? 'true' : undefined}
              aria-label={item.ariaLabel ?? item.label}
              className={itemClassName}
              href={href}
              key={href}
              onClick={handleSmoothAnchorClick}
            >
              {content}
            </a>
          )
        }

        return (
          <Link
            aria-label={item.ariaLabel ?? item.label}
            className={itemClassName}
            href={href}
            key={`${href}-${index}`}
          >
            {content}
          </Link>
        )
      })}
    </nav>
  )
}

function DockIcon({ kind }: { kind?: FloatingDockItemKind }) {
  if (kind === 'previous') {
    return <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.4} />
  }

  if (kind === 'next') {
    return <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
  }

  if (kind === 'list') {
    return <List aria-hidden="true" className="size-4" strokeWidth={2.3} />
  }

  return null
}

function getPageTopOffset() {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--page-top-offset')

  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : 84
}
