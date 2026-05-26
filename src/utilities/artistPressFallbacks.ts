import type { Metadata } from 'next'

import type { ArtistPress, Media } from '@/payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

type ArtistPressLike = Partial<ArtistPress>
type UploadValue = number | null | Media | undefined

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

export function getArtistPressSeoImageMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.meta?.image) || asMedia(artistPress.thumbnailMedia)
}

export function getArtistPressUrl(artistPress: Pick<ArtistPress, 'slug'>) {
  return `/artist-press/${encodeURIComponent(artistPress.slug)}`
}

export function generateArtistPressMeta(artistPress: ArtistPressLike | null): Metadata {
  const title = artistPress?.meta?.title || artistPress?.title || '출신 아티스트'
  const description = artistPress ? getArtistPressDescription(artistPress) : undefined
  const imageUrl = artistPress ? getArtistPressMetaImageUrl(artistPress) : undefined
  const canonicalPath = artistPress?.slug ? getArtistPressUrl({ slug: artistPress.slug }) : '/artist-press'

  return {
    description,
    openGraph: mergeOpenGraph({
      description: description || '',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      title,
      url: canonicalPath,
    }),
    title,
  }
}

function getArtistPressMetaImageUrl(artistPress: ArtistPressLike) {
  const serverUrl = getServerSideURL()
  const media = getArtistPressSeoImageMedia(artistPress)
  const mediaUrl = media?.url

  if (mediaUrl) {
    return absoluteUrl(mediaUrl, serverUrl)
  }

  return undefined
}

function asMedia(value: UploadValue) {
  if (value && typeof value === 'object') {
    return value as Media
  }

  return undefined
}

function absoluteUrl(value: string, serverUrl: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `${serverUrl}${value.startsWith('/') ? value : `/${value}`}`
}
