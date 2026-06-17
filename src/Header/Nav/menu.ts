import type { CenterSlug } from '@/lib/centers'

import { centers } from '@/lib/centers'

export type HeaderMenuItem = {
  href: string
  label: string
}

export type HeaderMenuGroup = {
  href: string
  items: HeaderMenuItem[]
  key: string
  label: string
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

const defaultCenter: CenterSlug = 'art'

export function headerCenterFromPathname(pathname: string | null | undefined): CenterSlug {
  const firstSegment = pathname?.split('?')[0]?.split('/').filter(Boolean)[0]

  return centerSlugs.includes(firstSegment as CenterSlug) ? (firstSegment as CenterSlug) : defaultCenter
}

export function getHeaderMenu(center: CenterSlug): HeaderMenuGroup[] {
  if (center === 'avenue') {
    return avenueMenu()
  }

  return [
    {
      href: centerAboutHref(center),
      items: aboutItems(center),
      key: 'about',
      label: '배우앤배움',
    },
    {
      href: center === 'exam' ? centerHref(center, 'exam-management') : centerHref(center, 'education'),
      items: educationItems(center),
      key: 'education',
      label: '교육',
    },
    {
      href: center === 'exam' ? centerHref(center, 'university-results') : centerHref(center, 'casting'),
      items: castingItems(center),
      key: 'casting',
      label: center === 'exam' ? '합격현황' : '캐스팅',
    },
    {
      href: center === 'exam' ? centerHref(center, 'exam-passed-reviews') : centerHref(center, 'management'),
      items: artistItems(center),
      key: 'artist',
      label: center === 'exam' ? '합격자소개' : '아티스트',
    },
    {
      href: `/${center}/news`,
      items: supportItems(center),
      key: 'support',
      label: '지원센터',
    },
  ].filter((group) => group.items.length > 0)
}

function avenueMenu(): HeaderMenuGroup[] {
  return [
    {
      href: centerAboutHref('avenue'),
      items: [
        { href: centerAboutHref('avenue'), label: '애비뉴센터 소개' },
        { href: '/avenue#partners', label: '제휴업체' },
        { href: '/avenue#facilities', label: '시설 안내' },
      ],
      key: 'about',
      label: '배우앤배움',
    },
    {
      href: teachersHref('avenue'),
      items: [{ href: teachersHref('avenue'), label: '강사진 소개' }],
      key: 'education',
      label: '교육',
    },
    {
      href: '/avenue#casting',
      items: [
        { href: '/avenue#casting', label: '캐스팅/모집 안내' },
        { href: '/avenue#portfolio', label: '프로필 촬영' },
      ],
      key: 'casting',
      label: '캐스팅',
    },
    {
      href: '/avenue#profiles',
      items: [{ href: '/avenue#profiles', label: '배우 프로필' }],
      key: 'artist',
      label: '아티스트',
    },
    {
      href: '/avenue/news',
      items: supportItems('avenue'),
      key: 'support',
      label: '지원센터',
    },
  ]
}

function aboutItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'art' || center === 'exam' || center === 'highteen' || center === 'kids') {
    return [
      { href: '/art#company', label: '회사 소개' },
      { href: centerAboutHref(center), label: '센터 소개' },
      { href: centerHref(center, 'facilities'), label: '시설 안내' },
      { href: `/${center}/map`, label: '오시는 길' },
    ]
  }

  return [
    { href: '/art#company', label: '회사 소개' },
    { href: centerAboutHref(center), label: '센터 소개' },
    { href: centerHref(center, 'facilities'), label: '시설 안내' },
    { href: `/${center}/map`, label: '오시는 길' },
  ]
}

function educationItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'exam') {
    return [
      { href: centerHref(center, 'exam-management'), label: '입시 매니지먼트' },
      { href: centerHref(center, 'special-system'), label: '특별한 시스템' },
      { href: teachersHref(center), label: '교육진 소개' },
      { href: centerHref(center, 'curriculum'), label: '커리큘럼' },
    ]
  }

  if (center === 'kids') {
    return [
      { href: centerHref(center, 'grade-system'), label: '등급제 교육관리시스템' },
      { href: entertainmentHref(center), label: '엔터테인먼트 위탁교육' },
      { href: curriculumHref(center), label: '커리큘럼' },
      { href: teachersHref(center), label: '교육진 소개' },
    ]
  }

  if (center === 'art') {
    return [
      { href: `/${center}/grade-system`, label: '등급제 교육관리시스템' },
      { href: entertainmentHref(center), label: '엔터테인먼트 위탁교육' },
      { href: teachersHref(center), label: '교육진 소개' },
      { href: curriculumHref(center), label: '커리큘럼' },
    ]
  }

  return [
    {
      href: center === 'highteen' ? `/${center}/grade-system` : centerHref(center, 'grade-system'),
      label: '등급제 교육관리시스템',
    },
    { href: entertainmentHref(center), label: '엔터테인먼트 위탁교육' },
    { href: teachersHref(center), label: '교육진 소개' },
    { href: curriculumHref(center), label: '커리큘럼' },
    ...(center === 'highteen'
      ? [{ href: `/${center}/special-lecture`, label: '하이틴센터 특강' }]
      : []),
  ]
}

function castingItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'exam') {
    return [
      { href: centerHref(center, 'university-results'), label: '대학교' },
      { href: centerHref(center, 'arts-high-results'), label: '예술고등학교' },
    ]
  }

  if (center === 'art') {
    return [
      { href: screenAppearancesHref(center), label: 'BNB 출연장면' },
      { href: castingStatusHref(center), label: '캐스팅 출연현황' },
      { href: centerHref(center, 'casting'), label: '드라마 광고 캐스팅' },
      { href: castingSystemHref(center), label: '캐스팅 시스템' },
      { href: centerHref(center, 'monthly-schedule'), label: '촬영ㆍ오디션 스케줄' },
    ]
  }

  if (center === 'highteen') {
    return [
      { href: screenAppearancesHref(center), label: '드라마ㆍ광고 출연장면' },
      { href: castingStatusHref(center), label: '진행중인 캐스팅 출연현황' },
      { href: centerHref(center, 'casting'), label: '드라마 광고 캐스팅' },
      { href: castingSystemHref(center), label: '캐스팅 시스템' },
      { href: centerHref(center, 'monthly-schedule'), label: '이달의 촬영ㆍ오디션 스케줄' },
    ]
  }

  if (center === 'kids') {
    return [
      { href: screenAppearancesHref(center), label: 'BNB 출연장면' },
      { href: castingStatusHref(center), label: '캐스팅 출연현황' },
      { href: centerHref(center, 'casting'), label: '드라마 광고 캐스팅' },
      { href: castingSystemHref(center), label: '캐스팅 시스템' },
      { href: centerHref(center, 'monthly-schedule'), label: '촬영ㆍ오디션 스케줄' },
    ]
  }

  return []
}

function artistItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'exam') {
    return [
      { href: centerHref(center, 'exam-passed-reviews'), label: '합격 후기' },
      { href: centerHref(center, 'exam-passed-videos'), label: '합격 영상' },
    ]
  }

  if (center === 'art') {
    return [
      { href: `/${center}/artist-press`, label: 'BNB출신 아티스트' },
      { href: `/${center}/rookies`, label: 'BNB 루키' },
    ]
  }

  if (center === 'highteen') {
    return [
      { href: `/${center}/artist-press`, label: 'BNB 출신 아티스트' },
      { href: `/${center}/rookies`, label: 'BNB 루키' },
    ]
  }

  if (center === 'kids') {
    return [
      { href: `/${center}/artist-press`, label: 'BNB 출신 아티스트' },
      { href: `/${center}/rookies`, label: 'BNB 루키' },
    ]
  }

  return []
}

function supportItems(center: CenterSlug): HeaderMenuItem[] {
  const howToUseHref = center === 'art' ? `/${center}/how-to-use` : centerHref(center, 'how-to-use')

  return [
    { href: `/${center}/news`, label: 'NEWS&NOTICE' },
    { href: `/${center}/admission`, label: '입학안내' },
    { href: howToUseHref, label: '학원100%이용법' },
    { href: `/${center}/starcard`, label: '스타카드 멤버쉽서비스' },
    { href: `/${center}/faq`, label: '자주하는 질문' },
  ]
}

function centerHref(center: CenterSlug, anchor: string) {
  return `/${center}#${anchor}`
}

function entertainmentHref(center: CenterSlug) {
  return `/${center}/entertainment`
}

function centerAboutHref(center: CenterSlug) {
  return `/${center}/about`
}

function curriculumHref(center: CenterSlug) {
  return `/${center}/curriculum`
}

function screenAppearancesHref(center: CenterSlug) {
  return `/${center}/screen-appearances`
}

function castingStatusHref(center: CenterSlug) {
  return `/${center}/casting-status`
}

function castingSystemHref(center: CenterSlug) {
  return `/${center}/casting-system`
}

function teachersHref(center: CenterSlug) {
  return `/${center}/teachers`
}
