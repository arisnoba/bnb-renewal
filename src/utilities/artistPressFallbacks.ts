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
    excerptFromHtml(artistPress.bodyHtml) ||
    [artistPress.actorName, artistPress.generation].filter(Boolean).join(' ')
  )
}

export function getArtistPressThumbnailMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.thumbnailMedia)
}

export function getArtistPressSeoImageMedia(artistPress: ArtistPressLike) {
  return asMedia(artistPress.meta?.image) || asMedia(artistPress.thumbnailMedia)
}

export function getArtistPressLegacyThumbnailSrc(artistPress: ArtistPressLike) {
  const thumbnailPath = normalizeLegacyPath(artistPress.thumbnailPath)

  if (!thumbnailPath) {
    return undefined
  }

  const localPath = buildLocalLegacyPath(artistPress, thumbnailPath)

  if (localPath) {
    return localPath
  }

  if (artistPress.thumbnailPath?.startsWith('http://') || artistPress.thumbnailPath?.startsWith('https://')) {
    return artistPress.thumbnailPath
  }

  return legacyHostForArtistPress(artistPress) + thumbnailPath
}

export function getArtistPressImageAlt(artistPress: ArtistPressLike) {
  const media = getArtistPressThumbnailMedia(artistPress)
  return media?.alt || artistPress.title || artistPress.actorName || ''
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
  const mediaUrl = media?.sizes?.og?.url || media?.url

  if (mediaUrl) {
    return absoluteUrl(mediaUrl, serverUrl)
  }

  const legacyUrl = getArtistPressLegacyThumbnailSrc(artistPress)

  return legacyUrl ? absoluteUrl(legacyUrl, serverUrl) : undefined
}

function asMedia(value: UploadValue) {
  if (value && typeof value === 'object') {
    return value as Media
  }

  return undefined
}

function buildLocalLegacyPath(artistPress: ArtistPressLike, legacyPath: string) {
  const sourceId = text(artistPress.sourceId) || text(toRecord(artistPress.legacyMeta)?.sourceId)

  if (!sourceId) {
    return undefined
  }

  const sourceDb = text(artistPress.sourceDb) || text(toRecord(artistPress.legacyMeta)?.sourceDb) || 'baewoo'
  const pathParts = legacyPath.split('/').filter(Boolean)
  const boTable = pathParts.at(-2) || 'new_shoot'
  const fileName = pathBasename(legacyPath)

  if (!fileName) {
    return undefined
  }

  return `/legacy/artist-press/${sourceDb}/${boTable}/${sourceId}/thumbnail/${fileName}`
}

function excerptFromHtml(value: unknown) {
  const textValue = String(value ?? '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  return textValue ? textValue.slice(0, 160) : undefined
}

function normalizeLegacyPath(value: string | undefined | null) {
  const textValue = text(value)

  if (!textValue) {
    return undefined
  }

  try {
    return new URL(textValue).pathname
  } catch {
    return textValue.startsWith('/') ? textValue : `/${textValue}`
  }
}

function legacyHostForArtistPress(artistPress: ArtistPressLike) {
  const meta = toRecord(artistPress.legacyMeta)
  const sourceDb = text(artistPress.sourceDb) || text(meta?.sourceDb)

  if (sourceDb === 'bnbhighteen') return 'https://www.baewoo.me'
  if (sourceDb === 'kidscenter') return 'https://www.baewoo.net'
  if (sourceDb === 'bnbuniv') return 'https://www.baewoo.kr'

  return 'https://www.baewoo.co.kr'
}

function absoluteUrl(value: string, serverUrl: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `${serverUrl}${value.startsWith('/') ? value : `/${value}`}`
}

function pathBasename(value: string) {
  return value.split('/').filter(Boolean).at(-1)
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (isRecord(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return isRecord(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }

  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}
