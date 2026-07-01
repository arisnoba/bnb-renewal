'use client'

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'

type SmoothAnchorLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode
  href: `#${string}`
}

export function SmoothAnchorLink({
  children,
  href,
  onClick,
  ...props
}: SmoothAnchorLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    handleSmoothAnchorClick(event)
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

export function handleSmoothAnchorClick(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return
  }

  const href = event.currentTarget.getAttribute('href')

  if (!href?.startsWith('#')) {
    return
  }

  const targetId = decodeURIComponent(href.slice(1))
  const target = document.getElementById(targetId)

  if (!target) {
    return
  }

  event.preventDefault()
  window.history.pushState(null, '', href)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  })
}
