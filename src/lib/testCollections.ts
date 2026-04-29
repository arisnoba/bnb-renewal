import type { Config } from '@/payload-types'

type InternalCollectionSlug =
  | 'payload-kv'
  | 'payload-locked-documents'
  | 'payload-migrations'
  | 'payload-preferences'
  | 'users'

export type TestCollectionSlug = Exclude<
  keyof Config['collections'],
  InternalCollectionSlug
>

export type TestCollection = {
  description: string
  href: string
  imageFields: string[]
  label: string
  metaFields: string[]
  slug: TestCollectionSlug
  sort: string
  titleFields: string[]
}

export const testCollections = [
  {
    description: '강사 프로필, 센터, 상태, 대표 이미지 경로',
    href: '/test/teachers',
    imageFields: ['profileImagePath', 'photoImage1'],
    label: 'Teachers',
    metaFields: ['centers', 'status', 'displayOrder'],
    slug: 'teachers',
    sort: 'displayOrder',
    titleFields: ['name'],
  },
  {
    description: '공지/뉴스 게시글 목록',
    href: '/test/news',
    imageFields: [],
    label: 'News',
    metaFields: ['centers', 'category', 'displayStatus', 'publishedAt'],
    slug: 'news',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '프로필 목록과 대표 이미지 경로',
    href: '/test/profiles',
    imageFields: ['profileImagePath'],
    label: 'Profiles',
    metaFields: ['centers', 'filter', 'publishedAt'],
    slug: 'profiles',
    sort: '-publishedAt',
    titleFields: ['name'],
  },
  {
    description: '캐스팅 디렉터/매니저 이력 목록',
    href: '/test/casting-directors',
    imageFields: [],
    label: 'Casting Directors',
    metaFields: ['centers', 'company', 'category', 'publishedAt', 'displayStatus'],
    slug: 'casting-directors',
    sort: '-publishedAt',
    titleFields: ['personName', 'company'],
  },
  {
    description: '에이전시 및 배우 목록',
    href: '/test/agencies',
    imageFields: ['profileImagePath'],
    label: 'Agencies',
    metaFields: ['centers', 'name', 'displayOrder'],
    slug: 'agencies',
    sort: 'displayOrder',
    titleFields: ['subject', 'name'],
  },
  {
    description: '출신 아티스트 언론/소개 콘텐츠',
    href: '/test/artist-press',
    imageFields: [],
    label: 'Artist Press',
    metaFields: ['centers', 'actorName', 'generation', 'publishedAt'],
    slug: 'artist-press',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '이달의 오디션 일정 텍스트 정보',
    href: '/test/audition-schedules',
    imageFields: [],
    label: 'Audition Schedules',
    metaFields: ['centers', 'eventType', 'scheduleStartDate', 'publishedAt'],
    slug: 'audition-schedules',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '강사별 커리큘럼 원문',
    href: '/test/curriculums',
    imageFields: [],
    label: 'Curriculums',
    metaFields: ['category', 'teacherName', 'subject'],
    slug: 'curriculums',
    sort: 'category',
    titleFields: ['subject', 'titleRaw'],
  },
  {
    description: '진행중인 캐스팅 출연현황',
    href: '/test/casting-appearances',
    imageFields: [],
    label: 'Casting Appearances',
    metaFields: ['centers', 'castingStatus', 'castingCompany', 'publishedAt'],
    slug: 'casting-appearances',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '드라마/광고 출연장면 통합 목록',
    href: '/test/screen-appearances',
    imageFields: ['profileImagePath', 'thumbnailPath'],
    label: 'Screen Appearances',
    metaFields: ['centers', 'appearanceType', 'performerName', 'publishedAt'],
    slug: 'screen-appearances',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '입시전용 합격후기',
    href: '/test/exam-passed-reviews',
    imageFields: ['school.logoMedia', 'schoolLogoPath', 'studentImagePath'],
    label: 'Exam Passed Reviews',
    metaFields: ['centers', 'school.schoolName', 'schoolName', 'publishedAt'],
    slug: 'exam-passed-reviews',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '입시전용 합격영상',
    href: '/test/exam-passed-videos',
    imageFields: [],
    label: 'Exam Passed Videos',
    metaFields: ['centers', 'youtubeUrl', 'publishedAt'],
    slug: 'exam-passed-videos',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '입시전용 합격결과',
    href: '/test/exam-results',
    imageFields: ['thumbnailPath'],
    label: 'Exam Results',
    metaFields: ['centers', 'resultType', 'publishedAt'],
    slug: 'exam-results',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '합격후기에 쓰이는 학교 로고 리스트',
    href: '/test/exam-school-logos',
    imageFields: ['logoMedia'],
    label: 'Exam School Logos',
    metaFields: ['schoolSlug'],
    slug: 'exam-school-logos',
    sort: 'schoolName',
    titleFields: ['schoolName'],
  },
] satisfies TestCollection[]

export function getTestCollection(slug: string) {
  return testCollections.find((collection) => collection.slug === slug)
}
