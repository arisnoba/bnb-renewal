'use client'

import { useEffect, useRef, useState } from 'react'

import { HyperText } from '@/components/ui/hyper-text'

const LINE_COUNT = 3
const DECO_LINES = ['BAEWOO', 'NEW', 'BRANDING'] as const

export function CompanyTextDeco() {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)

  useEffect(() => {
    const text = textRef.current
    const section = text?.closest('.section-company-branding')

    if (!text || !section) {
      return
    }

    const updateFontSize = () => {
      setFontSize(section.getBoundingClientRect().height / LINE_COUNT)
    }

    updateFontSize()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(updateFontSize)
    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <p
      aria-hidden="true"
      className="text-deco pointer-events-none absolute inset-0 flex select-none flex-col justify-center overflow-hidden font-extrabold leading-[.9] text-white/[0.015]"
      ref={textRef}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      <span className="text-deco__inner inline-flex w-max flex-col items-start self-center text-left">
        {DECO_LINES.map((line, index) => (
          <HyperText
            animateOnHover={false}
            as="span"
            characterClassName="font-[inherit]"
            className="block overflow-visible font-[inherit] leading-[inherit]"
            delay={index * 180}
            duration={1200}
            key={line}
            unstyled
          >
            {line}
          </HyperText>
        ))}
      </span>
    </p>
  )
}
