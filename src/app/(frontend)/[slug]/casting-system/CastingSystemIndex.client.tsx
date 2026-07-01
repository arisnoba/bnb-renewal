'use client'

import { useEffect, useState } from 'react'

import { ChevronRight } from 'lucide-react'

import { SmoothAnchorLink } from '../../_components/SmoothAnchorLink.client'

type CastingSystemIndexItem = {
  id: string
  title: string
}

type CastingSystemIndexProps = {
  items: CastingSystemIndexItem[]
}

export function CastingSystemIndex({ items }: CastingSystemIndexProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')

  useEffect(() => {
    if (items.length === 0) {
      return
    }

    let frameId = 0

    const updateActiveItem = () => {
      frameId = 0

      const pageTopOffset = getPageTopOffset()
      const activationY = pageTopOffset + window.innerHeight * 0.18
      let nextActiveId = items[0]?.id ?? ''

      for (const item of items) {
        const element = document.getElementById(item.id)

        if (!element) {
          continue
        }

        if (element.getBoundingClientRect().top <= activationY) {
          nextActiveId = item.id
        } else {
          break
        }
      }

      setActiveId(nextActiveId)
    }

    const scheduleUpdate = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateActiveItem)
    }

    updateActiveItem()
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
  }, [items])

  return (
    <nav
      aria-label="배우 케어 시스템 목차"
      className="section-casting-system-list__nav mt-12 flex flex-col gap-3 md:mt-16"
    >
      {items.map((item) => {
        const isActive = activeId === item.id

        return (
          <SmoothAnchorLink
            aria-current={isActive ? 'true' : undefined}
            className={[
              'section-casting-system-list__nav-link group relative inline-flex w-fit items-center py-1 type-label-m font-semibold transition-[color,padding] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand',
              isActive ? 'pl-5 text-neutral-900' : 'pl-0 text-neutral-400 hover:text-neutral-900',
            ].join(' ')}
            href={`#${item.id}`}
            key={item.id}
          >
            <ChevronRight
              aria-hidden="true"
              className={[
                'absolute left-0 top-1/2 size-4 -translate-y-1/2 text-brand transition-opacity',
                isActive ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              strokeWidth={2.3}
            />
            <span>{item.title}</span>
          </SmoothAnchorLink>
        )
      })}
    </nav>
  )
}

function getPageTopOffset() {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--page-top-offset')

  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : 84
}
