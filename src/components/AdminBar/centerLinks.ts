import { centers, type CenterSlug } from '@/lib/centers'
import { centerOrigin } from '@/lib/centerDomains'

export const adminBarCenterLinks = [
  { label: '아트', slug: 'art' },
  { label: '입시', slug: 'exam' },
  { label: '하이틴', slug: 'highteen' },
  { label: '키즈', slug: 'kids' },
  { label: '애비뉴', slug: 'avenue' },
] satisfies Array<{ label: string; slug: CenterSlug }>

const centerSlugs = Object.keys(centers) as CenterSlug[]

const allCenterRouteSections = new Set([
  'about',
  'admission',
  'artist-press',
  'company',
  'consult',
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
  casting: ['art', 'avenue', 'highteen', 'kids'],
  'casting-status': ['art', 'avenue', 'highteen', 'kids'],
  'casting-system': ['art', 'avenue', 'highteen', 'kids'],
  curriculum: ['art', 'avenue', 'exam', 'highteen', 'kids'],
  'direct-castings': ['art', 'avenue', 'highteen', 'kids'],
  entertainment: ['art', 'avenue', 'highteen', 'kids'],
  'grade-system': ['art', 'avenue', 'highteen', 'kids'],
  management: ['exam'],
  'passed-reviews': ['exam'],
  'passed-videos': ['exam'],
  'special-system': ['exam'],
  'special-lecture': ['highteen'],
}

const detailRouteCenters: Partial<Record<string, readonly CenterSlug[]>> = {
  curriculum: ['art', 'avenue', 'highteen'],
}

export function adminBarCenterHref(pathname: string | null, targetCenter: CenterSlug) {
  const fallbackHref = centerOrigin(targetCenter)

  if (!pathname) {
    return fallbackHref
  }

  const segments = pathname.split('/').filter(Boolean)
  const routeSegments = isCenterSlug(segments[0]) ? segments.slice(1) : segments

  const section = routeSegments[0]

  if (!section) {
    return fallbackHref
  }

  const allowedCenters = routeSegments.length > 1
    ? detailRouteCenters[section] ?? routeCenters[section]
    : routeCenters[section]

  if (allowedCenters && !allowedCenters.includes(targetCenter)) {
    return fallbackHref
  }

  if (!allowedCenters && !allCenterRouteSections.has(section)) {
    return fallbackHref
  }

  return `${centerOrigin(targetCenter)}/${routeSegments.join('/')}`
}

function isCenterSlug(value: string | undefined): value is CenterSlug {
  return centerSlugs.includes(value as CenterSlug)
}
