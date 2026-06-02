import type { ExamPassedReview, Main, MainBanner, Profile } from '@/payload-types'
import type { CenterSlug } from '@/lib/centers'

import {
  DEFAULT_MAIN_BANNER_AUTOPLAY_DELAY,
  MainBannerSlider,
  type MainBannerCardItem,
  type MainBannerMarqueeItem,
  type MainBannerSlide,
} from './BannerSlider.client'

type MainBannerSectionProps = {
  center: CenterSlug
  main?: Main | null
}

type LinkedExamReviewItem = NonNullable<MainBanner['linkedExamReviewItems']>[number]
type LinkedProfileItem = NonNullable<MainBanner['linkedProfileItems']>[number]
type MainBannerOrderField = `${CenterSlug}Banners`
type MainBannerOrderRow = NonNullable<Main[MainBannerOrderField]>[number]
type MainBannerAutoplayField = `${CenterSlug}BannerAutoplay`
type MainBannerAutoplayDelayField = `${CenterSlug}BannerAutoplayDelay`

const centerOrderField: Record<CenterSlug, MainBannerOrderField> = {
  art: 'artBanners',
  avenue: 'avenueBanners',
  exam: 'examBanners',
  highteen: 'highteenBanners',
  kids: 'kidsBanners',
}

const centerAutoplayField: Record<CenterSlug, MainBannerAutoplayField> = {
  art: 'artBannerAutoplay',
  avenue: 'avenueBannerAutoplay',
  exam: 'examBannerAutoplay',
  highteen: 'highteenBannerAutoplay',
  kids: 'kidsBannerAutoplay',
}

const centerAutoplayDelayField: Record<CenterSlug, MainBannerAutoplayDelayField> = {
  art: 'artBannerAutoplayDelay',
  avenue: 'avenueBannerAutoplayDelay',
  exam: 'examBannerAutoplayDelay',
  highteen: 'highteenBannerAutoplayDelay',
  kids: 'kidsBannerAutoplayDelay',
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

function isProfile(value: LinkedProfileItem['profile']): value is Profile {
  return Boolean(value && typeof value === 'object')
}

function isExamReview(value: LinkedExamReviewItem['review']): value is ExamPassedReview {
  return Boolean(value && typeof value === 'object')
}

function labelWithDetail(primary: string, detail: unknown, fallback: string) {
  const detailText = textValue(detail)

  if (primary && detailText) {
    return `${primary} | ${detailText}`
  }

  return primary || detailText || fallback
}

export function mainBannerAnchorHref(center: CenterSlug) {
  return center === 'exam' ? '/exam#exam-passed-reviews' : `/${center}#profiles`
}

function mainBannerProfileHref(profile: Profile, center: CenterSlug) {
  const slug = textValue(profile.slug)

  return slug ? `/profiles/${encodeURIComponent(slug)}` : mainBannerAnchorHref(center)
}

function mainBannerProfileImage(profile: Profile) {
  return profile.profileImageMedia || textValue(profile.profileImagePath) || null
}

function mainBannerExamReviewImage(review: ExamPassedReview) {
  return textValue(review.studentImagePath) || null
}

export function mainBannerMarqueeItems(
  banner: MainBanner,
  center: CenterSlug,
): MainBannerMarqueeItem[] {
  const href = mainBannerAnchorHref(center)

  if (center === 'exam') {
    return (banner.linkedExamReviewItems ?? [])
      .map((item) => {
        const review = item.review

        if (!isExamReview(review)) {
          return null
        }

        const cardItem: MainBannerCardItem = {
          type: 'card',
          buttonLabel: '후기 보기',
          href,
          image: mainBannerExamReviewImage(review),
          imageAlt: textValue(review.studentName, review.title) || '합격후기',
          label: labelWithDetail(
            textValue(review.studentName, review.title),
            item.resultLabel,
            '합격후기',
          ),
          name: textValue(review.studentName, review.title) || '합격후기',
          roleLabel: textValue(item.resultLabel),
        }

        return cardItem
      })
      .filter((item): item is MainBannerCardItem => Boolean(item))
  }

  return (banner.linkedProfileItems ?? [])
    .map((item) => {
      const profile = item.profile

      if (!isProfile(profile)) {
        return null
      }

      const cardItem: MainBannerCardItem = {
        type: 'card',
        buttonLabel: '프로필 보기',
        href: mainBannerProfileHref(profile, center),
        image: mainBannerProfileImage(profile),
        imageAlt: textValue(profile.name, profile.englishName) || '프로필',
        label: labelWithDetail(textValue(profile.name, profile.englishName), item.roleLabel, '프로필'),
        name: textValue(profile.name, profile.englishName) || '프로필',
        roleLabel: textValue(item.roleLabel),
      }

      return cardItem
    })
    .filter((item): item is MainBannerCardItem => Boolean(item))
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

export function mainBannerAutoplaySettings(main: Main | null | undefined, center: CenterSlug) {
  const autoplayValue = main?.[centerAutoplayField[center]]
  const autoplayDelayValue = main?.[centerAutoplayDelayField[center]]

  return {
    autoplayDelay:
      typeof autoplayDelayValue === 'number' && Number.isFinite(autoplayDelayValue) && autoplayDelayValue > 0
        ? autoplayDelayValue
        : DEFAULT_MAIN_BANNER_AUTOPLAY_DELAY,
    autoplayEnabled: autoplayValue === false ? false : true,
  }
}

function rowBanner(row: MainBannerOrderRow): MainBanner | null {
  return row.banner && typeof row.banner === 'object' ? row.banner : null
}

export function MainBannerSection({ center, main }: MainBannerSectionProps) {
  const now = new Date()
  const rows = main?.[centerOrderField[center]] ?? []
  const autoplaySettings = mainBannerAutoplaySettings(main, center)
  const activeBanners = rows
    .map(rowBanner)
    .filter((banner): banner is MainBanner => Boolean(banner))
    .filter((banner) => isActiveBanner(banner, center, now))
    .map((banner) => toSlide(banner, center))

  if (activeBanners.length === 0) {
    return null
  }

  return <MainBannerSlider banners={activeBanners} {...autoplaySettings} />
}
