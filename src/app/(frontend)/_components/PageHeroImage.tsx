import Image from 'next/image'

import type { CenterSlug } from '@/lib/centers'
import { cn } from '@/utilities/ui'

type HeroImageSet = {
  desktop: string
  mobile: string
}

type PageHeroImageProps = {
  className?: string
  image: HeroImageSet
  priority?: boolean
}

const heroRoot = '/assets/hero'

const aboutHeroImage = heroImageSet(`${heroRoot}/about`)

const educationHeroImages = {
  art: heroImageSet(`${heroRoot}/education/art`),
  avenue: heroImageSet(`${heroRoot}/education/art`),
  exam: heroImageSet(`${heroRoot}/education/exam`),
  highteen: heroImageSet(`${heroRoot}/education/highteen`),
  kids: heroImageSet(`${heroRoot}/education/kids`),
} satisfies Record<CenterSlug, HeroImageSet>

const artistHeroImages = {
  art: heroImageSet(`${heroRoot}/artist/art`),
  avenue: heroImageSet(`${heroRoot}/artist/art`),
  exam: heroImageSet(`${heroRoot}/passed/exam`),
  highteen: heroImageSet(`${heroRoot}/artist/art`),
  kids: heroImageSet(`${heroRoot}/artist/kids`),
} satisfies Record<CenterSlug, HeroImageSet>

const examResultsHeroImage = heroImageSet(`${heroRoot}/results/exam`)
const examPassedHeroImage = heroImageSet(`${heroRoot}/passed/exam`)
const mobileHeroSizes = '(max-width: 767px) 100vw, 0px'
const desktopHeroSizes = '(max-width: 767px) 0px, 100vw'

export function PageHeroImage({
  className,
  image,
  priority = true,
}: PageHeroImageProps) {
  const imageClassName = cn('absolute inset-0 size-full object-cover object-center', className)

  return (
    <>
      <Image
        alt=""
        aria-hidden="true"
        className={cn(imageClassName, 'md:hidden')}
        fill
        priority={priority}
        sizes={mobileHeroSizes}
        src={image.mobile}
      />
      <Image
        alt=""
        aria-hidden="true"
        className={cn(imageClassName, 'hidden md:block')}
        fill
        priority={priority}
        sizes={desktopHeroSizes}
        src={image.desktop}
      />
    </>
  )
}

export function getAboutHeroImage() {
  return aboutHeroImage
}

export function getEducationHeroImage(center: CenterSlug) {
  return educationHeroImages[center]
}

export function getArtistHeroImage(center: CenterSlug) {
  return artistHeroImages[center]
}

export function getExamResultsHeroImage() {
  return examResultsHeroImage
}

export function getExamPassedHeroImage() {
  return examPassedHeroImage
}

function heroImageSet(basePath: string): HeroImageSet {
  return {
    desktop: `${basePath}/hero-desk.jpg`,
    mobile: `${basePath}/hero-mobile.jpg`,
  }
}
