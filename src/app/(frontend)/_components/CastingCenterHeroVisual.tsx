import Image from 'next/image'

import { cn } from '@/utilities/ui'

type CastingCenterHeroVisualProps = {
  className?: string
  imageClassName?: string
  mediaClassName?: string
  priority?: boolean
}

const castingCenterHeroImage = '/assets/casting/hero-posters.png'

export function CastingCenterHeroVisual({
  className,
  imageClassName,
  mediaClassName,
  priority = true,
}: CastingCenterHeroVisualProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'section-casting-center-hero-visual absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div
        className={cn(
          'section-casting-center-hero-visual__media absolute left-1/2 top-1/2 h-[760px] w-[1280px] max-w-none rounded-2xl -translate-x-1/2 -translate-y-1/2 rotate-[-5.5deg] md:h-[1050px] md:w-[1900px] xl:h-[1269px] xl:w-[2406px]',
          mediaClassName,
        )}
      >
        <Image
          alt=""
          className={cn('size-full object-cover opacity-65', imageClassName)}
          fill
          priority={priority}
          sizes="100vw"
          src={castingCenterHeroImage}
        />
      </div>
    </div>
  )
}
