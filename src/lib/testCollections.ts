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
    metaFields: ['center', 'status', 'displayOrder'],
    slug: 'teachers',
    sort: 'displayOrder',
    titleFields: ['name'],
  },
  {
    description: '공지/뉴스 게시글 목록',
    href: '/test/news',
    imageFields: [],
    label: 'News',
    metaFields: ['center', 'category', 'displayStatus', 'publishedAt'],
    slug: 'news',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '프로필 목록과 대표 이미지 경로',
    href: '/test/profiles',
    imageFields: ['profileImagePath'],
    label: 'Profiles',
    metaFields: ['category', 'publishedAt'],
    slug: 'profiles',
    sort: '-publishedAt',
    titleFields: ['name'],
  },
  {
    description: '캐스팅 담당자/게시글 목록',
    href: '/test/castings',
    imageFields: [],
    label: 'Castings',
    metaFields: ['category', 'publishedAt', 'isPublic'],
    slug: 'castings',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '에이전시 및 배우 목록',
    href: '/test/agencies',
    imageFields: ['profileImagePath'],
    label: 'Agencies',
    metaFields: ['name', 'displayOrder'],
    slug: 'agencies',
    sort: 'displayOrder',
    titleFields: ['subject', 'name'],
  },
  {
    description: '영상 캐스팅 목록',
    href: '/test/video-castings',
    imageFields: [],
    label: 'Video Castings',
    metaFields: ['broadcaster', 'youtubeUrl', 'displayOrder'],
    slug: 'video-castings',
    sort: 'displayOrder',
    titleFields: ['title'],
  },
  {
    description: '배너 목록과 링크/노출 위치',
    href: '/test/banners',
    imageFields: ['url'],
    label: 'Banners',
    metaFields: ['position', 'device', 'displayOrder'],
    slug: 'banners',
    sort: 'displayOrder',
    titleFields: ['label', 'altText'],
  },
  {
    description: '강사 첨부파일 목록',
    href: '/test/teacher-files',
    imageFields: ['filePath'],
    label: 'Teacher Files',
    metaFields: ['teacherSourceId', 'displayOrder'],
    slug: 'teacher-files',
    sort: 'displayOrder',
    titleFields: ['title'],
  },
  {
    description: '라인업 게시글 목록',
    href: '/test/lineups',
    imageFields: [],
    label: 'Lineups',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'lineups',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '영화 작업 목록',
    href: '/test/movies',
    imageFields: [],
    label: 'Movies',
    metaFields: ['category', 'castLabel', 'publishedAt'],
    slug: 'movies',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '활동/출연 목록',
    href: '/test/appearances',
    imageFields: [],
    label: 'Appearances',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'appearances',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '추가 활동/출연 목록',
    href: '/test/appearances-extra',
    imageFields: [],
    label: 'Appearances Extra',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'appearances-extra',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '스타카드 게시글 목록',
    href: '/test/star-cards',
    imageFields: [],
    label: 'Star Cards',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'star-cards',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '촬영 게시글 목록',
    href: '/test/shoots',
    imageFields: [],
    label: 'Shoots',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'shoots',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '드라마 게시글 목록',
    href: '/test/dramas',
    imageFields: [],
    label: 'Dramas',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'dramas',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '연출/디렉팅 게시글 목록',
    href: '/test/directings',
    imageFields: [],
    label: 'Directings',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'directings',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
  {
    description: '후기 게시글 목록',
    href: '/test/reviews',
    imageFields: [],
    label: 'Reviews',
    metaFields: ['category', 'publishedAt', 'displayStatus'],
    slug: 'reviews',
    sort: '-publishedAt',
    titleFields: ['title'],
  },
] satisfies TestCollection[]

export function getTestCollection(slug: string) {
  return testCollections.find((collection) => collection.slug === slug)
}
