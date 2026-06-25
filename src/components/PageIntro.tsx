import React from 'react'

import { cn } from '@/utilities/ui'

type PageIntroHeading = 'h1' | 'h2' | 'h3'

type PageIntroProps = {
  align?: 'center' | 'left'
  as?: PageIntroHeading
  className?: string
  description?: React.ReactNode
  descriptionClassName?: string
  eyebrow?: React.ReactNode
  eyebrowClassName?: string
  id?: string
  style?: React.CSSProperties
  title: React.ReactNode
  titleClassName?: string
}

export function PageIntro({
  align = 'left',
  as: Heading = 'h1',
  className,
  description,
  descriptionClassName,
  eyebrow,
  eyebrowClassName,
  id,
  style,
  title,
  titleClassName,
}: PageIntroProps) {
  return (
    <header
      className={cn(
        'page-heading',
        align === 'center' && 'text-center',
        className,
      )}
      style={style}
    >
      {eyebrow ? (
        <p className={cn('page-eyebrow', eyebrowClassName)}>
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn('page-title', titleClassName)}
        id={id}
      >
        {title}
      </Heading>
      {description ? (
        <div className={cn('page-desc', descriptionClassName)}>
          {description}
        </div>
      ) : null}
    </header>
  )
}
