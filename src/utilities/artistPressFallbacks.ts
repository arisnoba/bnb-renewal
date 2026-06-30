import type { Metadata } from 'next'

import type { CenterSlug } from '@/lib/centers'
import type { ArtistPress } from '@/payload-types'

import { asMedia, metadataImageUrlFromMedia } from './metadataImage'
import { mergeOpenGraph } from './mergeOpenGraph'

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
  return asMedia(artistPress.agencyLogoMedia)
}

export function getArtistPressSeoImageMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.meta?.image) || asMedia(artistPress.thumbnailMedia)
}

export function getArtistPressUrl(artistPress: Pick<ArtistPress, 'slug'>, center?: string) {
  const path = `/artist-press/${encodeURIComponent(artistPress.slug)}`

  return center ? `/${center}${path}` : path
}

export function generateArtistPressMeta(
  artistPress: ArtistPressLike | null,
  center?: CenterSlug,
): Metadata {
  const title = artistPress?.meta?.title || artistPress?.title || '출신 아티스트'
  const description = artistPress ? getArtistPressDescription(artistPress) : undefined
  const imageUrl = artistPress ? getArtistPressMetaImageUrl(artistPress) : undefined
  const canonicalPath = artistPress?.slug
    ? getArtistPressUrl({ slug: artistPress.slug }, center)
    : center
      ? `/${center}/artist-press`
      : '/artist-press'

  return {
    description,
    openGraph: mergeOpenGraph(
      {
        description: description || '',
        images: imageUrl ? [{ url: imageUrl }] : undefined,
        title,
        url: canonicalPath,
      },
      center ? { center } : undefined,
    ),
    title,
  }
}

function getArtistPressMetaImageUrl(artistPress: ArtistPressLike) {
  return metadataImageUrlFromMedia(getArtistPressSeoImageMedia(artistPress))
}
