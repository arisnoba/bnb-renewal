import type { CenterSlug } from './centers'
import { centers, getCenterLabel } from './centers'
import { centerOrigin } from './centerDomains'
import { centerLocations } from './centerLocations'
import type { Curriculum, News, Teacher } from '@/payload-types'
import { getNewsDescription, getNewsMetaImageUrl } from '@/utilities/newsFallbacks'
import { metadataImageUrlFromMedia } from '@/utilities/metadataImage'

const companyId = 'https://www.baewooenm.com/#organization'
const brandId = 'https://www.baewooenm.com/#brand'
const centerSlugs = Object.keys(centers) as CenterSlug[]

const centerSameAs: Record<CenterSlug, string[]> = {
  art: ['https://www.instagram.com/bnbartcenter/', 'https://blog.naver.com/baewoobaewoo'],
  avenue: ['https://www.instagram.com/bnb_avenuecenter/'],
  exam: ['https://www.instagram.com/bnb_univ/', 'https://blog.naver.com/bnb__univ'],
  highteen: ['https://www.instagram.com/bnb_highteen/', 'https://blog.naver.com/bnb_highteen'],
  kids: ['https://www.instagram.com/bnbkids_agency/', 'https://blog.naver.com/bnb__kids'],
}

export function centerOrganizationId(center: CenterSlug) {
  return `${centerOrigin(center)}/#organization`
}

export function buildSiteStructuredData(center: CenterSlug | null) {
  const websiteOrigin = center ? centerOrigin(center) : 'https://www.baewooenm.com'
  const graph: Record<string, unknown>[] = [
    {
      '@id': companyId,
      '@type': 'Corporation',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KR',
        addressLocality: '서울특별시',
        streetAddress: '서초구 사평대로55길 126, 대솔빌딩 1-5층',
      },
      email: 'info@bnbindustry.com',
      legalName: '주식회사 비앤비인더스트리',
      name: 'BNB INDUSTRY',
      sameAs: [
        'https://ko.wikipedia.org/wiki/%EB%B9%84%EC%95%A4%EB%B9%84%EC%9D%B8%EB%8D%94%EC%8A%A4%ED%8A%B8%EB%A6%AC',
      ],
      telephone: '1577-9929',
      url: 'https://www.baewooenm.com/',
    },
    {
      '@id': brandId,
      '@type': 'EducationalOrganization',
      name: '배우앤배움 EnM',
      parentOrganization: { '@id': companyId },
      sameAs: ['https://www.youtube.com/@BNB_ENM'],
      subOrganization: centerSlugs.map((slug) => ({ '@id': centerOrganizationId(slug) })),
      url: 'https://www.baewooenm.com/',
    },
    {
      '@id': `${websiteOrigin}/#website`,
      '@type': 'WebSite',
      inLanguage: 'ko-KR',
      name: center ? `배우앤배움 ${getCenterLabel(center)}` : '배우앤배움',
      publisher: { '@id': center ? centerOrganizationId(center) : brandId },
      url: `${websiteOrigin}/`,
    },
  ]

  if (center) {
    graph.push(centerOrganization(center))
  } else {
    graph.push(...centerSlugs.map(centerOrganization))
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function buildNewsStructuredData(news: News, center: CenterSlug) {
  const url = `${centerOrigin(center)}/news/${encodeURIComponent(String(news.id))}`
  const image = getNewsMetaImageUrl(news)

  return withBreadcrumbs(
    {
      '@id': `${url}#article`,
      '@type': 'Article',
      articleSection: news.category || undefined,
      author: {
        '@type': 'Person',
        name: '센터 관리자',
        worksFor: { '@id': centerOrganizationId(center) },
      },
      dateModified: news.updatedAt,
      datePublished: news.publishedAt || news.createdAt,
      description: getNewsDescription(news) || undefined,
      headline: news.title,
      image,
      inLanguage: 'ko-KR',
      mainEntityOfPage: url,
      publisher: { '@id': centerOrganizationId(center) },
      url,
    },
    center,
    [
      { name: '뉴스', path: '/news' },
      { name: news.title, path: `/news/${encodeURIComponent(String(news.id))}` },
    ]
  )
}

export function buildTeacherStructuredData(teacher: Teacher, center: CenterSlug) {
  const path = `/teachers/${encodeURIComponent(teacher.slug)}`
  const url = `${centerOrigin(center)}${path}`
  const image = metadataImageUrlFromMedia(teacher.profileImageMedia)

  return withBreadcrumbs(
    {
      '@id': `${url}#person`,
      '@type': 'Person',
      description: teacher.summary || undefined,
      image,
      jobTitle: teacher.role || '교육진',
      name: teacher.name,
      url,
      worksFor: { '@id': centerOrganizationId(center) },
    },
    center,
    [
      { name: '교육진 소개', path: '/teachers' },
      { name: teacher.name, path },
    ]
  )
}

export function buildCourseStructuredData(curriculum: Curriculum, center: CenterSlug) {
  const title = curriculum.title || curriculum.className || '커리큘럼'
  const path = `/curriculum/${encodeURIComponent(String(curriculum.id))}`
  const url = `${centerOrigin(center)}${path}`
  const teacher =
    curriculum.teacher && typeof curriculum.teacher === 'object' ? curriculum.teacher : null
  const teaches = (curriculum.curriculumLessons ?? [])
    .map((lesson) => lesson.topic?.trim())
    .filter((topic): topic is string => Boolean(topic))

  return withBreadcrumbs(
    {
      '@id': `${url}#course`,
      '@type': 'Course',
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'onsite',
        instructor: teacher
          ? {
              '@type': 'Person',
              name: teacher.name,
            }
          : undefined,
        maximumAttendeeCapacity: curriculum.capacity || undefined,
      },
      name: title,
      provider: { '@id': centerOrganizationId(center) },
      teaches: teaches.length > 0 ? teaches : undefined,
      url,
    },
    center,
    [
      { name: '커리큘럼', path: '/curriculum' },
      { name: title, path },
    ]
  )
}

function centerOrganization(center: CenterSlug) {
  const location = centerLocations[center]
  const origin = centerOrigin(center)

  return {
    '@id': centerOrganizationId(center),
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressLocality: '서울특별시',
      streetAddress: location.address.replace(/^서울\s*/, ''),
    },
    description: location.summary,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
    },
    hasMap: `${origin}/map`,
    logo: new URL(location.logoSrc || '/assets/common/logo/logo-art.svg', origin).href,
    name: location.name,
    parentOrganization: { '@id': brandId },
    sameAs: centerSameAs[center],
    telephone: location.phone,
    url: `${origin}/`,
  }
}

function withBreadcrumbs(
  entity: Record<string, unknown>,
  center: CenterSlug,
  items: { name: string; path: string }[]
) {
  const origin = centerOrigin(center)
  const breadcrumbItems = [{ name: `배우앤배움 ${centers[center]}`, path: '/' }, ...items]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      entity,
      {
        '@id': `${entity.url}#breadcrumb`,
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          item: new URL(item.path, origin).href,
          name: item.name,
          position: index + 1,
        })),
      },
    ],
  }
}
