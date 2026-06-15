import { centers } from '@/lib/centers'
import { mariaDbTestCollections } from '@/lib/mariaDbTest'
import { postgresTestCollections } from '@/lib/postgresTest'
import { testCollections } from '@/lib/testCollections'

export type TestNavigationLink = {
  description: string
  href: string
  label: string
}

export type TestNavigationGroup = {
  description: string
  links: TestNavigationLink[]
  title: string
}

const publicTestPages = [
  {
    description: '최근 마이그레이션된 뉴스 컬렉션 공개 목록',
    href: '/news',
    label: '뉴스',
  },
  {
    description: '출신 아티스트 언론/소개 콘텐츠 공개 목록',
    href: '/art/artist-press',
    label: '출신 아티스트',
  },
  {
    description: '저장 연결 전 상담 신청 MVP 폼',
    href: '/consult',
    label: '상담하기',
  },
  {
    description: 'Payload FAQ 센터별 노출 테스트 화면',
    href: '/test/faq',
    label: 'FAQ 테스트',
  },
]

const centerNewsPages = Object.entries(centers).map(([slug, label]) => ({
  description: `${label} 전용 뉴스 목록`,
  href: `/${slug}/news`,
  label: `${label} 뉴스`,
}))

export const testNavigationGroups = [
  {
    description: '현재 프론트에서 직접 확인할 수 있는 공개 페이지입니다.',
    links: publicTestPages,
    title: '공개 페이지',
  },
  {
    description: '센터 필터가 적용된 뉴스 목록입니다.',
    links: centerNewsPages,
    title: '센터별 뉴스',
  },
  {
    description: 'Payload 컬렉션의 최근 데이터와 이미지 경로를 확인합니다.',
    links: testCollections,
    title: '컬렉션',
  },
  {
    description: '레거시 MariaDB work table 원본 검수 페이지입니다.',
    links: [
      {
        description: `${mariaDbTestCollections.length}개 MariaDB work table 목록`,
        href: '/test/mariadb',
        label: 'MariaDB 전체',
      },
      ...mariaDbTestCollections,
    ],
    title: 'MariaDB',
  },
  {
    description: 'Payload/Postgres 마이그레이션 결과 검수 페이지입니다.',
    links: [
      {
        description: `${postgresTestCollections.length}개 Payload 컬렉션 목록`,
        href: '/test/postgres',
        label: 'Postgres 전체',
      },
      ...postgresTestCollections,
    ],
    title: 'Postgres',
  },
] satisfies TestNavigationGroup[]
