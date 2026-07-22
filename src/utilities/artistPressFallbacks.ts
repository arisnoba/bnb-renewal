import type { Metadata } from 'next'

import type { CenterSlug } from '@/lib/centers'
import type { ArtistPress } from '@/payload-types'

import { asMedia, metadataImageUrlFromMedia } from './metadataImage'
import { mergeOpenGraph } from './mergeOpenGraph'
import { centerPublicHref, publicCenterPath } from '@/lib/centerDomains'

type ArtistPressLike = Partial<ArtistPress>

export function hasArtistPressLexicalContent(value: ArtistPressLike['body']) {
  const children = value?.root?.children
  return Array.isArray(children) && children.length > 0
}

export function getArtistPressDescription(artistPress: ArtistPressLike) {
  return (
    artistPress.meta?.description ||
    [artistPress.actorName, artistPress.generation].filter(Boolean).join(' ')
  )
}

export function getArtistPressThumbnailMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.thumbnailMedia)
}

export function getArtistPressAgencyLogoMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.agencyLogoMedia) || asMedia(agencyLogoMedia(artistPress.agency))
}

export function getArtistPressSeoImageMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.meta?.image) || asMedia(artistPress.thumbnailMedia)
}

export function getArtistPressUrl(artistPress: Pick<ArtistPress, 'id'>, center?: CenterSlug) {
  const path = `/artist-press/${encodeURIComponent(String(artistPress.id))}`

  return center ? centerPublicHref(center, path) : path
}

export function generateArtistPressMeta(
  artistPress: ArtistPressLike | null,
  center?: CenterSlug,
): Metadata {
  const title = artistPress?.meta?.title || artistPress?.title || '출신 아티스트'
  const description = artistPress ? getArtistPressDescription(artistPress) : undefined
  const imageUrl = artistPress ? getArtistPressMetaImageUrl(artistPress) : undefined
  const canonicalPath = artistPress?.id
    ? getArtistPressUrl({ id: artistPress.id }, center)
    : center
      ? centerPublicHref(center, '/artist-press')
      : '/artist-press'
  const publicCanonicalPath = center ? publicCenterPath(canonicalPath, center) : canonicalPath

  return {
    description,
    openGraph: mergeOpenGraph(
      {
        description: description || '',
        images: imageUrl ? [{ url: imageUrl }] : undefined,
        title,
        url: publicCanonicalPath,
      },
      center ? { center } : undefined,
    ),
    title,
  }
}

function getArtistPressMetaImageUrl(artistPress: ArtistPressLike) {
  return metadataImageUrlFromMedia(getArtistPressSeoImageMedia(artistPress))
}

function agencyLogoMedia(agency: ArtistPressLike['agency']) {
  if (!agency || typeof agency !== 'object') {
    return undefined
  }

  return agency.logoMedia
}
