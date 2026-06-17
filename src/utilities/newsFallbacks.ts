import type { Media, News } from '@/payload-types'

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

export function getNewsUrl(news: Pick<News, 'slug'>, center: string) {
  return `/${encodeURIComponent(center)}/news/${encodeURIComponent(news.slug)}`
}

function asMedia(value: UploadValue) {
  if (value && typeof value === 'object') {
    return value as Media
  }

  return undefined
}
