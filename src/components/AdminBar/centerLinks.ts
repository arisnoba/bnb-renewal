import { centers, type CenterSlug } from '@/lib/centers'

export const adminBarCenterLinks = [
  { label: '아트', slug: 'art' },
  { label: '입시', slug: 'exam' },
  { label: '키즈', slug: 'kids' },
  { label: '하이틴', slug: 'highteen' },
  { label: '애비뉴', slug: 'avenue' },
] satisfies Array<{ label: string; slug: CenterSlug }>

const centerSlugs = Object.keys(centers) as CenterSlug[]

const allCenterRouteSections = new Set([
  'about',
  'admission',
  'artist-press',
  'casting-status',
  'casting-system',
  'facilities',
  'faq',
  'how-to-use',
  'map',
  'news',
  'profile-production',
  'profiles',
  'rookies',
  'screen-appearances',
  'starcard',
  'teachers',
])

const routeCenters: Partial<Record<string, readonly CenterSlug[]>> = {
  curriculum: ['art', 'highteen', 'kids'],
  entertainment: ['art', 'avenue', 'highteen', 'kids'],
  'grade-system': ['art', 'highteen', 'kids'],
  'special-lecture': ['highteen'],
}

const detailRouteCenters: Partial<Record<string, readonly CenterSlug[]>> = {
  curriculum: ['art', 'highteen'],
}

export function adminBarCenterHref(pathname: string | null, targetCenter: CenterSlug) {
  const fallbackHref = `/${targetCenter}`

  if (!pathname) {
    return fallbackHref
  }

  const segments = pathname.split('/').filter(Boolean)
  const currentCenter = segments[0]

  if (!isCenterSlug(currentCenter)) {
    return fallbackHref
  }

  const section = segments[1]

  if (!section) {
    return fallbackHref
  }

  const allowedCenters = segments.length > 2
    ? detailRouteCenters[section] ?? routeCenters[section]
    : routeCenters[section]

  if (allowedCenters && !allowedCenters.includes(targetCenter)) {
    return fallbackHref
  }

  if (!allowedCenters && !allCenterRouteSections.has(section)) {
    return fallbackHref
  }

  return `/${[targetCenter, ...segments.slice(1)].join('/')}`
}

function isCenterSlug(value: string | undefined): value is CenterSlug {
  return centerSlugs.includes(value as CenterSlug)
}
