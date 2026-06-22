'use client'

import { useEffect, useRef, useState } from 'react'

const LINE_COUNT = 3

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
      className="text-deco pointer-events-none absolute inset-0 flex select-none flex-col justify-center overflow-hidden font-extrabold leading-none text-white/[0.03]"
      ref={textRef}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      <span>BAEWOO</span>
      <span>NEW</span>
      <span>BRANDING</span>
    </p>
  )
}
