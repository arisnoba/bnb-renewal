'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export function AnimatedCounter({ value, duration = 1.2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    const controls = animate(0, value, {
      duration: duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setCount(Math.round(latest))
      },
    })

    return () => controls.stop()
  }, [inView, value, duration])

  return <span ref={ref}>{new Intl.NumberFormat('ko-KR').format(count)}</span>
}
