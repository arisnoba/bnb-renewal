import type { ExamPassedReview, Main, MainBanner, Profile } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import {
  MainBannerSlider,
  type MainBannerMarqueeItem,
  type MainBannerSlide,
} from './BannerSlider.client'

type MainBannerSectionProps = {
  center: CenterSlug
  main?: Main | null
}

type LinkedExamReview = NonNullable<MainBanner['linkedExamReviews']>[number]
type LinkedProfile = NonNullable<MainBanner['linkedProfiles']>[number]
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

function textValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function isProfile(value: LinkedProfile): value is Profile {
  return Boolean(value && typeof value === 'object')
}

function isExamReview(value: LinkedExamReview): value is ExamPassedReview {
  return Boolean(value && typeof value === 'object')
}

export function mainBannerAnchorHref(center: CenterSlug) {
  return center === 'exam' ? '/exam#exam-passed-reviews' : `/${center}#profiles`
}

function mainBannerProfileHref(profile: Profile, center: CenterSlug) {
  const slug = textValue(profile.slug)

  return slug ? `/profiles/${encodeURIComponent(slug)}` : mainBannerAnchorHref(center)
}

export function mainBannerMarqueeItems(
  banner: MainBanner,
  center: CenterSlug,
): MainBannerMarqueeItem[] {
  const href = mainBannerAnchorHref(center)

  if (center === 'exam') {
    return (banner.linkedExamReviews ?? [])
      .filter(isExamReview)
      .map((review) => ({
        href,
        label: textValue(review.title, review.studentName) || '합격후기',
      }))
  }

  return (banner.linkedProfiles ?? [])
    .filter(isProfile)
    .map((profile) => ({
      href: mainBannerProfileHref(profile, center),
      label: textValue(profile.name, profile.englishName) || '프로필',
    }))
}

export function toSlide(banner: MainBanner, center: CenterSlug): MainBannerSlide {
  return {
    broadcaster: banner.broadcaster,
    description: banner.description,
    desktopImage: banner.desktopImage,
    desktopVideo: banner.desktopVideo,
    marqueeItems: mainBannerMarqueeItems(banner, center),
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
    .map((banner) => toSlide(banner, center))

  if (activeBanners.length === 0) {
    return null
  }

  return <MainBannerSlider banners={activeBanners} />
}
