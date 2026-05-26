import type { Metadata } from 'next'

import type { Media, News } from '@/payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

type NewsLike = Partial<News>
type UploadValue = number | null | Media | undefined

export function hasLexicalContent(value: NewsLike['body']) {
  const children = value?.root?.children
  return Array.isArray(children) && children.length > 0
}

export function getNewsDescription(news: NewsLike) {
  return news.meta?.description || news.excerpt
}

export function getNewsThumbnailMedia(news: NewsLike) {
  return asMedia(news.thumbnailMedia)
}

export function getNewsSeoImageMedia(news: NewsLike) {
  return asMedia(news.meta?.image) || asMedia(news.thumbnailMedia)
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
