import type { Main, MainBanner } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import { MainBannerSlider, type MainBannerSlide } from './BannerSlider.client'

type MainBannerSectionProps = {
  center: CenterSlug
  main?: Main | null
}

type MainBannerOrderField = `${CenterSlug}Banners`
type MainBannerOrderRow = NonNullable<Main[MainBannerOrderField]>[number]

const centerOrderField: Record<CenterSlug, MainBannerOrderField> = {
  art: 'artBanners',
  avenue: 'avenueBanners',
  exam: 'examBanners',
  highteen: 'highteenBanners',
  kids: 'kidsBanners',
}

function parseDate(value: unknown) {
  if (!value) {
    return undefined
  }

  const date = new Date(value as string | Date)

  return Number.isNaN(date.getTime()) ? undefined : date
}

function isActiveBanner(banner: MainBanner, center: CenterSlug, now: Date) {
  if (banner.status !== 'published') {
    return false
  }

  if (banner.center !== center) {
    return false
  }

  if (!banner.useReservation) {
    return true
  }

  const publishStartAt = parseDate(banner.publishStartAt)
  const publishEndAt = parseDate(banner.publishEndAt)

  if (!publishStartAt || !publishEndAt) {
    return false
  }

  if (publishStartAt > now || publishEndAt < now) {
    return false
  }

  return true
}

function toSlide(banner: MainBanner): MainBannerSlide {
  return {
    broadcaster: banner.broadcaster,
    description: banner.description,
    desktopImage: banner.desktopImage,
    desktopVideo: banner.desktopVideo,
    mobileImage: banner.mobileImage,
    mobileVideo: banner.mobileVideo,
    title: banner.title,
  }
}

function rowBanner(row: MainBannerOrderRow): MainBanner | null {
  return row.banner && typeof row.banner === 'object' ? row.banner : null
}

export function MainBannerSection({ center, main }: MainBannerSectionProps) {
  const now = new Date()
  const rows = main?.[centerOrderField[center]] ?? []
  const activeBanners = rows
    .map(rowBanner)
    .filter((banner): banner is MainBanner => Boolean(banner))
    .filter((banner) => isActiveBanner(banner, center, now))
    .map(toSlide)

  if (activeBanners.length === 0) {
    return null
  }

  return <MainBannerSlider banners={activeBanners} />
}
