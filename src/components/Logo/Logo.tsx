import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

interface Props {
  alt?: string
  className?: string
  height?: number
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  src: string
  width?: number
}

export const Logo = (props: Props) => {
  const { alt = '배우앤배움', className, height = 36, loading, priority, src, width = 120 } = props

  return (
    <Image
      alt={alt}
      className={clsx(
        'block h-auto max-w-full',
        className,
      )}
      fetchPriority={priority}
      height={height}
      loading={loading}
      priority={priority === 'high'}
      src={src}
      width={width}
    />
  )
}
