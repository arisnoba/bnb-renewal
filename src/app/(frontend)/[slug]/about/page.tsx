import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { centers, type CenterSlug } from '@/lib/centers'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type CenterIntro = {
  slug: CenterSlug
  englishName: string
  title: string
  body: string[]
  maskIcon: ProfileMaskIcon
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

const profileMaskIcons = [
  'iruda-i.svg',
  'iruda-r.svg',
  'iruda-u.svg',
  'iruda-d.svg',
  'iruda-a.svg',
] as const

type ProfileMaskIcon = (typeof profileMaskIcons)[number]

type ProfileMaskStyle = CSSProperties & {
  WebkitMaskImage: string
  WebkitMaskPosition: string
  WebkitMaskRepeat: string
  WebkitMaskSize: string
  maskImage: string
  maskPosition: string
  maskRepeat: string
  maskSize: string
}

const centerIntroductions: CenterIntro[] = [
  {
    slug: 'art',
    englishName: 'Art Center',
    title: 'Baewoo New Branding : 배우를 새로운 시각으로 브랜딩하다',
    body: [
      '배우앤배움 아트센터는 배우를 새로운 시각에서 바라보고 브랜딩하는 매체 연기 교육 기관입니다. 시장에서 요구하는 연기 트렌드와 배우의 개성을 함께 분석해 실전 경쟁력을 키우는 훈련을 설계합니다.',
      '교육, 캐스팅, 배우관리 시스템을 연결해 배우가 자신의 예술을 브랜드화하고 산업과 대중이 원하는 새로운 배우로 자리 잡을 수 있도록 지원합니다.',
    ],
    maskIcon: profileMaskIcons[0],
  },
  {
    slug: 'exam',
    englishName: 'Exam Center',
    title: '너 자신이 곧 작품이라는 철학으로 입시의 방향을 설계합니다',
    body: [
      '배우앤배움 입시센터는 체계적인 커리큘럼과 관리 시스템을 바탕으로 연극영화과 입시에 필요한 방향성을 제시합니다.',
      '학생별 수업 진도와 장점, 보완점을 분석해 하나의 작품을 완성하듯 입시 과정을 관리하고 전문 강사진의 피드백으로 결과를 높입니다.',
    ],
    maskIcon: profileMaskIcons[1],
  },
  {
    slug: 'highteen',
    englishName: 'High-teen Center',
    title: '청소년 배우가 현장으로 나아가기 위한 전문 트레이닝 센터입니다',
    body: [
      '배우앤배움 하이틴센터는 청소년 방송연기 트레이닝에 맞춘 커리큘럼과 이미지 메이킹, 캐스팅 연계를 제공합니다.',
      '하이틴 배우가 드라마, 영화, 광고 촬영 현장에 나갈 수 있도록 교육과 캐스팅, 매니지먼트를 연결한 신인개발 시스템을 운영합니다.',
    ],
    maskIcon: profileMaskIcons[2],
  },
  {
    slug: 'kids',
    englishName: 'Kids Center',
    title: '아이의 감각을 깨우고 스스로 대본에 접근하는 힘을 기릅니다',
    body: [
      '배우앤배움 키즈센터는 아이가 상황을 이해하고 스스로 표현을 찾을 수 있도록 연기 감각과 시선을 깨우는 교육을 진행합니다.',
      '아역 배우에게 필요한 교육과 진로 설계를 각 분야 전문가와 함께 구성하고, 전문 배우 케어 시스템을 통해 현장 경험으로 이어지게 합니다.',
    ],
    maskIcon: profileMaskIcons[3],
  },
  {
    slug: 'avenue',
    englishName: 'Avenue Center',
    title: '배우의 가능성이 더 넓은 무대로 확장되는 성장 거점입니다',
    body: [
      '배우앤배움 애비뉴센터는 배우의 개성과 목표에 맞춰 교육, 콘텐츠, 현장 경험을 연결하는 확장형 트레이닝 환경을 제공합니다.',
      '기초 훈련부터 실전 준비까지 단계적으로 설계해 배우가 자신만의 방향을 발견하고 더 넓은 무대로 나아갈 수 있도록 돕습니다.',
    ],
    maskIcon: profileMaskIcons[4],
  },
]

export function generateStaticParams() {
  return centerSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = centerFromSlug(decodeURIComponent(slug))

  if (!center) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  const title = centers[center]

  return {
    title: `센터소개 | ${title}`,
    description: `배우앤배움 ${title} 센터소개`,
  }
}

function centerFromSlug(slug: string): CenterSlug | null {
  return centerSlugs.includes(slug as CenterSlug) ? (slug as CenterSlug) : null
}

export default async function CenterAboutPage({ params }: Args) {
  const { slug } = await params
  const center = centerFromSlug(decodeURIComponent(slug))

  if (!center) {
    notFound()
  }

  const decoIcons = getPageDecoIcons(4, `center-about-${center}`)

  return (
    <main className="page page-dark page-about" data-center={center}>
      <section
        aria-labelledby="center-about-hero-title"
        className="section-center-about-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.16)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '96px 96px',
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/65" />
        <PageDeco className="-left-24 top-[20%] md:-left-36" icon={decoIcons[0]} />
        <PageDeco className="-right-20 bottom-[-8%] md:-right-28" icon={decoIcons[1]} />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-30">
          <h1
            className="section-center-about-hero__title type-display-xl font-extrabold leading-[1.2]"
            id="center-about-hero-title"
          >
            <span className="block text-brand">배우앤배움</span>
            <span className="block text-white">센터소개</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="center-about-list-title"
        className="section-center-about-list section-p-block-lg relative overflow-hidden"
      >
        <PageDeco className="-left-28 top-[22%] md:-left-36" icon={decoIcons[2]} />
        <PageDeco className="-right-28 bottom-[18%] md:-right-40" icon={decoIcons[3]} />
        <div className="container relative">
          <header className="section-center-about-list__head mb-16 md:mb-[120px]">
            <h2
              className="type-display-l font-extrabold uppercase leading-[1.15] text-white"
              id="center-about-list-title"
            >
              BAEWOO &amp;
              <br />
              BAEWOOM
            </h2>
          </header>

          <div className="section-center-about-list__items divide-y divide-white/15 border-white/15">
            {centerIntroductions.map((item) => (
              <CenterIntroArticle item={item} key={item.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function CenterIntroArticle({ item }: { item: CenterIntro }) {
  return (
    <article
      className="section-center-about-card grid gap-10 py-16 first:pt-0 md:grid-cols-[minmax(0,648px)_minmax(220px,1fr)] md:items-start md:gap-20 md:py-20"
      data-center={item.slug}
    >
      <div className="section-center-about-card__copy flex flex-col items-start gap-8 md:gap-10">
        <div className="space-y-6 text-white">
          <h3 className="type-headline-l font-bold uppercase leading-normal">
            {item.englishName}
          </h3>
          <div className="space-y-6 leading-normal">
            <p className="type-title-s font-bold">{item.title}</p>
            {item.body.map((paragraph) => (
              <p className="type-body-s text-white/60" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/40 px-5 py-3 type-label-l font-semibold leading-none text-white transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          href={`/${item.slug}`}
        >
          {item.englishName}
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
        </Link>
      </div>

      <figure className="section-center-about-card__profile justify-self-start md:justify-self-end">
        <div
          aria-label={`${centers[item.slug]} 더미 프로필 이미지`}
          className="section-center-about-card__profile-mask relative size-[220px] overflow-hidden bg-white/8 md:size-60"
          role="img"
          style={profileMaskStyle(item.maskIcon)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.72),rgba(255,255,255,0.22)_34%,rgba(255,255,255,0.06)_60%,rgba(255,255,255,0)_74%)] grayscale" />
          <div className="absolute left-1/2 top-[19%] size-[30%] -translate-x-1/2 rounded-full bg-white/55" />
          <div className="absolute bottom-[8%] left-1/2 h-[58%] w-[56%] -translate-x-1/2 rounded-t-full bg-white/38" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <figcaption className="mt-4 text-center type-caption-s font-bold uppercase leading-none text-white">
          {item.englishName}
        </figcaption>
      </figure>
    </article>
  )
}

function profileMaskStyle(icon: ProfileMaskIcon): ProfileMaskStyle {
  const image = `url('/assets/icons/grade-system/${icon}')`

  return {
    WebkitMaskImage: image,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskImage: image,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: '100% 100%',
  }
}
