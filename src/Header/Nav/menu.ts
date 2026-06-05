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
      href: centerHref(center, 'about'),
      items: aboutItems(center),
      key: 'about',
      label: '배우앤배움',
    },
    {
      href: centerHref(center, 'education'),
      items: educationItems(center),
      key: 'education',
      label: '교육',
    },
    {
      href: centerHref(center, 'casting'),
      items: castingItems(center),
      key: 'casting',
      label: center === 'exam' ? '합격현황' : '캐스팅',
    },
    {
      href: centerHref(center, 'management'),
      items: artistItems(center),
      key: 'artist',
      label: center === 'exam' ? '합격자 소개' : '아티스트',
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
      href: '/avenue#about',
      items: [
        { href: '/avenue#about', label: '애비뉴센터 소개' },
        { href: '/avenue#partners', label: '제휴업체' },
        { href: '/avenue#facilities', label: '시설 안내' },
      ],
      key: 'about',
      label: '배우앤배움',
    },
    {
      href: '/avenue#profiles',
      items: [
        { href: '/avenue#profiles', label: '강사진 소개' },
        { href: '/avenue#curriculum', label: '커리큘럼' },
      ],
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
      href: '/consult',
      items: [
        { href: '/consult', label: '온라인 상담신청' },
        { href: '/avenue#location', label: '오시는 길' },
      ],
      key: 'support',
      label: '지원센터',
    },
  ]
}

function aboutItems(center: CenterSlug): HeaderMenuItem[] {
  return [
    { href: '/art#company', label: '회사 소개' },
    ...(center === 'exam' || center === 'highteen' || center === 'kids'
      ? [{ href: centerHref(center, 'greeting'), label: '대표인사말' }]
      : []),
    ...(center === 'art' ? [{ href: centerHref(center, 'about'), label: '아트센터 소개' }] : []),
    ...(center === 'exam'
      ? [
          { href: centerHref(center, 'history'), label: '연혁' },
          { href: centerHref(center, 'subsidiaries'), label: '자회사 안내' },
        ]
      : []),
    { href: centerHref(center, 'facilities'), label: '시설 안내' },
    { href: centerHref(center, 'location'), label: '오시는 길' },
  ]
}

function educationItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'exam') {
    return [
      { href: centerHref(center, 'exam-curriculum'), label: '입시반 커리큘럼' },
      { href: centerHref(center, 'repeat-curriculum'), label: '재입시반 커리큘럼' },
      { href: centerHref(center, 'transfer-curriculum'), label: '편입반 커리큘럼' },
      { href: centerHref(center, 'preparatory-curriculum'), label: '예비 입시반 커리큘럼' },
      { href: centerHref(center, 'arts-high-curriculum'), label: '예고 입시반 커리큘럼' },
      { href: centerHref(center, 'exam-management'), label: '입시 매니지먼트' },
      { href: centerHref(center, 'profiles'), label: '교육진 소개' },
    ]
  }

  if (center === 'kids') {
    return [
      { href: centerHref(center, 'grade-system'), label: '등급제 교육관리시스템' },
      { href: centerHref(center, 'gifted-course'), label: '영재 교육과정' },
      { href: centerHref(center, 'child-actor-course'), label: '아역배우 교육과정' },
      { href: centerHref(center, 'artist-course'), label: '아티스트 교육과정' },
      { href: centerHref(center, 'entertainment'), label: '엔터테인먼트 위탁교육' },
      { href: centerHref(center, 'profiles'), label: '교육진 소개' },
    ]
  }

  return [
    { href: centerHref(center, 'grade-system'), label: '등급제 교육관리시스템' },
    { href: centerHref(center, 'entertainment'), label: '엔터테인먼트 위탁교육' },
    { href: centerHref(center, 'profiles'), label: '교육진 소개' },
    { href: centerHref(center, 'curriculum'), label: '커리큘럼' },
    ...(center === 'highteen'
      ? [{ href: centerHref(center, 'special-lecture'), label: '하이틴센터 특강' }]
      : []),
  ]
}

function castingItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'exam') {
    return [
      { href: centerHref(center, 'university-results'), label: '대학교 합격현황' },
      { href: centerHref(center, 'arts-high-results'), label: '예술고등학교 합격현황' },
    ]
  }

  return [
    { href: centerHref(center, 'screen-appearances'), label: '드라마ㆍ광고 출연장면' },
    { href: centerHref(center, 'casting-status'), label: '진행중인 캐스팅 출연현황' },
    { href: centerHref(center, 'u-casting'), label: '드라마 광고 캐스팅' },
    ...(center === 'kids' || center === 'highteen'
      ? [
          { href: centerHref(center, 'bnb-casting'), label: 'BNB 캐스팅' },
          { href: centerHref(center, 'imground-casting'), label: 'IMGround 캐스팅' },
        ]
      : []),
    ...(center === 'art' || center === 'highteen'
      ? [{ href: centerHref(center, 'bx-model'), label: 'BX모델에이전시' }]
      : []),
    ...(center === 'highteen'
      ? [
          { href: centerHref(center, 'direct-casting'), label: '다이렉트 캐스팅' },
          { href: centerHref(center, 'casting-news'), label: 'BNB 캐스팅 섭외뉴스' },
        ]
      : []),
    ...(center === 'art' || center === 'highteen'
      ? [{ href: '/audition', label: '오디션 지원하기' }]
      : []),
  ]
}

function artistItems(center: CenterSlug): HeaderMenuItem[] {
  if (center === 'exam') {
    return [
      { href: centerHref(center, 'exam-passed-reviews'), label: '수강생 합격후기' },
      { href: centerHref(center, 'exam-passed-videos'), label: '수강생 합격영상' },
      { href: centerHref(center, 'profile-production'), label: '프로필 촬영ㆍ제작' },
    ]
  }

  return [
    { href: centerHref(center, 'management-system'), label: '매니지먼트 시스템' },
    ...(center === 'art' ? [{ href: centerHref(center, 'managers'), label: '매니저 소개' }] : []),
    { href: centerHref(center, 'schedule'), label: '촬영ㆍ오디션 스케줄' },
    ...(center === 'art' || center === 'highteen'
      ? [{ href: centerHref(center, 'rookies'), label: 'BNB 루키' }]
      : []),
    ...(center === 'art' ? [{ href: '/artist-press', label: 'BNB출신 아티스트' }] : []),
    ...(center === 'kids' ? [{ href: centerHref(center, 'profiles'), label: '아역배우 프로필' }] : []),
    ...(center === 'art' ? [{ href: centerHref(center, 'shooting-reviews'), label: '촬영후기' }] : []),
    { href: centerHref(center, 'profile-production'), label: '프로필 촬영ㆍ제작' },
  ]
}

function supportItems(center: CenterSlug): HeaderMenuItem[] {
  return [
    { href: `/${center}/news`, label: 'NEWS&NOTICE' },
    { href: centerHref(center, 'admission'), label: '입학안내' },
    { href: centerHref(center, 'intro-video'), label: '학원 100% 소개영상' },
    { href: centerHref(center, 'how-to-use'), label: '학원100%이용법' },
    { href: centerHref(center, 'starcard'), label: '스타카드 멤버쉽서비스' },
    ...(center === 'exam'
      ? [
          { href: centerHref(center, 'special-system'), label: '특별한 시스템' },
          { href: centerHref(center, 'membership'), label: '멤버십 서비스' },
          { href: centerHref(center, 'scholarship'), label: '장학제도' },
        ]
      : []),
    { href: centerHref(center, 'cs'), label: 'CS센터 운영안내' },
    { href: '/consult', label: '온라인 상담신청' },
    { href: '/test/faq', label: '자주하는 질문' },
  ]
}

function centerHref(center: CenterSlug, anchor: string) {
  return `/${center}#${anchor}`
}
