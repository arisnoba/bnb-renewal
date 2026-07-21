import type { CenterSlug } from './centers'

import { centerFromHostname, centerHostname } from './centerDomains'

type LegacyCenterRoute = {
  center: CenterSlug
  url: URL
}

const legacyCenterByHostname: Record<string, CenterSlug> = {
  'baewoo.co.kr': 'art',
  'www.baewoo.co.kr': 'art',
  'baewoo.kr': 'exam',
  'www.baewoo.kr': 'exam',
  'baewoo.me': 'highteen',
  'www.baewoo.me': 'highteen',
  'baewoo.net': 'kids',
  'www.baewoo.net': 'kids',
  'baewoorun.co.kr': 'avenue',
  'www.baewoorun.co.kr': 'avenue',
}

const contentTargets: Record<string, string> = {
  Scholarship: '/admission#tuition',
  company: '/about',
  cs_call: '/consult',
  curi: '/curriculum',
  curi03: '/curriculum',
  curi04: '/curriculum',
  edu01: '/curriculum',
  edu02: '/curriculum',
  edu03: '/curriculum',
  enter01: '/admission#tuition',
  enter02: '/admission#tuition',
  enter03: '/admission#leave-completion',
  enter04: '/admission#refund',
  enterance: '/admission#procedure',
  entertain: '/entertainment',
  exam_mng: '/management',
  faq: '/faq',
  grade01: '/grade-system#steps',
  grade02: '/grade-system#criteria',
  grade03: '/grade-system#cohorts',
  grade04: '/grade-system',
  greeting: '/company#company-message-title',
  history: '/company#company-history-title',
  identity: '/about',
  location: '/map',
  management: '/casting-system',
  map: '/map',
  new_sys01: '/how-to-use',
  new_sys02: '/special-system#image-making',
  new_sys03: '/special-system#education-support',
  new_sys04: '/special-system#special-admission',
  new_sys06: '/how-to-use',
  new_sys07: '/how-to-use',
  parents: '/company#company-affiliates',
  profile: '/profile-production',
  refund: '/admission#refund',
  sisul: '/facilities',
  starcard: '/starcard',
  systemintro: '/casting-system',
  useguide: '/how-to-use',
}

const boardTargets: Record<string, string> = {
  new_appear: '/casting-status',
  new_audition: '/consult',
  new_calendar: '/schedule',
  new_calendar02: '/schedule',
  new_casting: '/casting',
  new_casting2: '/casting',
  new_casting_bx: '/casting',
  new_casting_enm: '/casting',
  new_casting_img: '/casting',
  new_counsel: '/consult',
  new_direct2: '/direct-castings',
  new_direct_bx: '/direct-castings',
  new_direct_enm: '/direct-castings',
  new_direct_img: '/direct-castings',
  new_drama: '/screen-appearances',
  new_jehu: '/starcard',
  new_notice: '/news',
  new_specialclass: '/special-lecture',
  new_starcard: '/starcard',
  victory10: '/university-results',
  victory30: '/arts-high-results',
}

export function legacyCenterRoute(url: URL): LegacyCenterRoute | null {
  const legacyHostCenter = legacyCenterFromHostname(url.hostname)
  const center = legacyHostCenter ?? centerFromHostname(url.hostname)

  if (!center) {
    return null
  }

  const target = legacyTarget(url, center, Boolean(legacyHostCenter))

  if (!target) {
    return null
  }

  const redirectURL = new URL(target, `https://${centerHostname(center)}`)

  return {
    center,
    url: redirectURL,
  }
}

export function legacyCenterFromHostname(hostname: string): CenterSlug | null {
  const normalizedHostname = hostname.trim().toLowerCase().split(':')[0]

  return legacyCenterByHostname[normalizedHostname] ?? null
}

function legacyTarget(url: URL, center: CenterSlug, allowRoot: boolean) {
  const pathname = normalizeLegacyPathname(url.pathname)

  if (allowRoot && (pathname === '/' || pathname === '/index.php')) {
    return '/'
  }

  if (pathname === '/bbs/content.php') {
    return contentTarget(url.searchParams.get('co_id'), center)
  }

  if (pathname === '/bbs/board.php' || pathname === '/bbs/write.php') {
    return boardTarget(url.searchParams.get('bo_table'), center)
  }

  if (pathname === '/html/teacher_list.php' && url.searchParams.get('mid') === 'teacher') {
    return '/teachers'
  }

  if (pathname === '/html/manage_list.php' && url.searchParams.get('mid') === 'entertain') {
    return '/entertainment'
  }

  if (pathname === '/html/class_curriculum.php') {
    return '/curriculum'
  }

  if (pathname === '/management.php') {
    return center === 'exam' ? '/management' : '/casting-system'
  }

  return null
}

function contentTarget(coId: string | null, center: CenterSlug) {
  if (!coId) {
    return null
  }

  if ((coId === 'systemintro' || coId === 'management') && center === 'exam') {
    return '/management'
  }

  return contentTargets[coId] ?? null
}

function boardTarget(boTable: string | null, center: CenterSlug) {
  if (!boTable) {
    return null
  }

  if (boTable === 'new_hoogi') {
    return center === 'exam' ? '/passed-reviews' : '/screen-appearances'
  }

  if (boTable === 'new_shoot') {
    return center === 'exam' ? '/passed-videos' : '/artist-press'
  }

  if (boTable === 'new_profile') {
    return center === 'exam' ? null : '/rookies'
  }

  return boardTargets[boTable] ?? null
}

function normalizeLegacyPathname(pathname: string) {
  const withoutTrailingSlash = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (withoutTrailingSlash === '/web') {
    return '/'
  }

  return withoutTrailingSlash.startsWith('/web/')
    ? withoutTrailingSlash.slice('/web'.length)
    : withoutTrailingSlash
}
