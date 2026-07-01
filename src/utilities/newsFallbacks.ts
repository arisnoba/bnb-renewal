import type { News } from '@/payload-types'

import { asMedia, metadataImageUrlFromMedia } from './metadataImage'

type NewsLike = Partial<News>

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

export function getNewsMetaImageUrl(news: NewsLike) {
  return metadataImageUrlFromMedia(getNewsSeoImageMedia(news))
}

export function getNewsUrl(news: Pick<News, 'id'>, center: string) {
  return `/${encodeURIComponent(center)}/news/${encodeURIComponent(String(news.id))}`
}
