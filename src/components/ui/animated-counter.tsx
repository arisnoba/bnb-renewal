'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'framer-motion'

interface AnimatedCounterProps {
  duration?: number
  startOnMount?: boolean
  value: number
}

export function AnimatedCounter({ value, duration = 1.2, startOnMount = false }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!startOnMount && !inView) return

    const controls = animate(0, value, {
      duration: duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setCount(Math.round(latest))
      },
    })

    return () => controls.stop()
  }, [duration, inView, startOnMount, value])

  return <span ref={ref}>{new Intl.NumberFormat('ko-KR').format(count)}</span>
}
