import type { CenterSlug } from '@/lib/centers'
import type { BroadcastStation, Media, Profile, ScreenAppearance } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { publishedImageSrc } from '@/utilities/publishedImageSrc'

import type { CenterHomeScreenAppearanceSlide } from './CenterHomeScreenAppearances.client'

export type HomeScreenAppearance = Pick<
  ScreenAppearance,
  | 'id'
  | 'appearanceType'
  | 'actorInputMode'
  | 'bodyImages'
  | 'broadcastStation'
  | 'className'
  | 'linkedProfiles'
  | 'performerName'
  | 'profileImageMedia'
  | 'profileImagePath'
  | 'projectTitle'
  | 'publishedAt'
  | 'roleName'
  | 'slug'
  | 'thumbnailMedia'
  | 'thumbnailPath'
  | 'title'
>

export function screenAppearanceSlide(
  appearance: HomeScreenAppearance,
  center: CenterSlug,
): CenterHomeScreenAppearanceSlide {
  const broadcastStation = getHomeBroadcastStation(appearance.broadcastStation)

  return {
    broadcastLogoAlt: broadcastStation?.stationName ? `${broadcastStation.stationName} 로고` : '',
    broadcastLogoUrl: screenAppearanceBroadcastLogoUrl(broadcastStation),
    href: `/${center}/screen-appearances/${encodeURIComponent(appearance.slug)}`,
    id: appearance.id,
    meta: screenAppearanceMeta(appearance),
    performerName: featuredPerformerName(appearance),
    performerRole: featuredPerformerRole(appearance),
    profileImageUrl: screenAppearanceProfileImageUrl(appearance),
    projectTitle: featuredTitle(appearance),
    sceneImageUrl: screenAppearanceSceneImageUrl(appearance),
  }
}

function screenAppearanceSceneImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  return screenAppearanceBodyImageUrl(appearance) || screenAppearanceImageUrl(appearance)
}

function screenAppearanceBodyImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  const bodyImage = appearance?.bodyImages?.find(
    (item) => item?.image && typeof item.image === 'object',
  )?.image

  return mediaUrl(bodyImage as Media | undefined)
}

function screenAppearanceProfileImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  return (
    screenAppearanceLinkedProfileImageUrl(appearance) ||
    mediaUrl(appearance?.profileImageMedia) ||
    normalizeImageUrl(appearance?.profileImagePath)
  )
}

function screenAppearanceLinkedProfileImageUrl(
  appearance: HomeScreenAppearance | null | undefined,
) {
  if (appearance?.actorInputMode === 'manual') {
    return ''
  }

  const profile = appearance?.linkedProfiles?.find(
    (item): item is Profile => typeof item === 'object' && item !== null,
  )

  return mediaUrl(profile?.profileImageMedia)
}

function screenAppearanceBroadcastLogoUrl(station: BroadcastStation | null | undefined) {
  return mediaUrl(station?.logoMedia)
}

function screenAppearanceImageUrl(appearance: HomeScreenAppearance | null | undefined) {
  return mediaUrl(appearance?.thumbnailMedia) || normalizeImageUrl(appearance?.thumbnailPath)
}

function mediaUrl(value: number | null | Media | undefined) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const media = value as Media
  const url =
    media.sizes?.medium?.url || media.url || (media.filename ? `/media/${media.filename}` : '')

  return getMediaUrl(url, media.updatedAt)
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = publishedImageSrc(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

function featuredTitle(appearance: HomeScreenAppearance | null | undefined) {
  return appearance?.projectTitle?.trim() || appearance?.title || '배우앤배움 출연장면'
}

function featuredPerformerName(appearance: HomeScreenAppearance | null | undefined) {
  return appearance?.performerName?.trim() || linkedProfileNames(appearance) || '배우앤배움 수강생'
}

function featuredPerformerRole(appearance: HomeScreenAppearance | null | undefined) {
  return appearance?.roleName?.trim() || ''
}

function screenAppearanceMeta(appearance: HomeScreenAppearance) {
  const station = getHomeBroadcastStation(appearance.broadcastStation)
  const stationName = station?.stationName?.trim()

  return [stationName, screenAppearanceTypeText(appearance.appearanceType)]
    .filter(Boolean)
    .join(' ')
}

function linkedProfileNames(appearance: HomeScreenAppearance | null | undefined) {
  return appearance?.linkedProfiles
    ?.filter((item): item is Profile => typeof item === 'object' && item !== null)
    .map((profile) => profile.name?.trim())
    .filter(Boolean)
    .join(', ') ?? ''
}

function screenAppearanceTypeText(value: HomeScreenAppearance['appearanceType'] | undefined) {
  if (value === 'commercial') {
    return '광고 출연장면'
  }

  if (value === 'movie') {
    return '영화 출연장면'
  }

  return '드라마 출연장면'
}

function getHomeBroadcastStation(value: HomeScreenAppearance['broadcastStation']) {
  return value && typeof value === 'object' ? (value as BroadcastStation) : null
}
