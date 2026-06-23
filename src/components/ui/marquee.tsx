'use client'

import { type ComponentPropsWithoutRef, useRef } from 'react'

import { cn } from '@/utilities/ui'

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean
  /**
   * Whether to slow down the animation on hover without resetting its current position
   * @default false
   */
  slowOnHover?: boolean
  /**
   * Playback rate used while hovering when slowOnHover is enabled
   * @default 0.5
   */
  hoverPlaybackRate?: number
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  slowOnHover = false,
  hoverPlaybackRate = 0.5,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const setPlaybackRate = (playbackRate: number) => {
    if (!slowOnHover || pauseOnHover) {
      return
    }

    rootRef.current
      ?.getAnimations({ subtree: true })
      .forEach((animation) => {
        animation.playbackRate = playbackRate
      })
  }

  return (
    <div
      {...props}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event)
        setPlaybackRate(hoverPlaybackRate)
      }}
      onMouseLeave={(event) => {
        props.onMouseLeave?.(event)
        setPlaybackRate(1)
      }}
      ref={rootRef}
      className={cn(
        'group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]',
        {
          'flex-row': !vertical,
          'flex-col': vertical,
        },
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn('flex shrink-0 justify-around gap-(--gap) motion-reduce:animate-none', {
              'animate-marquee flex-row': !vertical,
              'animate-marquee-vertical flex-col': vertical,
              'group-hover:[animation-play-state:paused]': pauseOnHover,
              '[animation-direction:reverse]': reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
