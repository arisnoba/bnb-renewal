import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getPayload, type Where } from 'payload'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, getCenterLabel, type CenterSlug } from '@/lib/centers'
import type { CastingDirector, Media } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

import { HeroMosaicDim } from '../../_components/HeroMosaicDim'
import { CastingProfileCard, type CastingProfile } from './CastingProfileCard.client'
import './CastingPage.css'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type CastingCompany = {
  directorCompanyNames: string[]
  description: string[]
  headline: string
  id: string
  label: string
  marquee: string
}

const castingCenters: readonly CenterSlug[] = ['art', 'avenue', 'highteen', 'kids']

const commonDescription = [
  '연간 평균 10개 이상의 작품에서 주, 조연 및 주요배역을 모두 캐스팅하고 있습니다.',
  '다양한 장르의 채널들을 섭렵한 탄탄한 캐스팅으로 국내 많은 제작사와 감독들의 신뢰를 받고 있습니다.',
]

const castingCompanies = [
  {
    directorCompanyNames: ['BNB Casting', 'BNN CASTING', 'BNB캐스팅'],
    description: commonDescription,
    headline: '국내 드라마 점유율 상위의 드라마 캐스팅 에이전시로 구성되어 있으며,',
    id: 'bnb-casting',
    label: 'BNB Casting',
    marquee: 'BNB Casting BNB Casting',
  },
  {
    directorCompanyNames: ['CNA Agency', 'CNA', '씨앤에이'],
    description: commonDescription,
    headline: '국내 드라마 점유율 상위의 드라마 캐스팅 에이전시로 구성되어 있으며,',
    id: 'cna-agency',
    label: 'CNA Agency',
    marquee: 'CNA Agency CNA Agency',
  },
  {
    directorCompanyNames: ['ARKO LAB', 'ARKO', '아르코랩', '유캐스팅', 'U CASTING'],
    description: commonDescription,
    headline: '아르코 랩은 국내 드라마 점유율 상위의 드라마 캐스팅 에이전시로 구성되어 있으며,',
    id: 'arko-lab',
    label: 'ARKO LAB',
    marquee: 'ARKO LAB ARKO LAB',
  },
  {
    directorCompanyNames: ['IMGround'],
    description: [
      '다양한 작품에서 주·조연 및 주요배역을 캐스팅하고 있습니다. 모든 캐스팅은 해당 제작사와 계약과 동시에 오디션 및 미팅을 거쳐 직접 캐스팅하는 작품입니다.',
      '주·조연 및 주요배역 캐스팅. 디렉터의 급이 다른 능력을 확인하시기 바랍니다.',
    ],
    headline: '협력사인 IMGround 캐스팅 에이전시는 다년간의 캐스팅 노하우를 바탕으로 설립된 에이전시로',
    id: 'im-ground',
    label: 'IMGround',
    marquee: 'IMGround IMGround',
  },
  {
    directorCompanyNames: ['BX MODEL AGENCY', 'BX Model Agency', 'BX모델에이전시'],
    description: [
      '캐스팅, 매니지먼트, 광고 제작, 광고 언론과 홍보 대행을 One-step으로 해결하는 종합 Agency입니다.',
      '혁신적이고 새로운 가치를 지향하고 있으며 유기적 커뮤니케이션을 통해 광고 업계의 새로운 방향성을 제시하고 있습니다.',
    ],
    headline: '배우앤배움 자회사 BX MODEL AGENCY는 다양한 브랜드들과 협업을 바탕으로',
    id: 'bx-model-agency',
    label: 'BX Model Agency',
    marquee: 'BX Model Agency',
  },
] satisfies CastingCompany[]

const profileOrderByCompany = {
  'arko-lab': ['김건보', '홍진희'],
  'bnb-casting': ['오재동', '양형서', '신주현'],
  'bx-model-agency': ['이덕화', '김하나'],
  'cna-agency': [],
  'im-ground': ['표미희'],
} as const

export function generateStaticParams() {
  return castingCenters.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCastingCenter(assertCenter(slug))

  return {
    description: `${getCenterLabel(center)} 캐스팅 센터 안내`,
    title: '캐스팅 센터',
  }
}

export default async function CastingPage({ params }: Args) {
  const { slug } = await params
  const center = assertCastingCenter(assertCenter(slug))
  const profilesByCompany = await queryCastingDirectorProfiles()
  const companies = getCastingCompanies(center).map((company) => ({
    ...company,
    profiles: getCompanyProfiles(company, profilesByCompany),
  }))
  const decoIcons = getPageDecoIcons(2, `casting-${center}`)

  return (
    <main className="page page-light page-casting" data-center={center}>
      <section
        aria-labelledby="casting-hero-title"
        className="section-casting-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="section-casting-hero__visual absolute inset-0 overflow-hidden"
        >
          <div className="section-casting-hero__media absolute left-1/2 top-1/2 h-[760px] w-[1280px] max-w-none rounded-2xl -translate-x-1/2 -translate-y-1/2 rotate-[-5.5deg] md:h-[1050px] md:w-[1900px] xl:h-[1269px] xl:w-[2406px]">
            <Image
              alt=""
              className="size-full object-cover opacity-65"
              fill
              priority
              sizes="100vw"
              src="/assets/casting/hero-posters.png"
            />
          </div>
        </div>
        <HeroMosaicDim />
        <PageDeco
          className="-left-28 top-[43%] max-md:hidden! md:block"
          icon={decoIcons[0]}
          size="360px"
        />
        <PageDeco
          className="right-[-92px] top-[20%] max-md:hidden! md:block"
          icon={decoIcons[1]}
          size="360px"
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[120px]">
          <h1
            className="section-casting-hero__title page-hero-label"
            id="casting-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">캐스팅 센터</span>
          </h1>
        </div>
      </section>

      <section
        aria-label="캐스팅 센터 회사"
        className="section-casting-companies flex flex-col gap-[120px] overflow-hidden bg-white section-p-block-lg text-neutral-900"
      >
        {companies.map((company) => (
          <CastingCompanySection company={company} center={center} key={company.id} />
        ))}
      </section>
    </main>
  )
}

function CastingCompanySection({
  center,
  company,
}: {
  center: CenterSlug
  company: CastingCompany & { profiles: CastingProfile[] }
}) {
  return (
    <article className="section-casting-company relative overflow-hidden">
      <div className="section-casting-company__marquee pointer-events-none absolute left-0 top-0 max-w-none">
        <div className="section-casting-company__marquee-track flex w-max items-start gap-20">
          <span className="whitespace-nowrap text-[96px] font-extrabold leading-none text-neutral-900/5 sm:text-[140px] md:text-[200px] xl:text-[265px]">
            {company.marquee}
          </span>
          <span
            aria-hidden="true"
            className="whitespace-nowrap text-[96px] font-extrabold leading-none text-neutral-900/5 sm:text-[140px] md:text-[200px] xl:text-[265px]"
          >
            {company.marquee}
          </span>
        </div>
      </div>

      <div className="container relative z-10 pt-0 pb-2 md:pt-25">
        <header className="section-casting-company__header flex flex-col gap-10">
          <p className="section-casting-company__label inline-flex items-center gap-3 type-title-s font-bold leading-[1.4] text-brand">
            {company.label}
          </p>
          <h2 className="section-casting-company__title text-[30px] font-bold leading-[1.35] md:text-[48px]">
            {company.headline}
          </h2>
          <div className="section-casting-company__description flex flex-col gap-1 type-body-m font-medium leading-normal text-neutral-500">
            {company.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </header>

        {company.profiles.length > 0 ? (
          <div className="section-casting-company__profiles mt-18 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {company.profiles.map((profile) => (
              <CastingProfileCard key={`${company.id}-${profile.name}`} profile={profile} />
            ))}
          </div>
        ) : null}

        <Link
          className="section-casting-company__direct mt-12 inline-flex min-h-12 items-center gap-2 bg-neutral-900 px-6 type-label-l font-bold text-white transition hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          href={directCastingHref(center, company.id)}
        >
          DIRECT CASTING
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
        </Link>
      </div>
    </article>
  )
}

function director(
  name: string,
  image: string | undefined,
  careerItems: CastingDirector['careerItems'],
): CastingProfile {
  return {
    careerItems: normalizeCareerItems(careerItems),
    image,
    name,
    role: '디렉터',
  }
}

const queryCastingDirectorProfiles = cache(async () => {
  try {
    const payload = await getPayload({ config: configPromise })
    const where: Where = {
      displayStatus: {
        equals: 'published',
      },
    }
    const result = await payload.find({
      collection: 'casting-directors',
      depth: 1,
      limit: 100,
      pagination: false,
      select: {
        careerItems: true,
        company: true,
        personName: true,
        profileImageMedia: true,
      },
      sort: 'personName',
      where,
    })

    return groupDirectorProfiles(result.docs as CastingDirector[])
  } catch {
    return new Map<string, CastingProfile[]>()
  }
})

function groupDirectorProfiles(directors: CastingDirector[]) {
  const profilesByCompany = new Map<string, CastingProfile[]>()

  for (const item of directors) {
    const companyKey = normalizeCompanyName(item.company)
    const image = mediaUrl(item.profileImageMedia)
    const profiles = profilesByCompany.get(companyKey) ?? []

    profiles.push(director(item.personName, image, item.careerItems))
    profilesByCompany.set(companyKey, profiles)
  }

  return profilesByCompany
}

function normalizeCareerItems(value: CastingDirector['careerItems']) {
  const items =
    value
      ?.map((item) => ({
        content: normalizeText(item.content),
        title: normalizeText(item.title),
      }))
      .filter((item) => item.title || item.content) ?? []

  return items.sort((left, right) => careerSortValue(right.title) - careerSortValue(left.title))
}

function getCompanyProfiles(
  company: CastingCompany,
  profilesByCompany: Map<string, CastingProfile[]>,
) {
  const profiles = company.directorCompanyNames.flatMap(
    (name) => profilesByCompany.get(normalizeCompanyName(name)) ?? [],
  )
  const uniqueProfiles = profiles.filter(
    (profile, index, list) => list.findIndex((item) => item.name === profile.name) === index,
  )
  const preferredOrder = profileOrderByCompany[company.id as keyof typeof profileOrderByCompany] ?? []

  return [...uniqueProfiles].sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left.name as never)
    const rightIndex = preferredOrder.indexOf(right.name as never)

    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    }

    return left.name.localeCompare(right.name, 'ko')
  })
}

function mediaUrl(value: CastingDirector['profileImageMedia']) {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  return normalizeImageUrl((value as Media).url)
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return undefined
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

function normalizeCompanyName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase()
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function careerSortValue(value: string) {
  const year = value.match(/\d{4}/)?.[0]

  return year ? Number(year) : Number.NEGATIVE_INFINITY
}

function getCastingCompanies(center: CenterSlug) {
  if (center === 'art' || center === 'avenue') {
    return castingCompanies.filter((company) => company.id !== 'im-ground')
  }

  return castingCompanies
}

function directCastingHref(center: CenterSlug, companyId: string) {
  const company = companyId === 'im-ground' ? 'imground' : companyId

  return `/${center}/direct-castings?company=${encodeURIComponent(company)}`
}

function assertCastingCenter(center: CenterSlug) {
  if (!castingCenters.includes(center)) {
    notFound()
  }

  return center
}
