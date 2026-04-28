import type { Metadata } from 'next'

import type { Media, News } from '@/payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

type Attachment = {
  fileName?: string
  localPath?: string
  path?: string
}

type NewsLike = Partial<News>
type UploadValue = number | null | Media | undefined

export function hasLexicalContent(value: NewsLike['body']) {
  const children = value?.root?.children
  return Array.isArray(children) && children.length > 0
}

export function getNewsDescription(news: NewsLike) {
  return news.meta?.description || news.excerpt || excerptFromHtml(news.bodyHtml)
}

export function getNewsThumbnailMedia(news: NewsLike) {
  return asMedia(news.thumbnailMedia)
}

export function getNewsSeoImageMedia(news: NewsLike) {
  return asMedia(news.meta?.image) || asMedia(news.thumbnailMedia)
}

export function getNewsLegacyThumbnailSrc(news: NewsLike) {
  const thumbnailPath = normalizeLegacyPath(news.thumbnailPath)

  if (!thumbnailPath) {
    return undefined
  }

  const attachments = readAttachments(news.legacyMeta)
  const byPath = attachments.find((attachment) => normalizeLegacyPath(attachment.path) === thumbnailPath)
  const byFilename = attachments.find((attachment) => {
    const attachmentFileName =
      text(attachment.fileName) || pathBasename(normalizeLegacyPath(attachment.path) ?? '')

    return attachmentFileName === pathBasename(thumbnailPath)
  })
  const localPath = normalizePublicPath((byPath ?? byFilename)?.localPath)

  if (localPath) {
    return localPath
  }

  if (news.thumbnailPath?.startsWith('http://') || news.thumbnailPath?.startsWith('https://')) {
    return news.thumbnailPath
  }

  return legacyHostForNews(news) + thumbnailPath
}

export function getNewsImageAlt(news: NewsLike) {
  const media = getNewsThumbnailMedia(news)
  return media?.alt || news.title || ''
}

export function getNewsUrl(news: Pick<News, 'slug'>) {
  return `/news/${encodeURIComponent(news.slug)}`
}

export function generateNewsMeta(news: NewsLike | null): Metadata {
  const title = news?.meta?.title || news?.title || '뉴스'
  const description = news ? getNewsDescription(news) : undefined
  const imageUrl = news ? getNewsMetaImageUrl(news) : undefined
  const canonicalPath = news?.slug ? getNewsUrl({ slug: news.slug }) : '/news'

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

function getNewsMetaImageUrl(news: NewsLike) {
  const serverUrl = getServerSideURL()
  const media = getNewsSeoImageMedia(news)
  const mediaUrl = media?.sizes?.og?.url || media?.url

  if (mediaUrl) {
    return absoluteUrl(mediaUrl, serverUrl)
  }

  const legacyUrl = getNewsLegacyThumbnailSrc(news)

  return legacyUrl ? absoluteUrl(legacyUrl, serverUrl) : undefined
}

function asMedia(value: UploadValue) {
  if (value && typeof value === 'object') {
    return value as Media
  }

  return undefined
}

function readAttachments(value: unknown): Attachment[] {
  const meta = toRecord(value)
  const attachments = meta?.attachments

  if (Array.isArray(attachments)) {
    return attachments.filter(isRecord).map(attachmentFromRecord)
  }

  if (typeof attachments === 'string') {
    try {
      const parsed = JSON.parse(attachments) as unknown

      if (Array.isArray(parsed)) {
        return parsed.filter(isRecord).map(attachmentFromRecord)
      }
    } catch {
      return []
    }
  }

  return []
}

function attachmentFromRecord(value: Record<string, unknown>): Attachment {
  return {
    fileName: text(value.fileName),
    localPath: text(value.localPath),
    path: text(value.path),
  }
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

function normalizePublicPath(value: string | undefined | null) {
  const textValue = text(value)

  if (!textValue) {
    return undefined
  }

  if (textValue.startsWith('/')) {
    return textValue
  }

  if (textValue.startsWith('public/')) {
    return textValue.slice('public'.length)
  }

  return `/${textValue}`
}

function legacyHostForNews(news: NewsLike) {
  const meta = toRecord(news.legacyMeta)
  const sourceDb = text(news.sourceDb) || text(meta?.sourceDb)

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
