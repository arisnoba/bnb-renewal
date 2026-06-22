"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, type MotionProps } from "motion/react"

import { cn } from "@/utilities/ui"

interface WordRotateProps {
  words: string[]
  activeWord?: string
  duration?: number
  motionProps?: MotionProps
  className?: string
  inline?: boolean
}

export function WordRotate({
  words,
  activeWord,
  duration = 2500,
  motionProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
  inline = false,
}: WordRotateProps) {
  const [index, setIndex] = useState(0)
  const visibleWord = activeWord ?? words[index] ?? ''

  useEffect(() => {
    if (activeWord || words.length <= 1) return

    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    // Clean up interval on unmount
    return () => clearInterval(interval)
  }, [activeWord, words, duration])

  if (inline) {
    return (
      <span className="inline-block overflow-hidden py-2 align-bottom">
        <AnimatePresence mode="wait">
          <motion.span
            key={visibleWord}
            className={cn(className)}
            {...motionProps}
          >
            {visibleWord}
          </motion.span>
        </AnimatePresence>
      </span>
    )
  }

  return (
    <div className="overflow-hidden py-2">
      <AnimatePresence mode="wait">
        <motion.h1
          key={visibleWord}
          className={cn(className)}
          {...motionProps}
        >
          {visibleWord}
        </motion.h1>
      </AnimatePresence>
    </div>
  )
}
