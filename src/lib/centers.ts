import { notFound } from 'next/navigation'

export const centers = {
  art: '아트센터',
  avenue: '애비뉴센터',
  exam: '입시센터',
  highteen: '하이틴센터',
  kids: '키즈센터',
} as const

export type CenterSlug = keyof typeof centers

export function getCenterLabel(center: string): string {
  return centers[center as CenterSlug] ?? '미분류 센터'
}

export function assertCenter(center: string): CenterSlug {
  if (!(center in centers)) {
    notFound()
  }

  return center as CenterSlug
}
