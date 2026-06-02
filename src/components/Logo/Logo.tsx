import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { className } = props

  return (
    <span
      aria-label="배우앤배움"
      className={clsx(
        'inline-flex items-end gap-1 text-[22px] font-black leading-none tracking-normal text-current',
        className,
      )}
    >
      <span>배우앤배움</span>
      <span className="mb-0.5 text-[8px] font-black uppercase leading-none">Art Center</span>
    </span>
  )
}
