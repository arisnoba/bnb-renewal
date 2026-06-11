import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

export type FilterChipItem = {
  active: boolean
  count?: number
  href: string
  label: string
}

type FilterChipsProps = {
  ariaLabel: string
  className?: string
  countClassName?: string
  itemClassName?: string
  items: readonly FilterChipItem[]
  tone: 'brand' | 'dark'
}

export function FilterChips({
  ariaLabel,
  className,
  countClassName,
  itemClassName,
  items,
  tone,
}: FilterChipsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn('filter-chips', `filter-chips--${tone}`, className)}
    >
      {items.map((item) => (
        <Link
          aria-current={item.active ? 'page' : undefined}
          className={cn('filter-chips__item', itemClassName)}
          data-active={item.active ? 'true' : 'false'}
          href={item.href}
          key={item.href}
          scroll={false}
        >
          <span>{item.label}</span>
          {typeof item.count === 'number' && (
            <span className={cn('filter-chips__count', countClassName)}>{item.count}</span>
          )}
        </Link>
      ))}
    </nav>
  )
}
