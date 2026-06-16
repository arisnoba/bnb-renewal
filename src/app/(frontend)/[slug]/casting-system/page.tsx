import type { Metadata } from 'next'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, getCenterLabel, type CenterSlug } from '@/lib/centers'

import { CastingSystemIndex } from './CastingSystemIndex.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type CastingSystemCenter = Extract<CenterSlug, 'art' | 'highteen' | 'kids'>

type CastingSystemItem = {
  description: string[]
  englishTitle: string
  id: string
  image: string
  title: string
}

const castingSystemCenters = ['art', 'highteen', 'kids'] as const satisfies CastingSystemCenter[]

const castingSystemItems = [
  {
    description: [
      '배우앤배움은 대형 촬영스튜디오와 자체 헤어&메이크업실을 보유하고 있습니다. 내부소속 포토그래퍼들로 구성된 BAEWOOHWA STUDIO는 현재 국내 최정상 아티스트들과 협업하고 있습니다. 배우앤배움의 수강연기자들은 현직 최고의 사진작가와 직접 프로필 촬영을 하게 됩니다. 또한, 연예인 전문 헤어, 메이크업, 스타일리스트의 출장 시스템으로 현장에서 직접 헤어&메이크업을 케어받게 됩니다.',
    ],
    englishTitle: 'BNB Profile Studio',
    id: 'profile',
    image: '/assets/casting-system/profile.png',
    title: '프로필제작',
  },
  {
    description: [
      '배우앤배움EnM은 미디어 콘텐츠 계열사 ㈜볼드 인사이트를 통해 수강생들의 영상프로필을 제작하고 있습니다. 영상프로필의 종류는 총 4가지로 필모그래피, 독백, 이미지, 인터뷰 영상 프로필로 이루어져 있으며, 각 배우의 개성에 따라 다양한 형태로 모든 기획과 촬영, 편집을 전문 미디어 인력이 직접 제작하고 있습니다. 모든 촬영은 배우앤배움 내 마련되어있는 자체 대형 스튜디오에서 진행됩니다.',
    ],
    englishTitle: 'BNB Video Production Studio',
    id: 'video',
    image: '/assets/casting-system/video.png',
    title: '개인연기 영상제작',
  },
  {
    description: [
      '배우앤배움은 연간 이루어지는 드라마의 편성과 영화의 제작일정, 그리고 광고의 진행 상황을 매주 업데이트하고 있습니다. 또한, 해당 작품의 시놉시스와 대본을 학원 내 비치하고 있습니다. 이로 인해 수강생들이 오디션을 볼 수 있을 만한 내용이나 역할을 미리 분석해 연기자에게 맞는 작품을 선별해나가는 업무를 진행하고 있습니다.',
    ],
    englishTitle: 'Work Selection',
    id: 'selection',
    image: '/assets/casting-system/selection.png',
    title: '작품선별',
  },
  {
    description: [
      '신인 연기자들의 경우 어떻게 연기자가 자신을 PR하고 영업을 진행해야 하는지 그 경로를 잘 알지 못합니다. 매니지먼트BNB는 자체 캐스팅하는 작품에 수강생들을 출연시키는 것뿐만 아니라, 준비된 연기자가 반드시 PR해야 하는 국내 모든 방송사, 제작사, 영화사, 캐스팅디렉터, 광고에이전시 등에 기존 엔터사들과 동일한 연기자 PR을 수강생들을 대상으로 진행하고 있습니다.',
    ],
    englishTitle: 'Profile Release',
    id: 'pr',
    image: '/assets/casting-system/pr.png',
    title: '연기자 PR',
  },
  {
    description: [
      '배우앤배움 아트센터에는 국내의 모든 드라마&영화&광고 오디션의 정보가 취합·보관되어 있으며, 매월 매니지먼트BNB에서 오디션에 대한 공지와 함께 자세한 내용 안내를 하고 있습니다. 특히 매니지먼트BNB에서 관리를 시작하게 되는 고급 U Class 수강생부터는 연기자와 매니저가 상의하여 적극적으로 오디션 준비를 하게 됩니다. 오디션 명단에 리스트업 된 수강생들은 개인 프로필과 연기 영상을 관리받게 되며 캐스팅 진행 과정에 대한 충분한 피드백을 전달받을 수 있습니다.',
    ],
    englishTitle: 'Audition',
    id: 'audition',
    image: '/assets/casting-system/audition.png',
    title: '오디션',
  },
  {
    description: [
      '작품 감독과의 개별미팅은 오디션의 연장선으로 생각하시면 됩니다. 보통은 역할의 배역 캐스팅이 막바지에 이르거나 감독이 그 배우에 대해 더 체크 할 사항이 있을 시 진행됩니다. 매니지먼트BNB는 최종 감독미팅시 캐스팅팀과 논의하여 해당 작품 감독·작가의 성향이나 배역 캐릭터의 섬세한 부분까지 파악한 후 교육팀에 연계하여 전략적인 부분까지 하나하나 체크하고 교육한 후 미팅준비를 합니다. 특히, 캐스팅팀에서 관리를 시작하는 전문 D Class 수강생부터는 ㈜유캐스팅에서 진행하는 다이렉트캐스팅 시스템에 적용되어 감독미팅 및 오디션에 경쟁력을 높이게 됩니다.',
    ],
    englishTitle: 'Director Meeting',
    id: 'director-meeting',
    image: '/assets/casting-system/director-meeting.png',
    title: '감독미팅',
  },
  {
    description: [
      '매니지먼트BNB는 수강생의 외부 드라마와 영화의 오디션에 학원 카니발밴 차량으로 현장지원을 나가고 있습니다. 또한, 광고에이전시 영상미팅은 매주 정해진 스케줄과 인원을 맞춰 매니저지원 및 차량지원을 하고 있으며, 특히 드라마나 영화에 캐스팅된 연기자들의 촬영에서는 매니저와 차량지원 뿐만 아니라 담당 헤어, 메이크업, 스타일리스트 지원까지 진행하고 있습니다.',
      '* 매니지먼트 인력과 차량 스케줄로 인해 우선시되는 촬영현장에 지원이 먼저 이루어지며, 모든 촬영에 배우앤배움의 재원이 투입되지는 않습니다.',
    ],
    englishTitle: 'Backup Of Cars',
    id: 'car-support',
    image: '/assets/casting-system/car-support.png',
    title: '차량 지원',
  },
  {
    description: [
      '드라마·영화·광고에 캐스팅되어 촬영장에 나가게 되면, 배우가 생각할 부분은 연기 이외에도 많은 부분이 있습니다. 촬영 콜 타임부터 헤어, 메이크업, 의상 등의 기본적인 체크와 함께 예정에 없던 현장상황에 적절하게 대처해야 합니다. 매니지먼트BNB는 촬영현장 경험이 부족한 연기자들을 위해 촬영현장 케어 시스템으로 첫 촬영이나, 특수한 촬영 또는 현장 케어가 필요한 연기자의 스케줄에 매니저가 동행하여 배우가 연기에 집중할 수 있게 돕고, 촬영 분량을 완성도 있게 끝마칠 수 있도록 지원하고 있습니다.',
    ],
    englishTitle: 'Filming Care',
    id: 'filming-care',
    image: '/assets/casting-system/filming-care.png',
    title: '촬영현장 케어',
  },
  {
    description: [
      '매니지먼트BNB는 수강 중인 연기자들의 드라마, 영화 등의 활동 소식을 국내 언론사를 통해 보도자료를 배포하는 형식으로 홍보하고 있습니다. 이는 기존 엔터사들이 소속 배우들에게 진행하는 언론홍보와 동일한 것이며, 보도자료의 배포뿐만 아니라 신문이나 잡지 인터뷰 또한 기자와 연기자의 일정을 맞춰 진행하고 있습니다.',
    ],
    englishTitle: 'Public Relations Management',
    id: 'press',
    image: '/assets/casting-system/press.png',
    title: '언론홍보',
  },
  {
    description: [
      '일정 수준 이상의 출연으로 인해 경력이 생긴 수강생들에 한하여 네이버나 다음 등 국내 대형 포털 사이트에 인물검색등록을 진행하고 있습니다. 작품출연이 진행되고 있는 수강생들은 매니지먼트BNB에 간단한 동의서 작성과 함께 포털사이트 인물검색등록 신청을 하시면, 매니지먼트팀에서 절차에 따라 포털사이트 측에 서류를 접수합니다. 차후 필요한 사항이 충족되면 등록이 완료됩니다.',
    ],
    englishTitle: 'Portal Registration',
    id: 'portal',
    image: '/assets/casting-system/portal.png',
    title: '포털사이트 인물검색등록',
  },
  {
    description: [
      '현재 배우앤배움에 연기교육을 위탁 중인 60여 곳의 중·대형 엔터테인먼트사에서 배우앤배움의 기획사 연계 시스템에 참여하고 있으며, 배우앤배움 아트센터는 배우앤배움과 협력 관계로 있는 모든 중·대형 엔터테인먼트사에 배우앤배움 수강생들을 소개하고 있습니다. 특히 매해 10월에 열리는 배우앤배움 [프리미엄 매니지먼트 오디션]은 이미 많은 매니저들에게 정평이 나 있는 오디션으로 연기자와 엔터사간의 실제적인 매니지먼트 소속계약으로 이어져 오고 있습니다. 또한, 상시적인 엔터테인먼트 개별 오디션을 통해 많은 수강생들이 안정적인 매니지먼트 계약기회를 제공받고, 진행되는 계약사항 역시 사단법인 한국연예매니지먼트협회와 배움앤배움 법무팀의 중재를 통해 안전하게 체결되고 있습니다.',
    ],
    englishTitle: 'Pre-Management Service',
    id: 'agency',
    image: '/assets/casting-system/agency.png',
    title: '기획사 연계',
  },
] satisfies CastingSystemItem[]

const castingSystemCardDecoClasses = [
  'left-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]',
  'right-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]',
  'right-[calc(var(--page-deco-size)/-2)] bottom-[calc(var(--page-deco-size)/-2)]',
] as const

function isCastingSystemCenter(center: CenterSlug): center is CastingSystemCenter {
  return castingSystemCenters.includes(center as CastingSystemCenter)
}

export function generateStaticParams() {
  return castingSystemCenters.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (!isCastingSystemCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return {
    description: `${getCenterLabel(center)} 프로필 제작, 영상 제작, 오디션, 현장 케어까지 이어지는 캐스팅 시스템 안내`,
    title: `캐스팅 시스템 | ${getCenterLabel(center)}`,
  }
}

export default async function CastingSystemPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)
  const decoIcons = getPageDecoIcons(castingSystemItems.length + 2, `casting-system-${center}`)

  if (!isCastingSystemCenter(center)) {
    notFound()
  }

  return (
    <main className="page page-light page-casting-system" data-center={center}>
      <section
        aria-labelledby="casting-system-hero-title"
        className="section-casting-system-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-60"
          fill
          priority
          sizes="100vw"
          src="/assets/casting-system/hero.png"
        />
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[38%] max-md:!hidden md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:!hidden md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-casting-system-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="casting-system-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">시스템</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="casting-system-list-title"
        className="section-casting-system-list section-p-block-base bg-white text-neutral-900"
      >
        <div className="container grid items-start gap-12 lg:grid-cols-3">
          <aside className="section-casting-system-list__aside lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:self-start">
            
            <h2
              className="section-casting-system-list__title type-display-m font-semibold md:type-display-l"
              id="casting-system-list-title"
            >
              수강생의 준비부터<br className="hidden md:block" /> 현장 관리까지
            </h2>

            <CastingSystemIndex
              items={castingSystemItems.map(({ id, title }) => ({ id, title }))}
            />
          </aside>

          <div className="section-casting-system-list__items flex flex-col gap-16 md:gap-20 col-span-1 lg:col-span-2">
            {castingSystemItems.map((item, index) => (
              <article
                className="section-casting-system-card scroll-mt-[var(--page-top-offset)]"
                id={item.id}
                key={item.id}
              >
                <div className="section-casting-system-card__media relative aspect-[552/320]">
                  <PageDeco
                    className={[
                      'z-20 opacity-90',
                      castingSystemCardDecoClasses[index % castingSystemCardDecoClasses.length],
                    ].join(' ')}
                    icon={decoIcons[index + 2]}
                    size="clamp(64px, 6vw, 90px)"
                  />
                  <div className="relative z-10 size-full overflow-hidden bg-neutral-200">
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="size-full object-cover"
                      fill
                      sizes="(max-width: 1023px) calc(100vw - 40px), 552px"
                      src={item.image}
                    />
                  </div>
                </div>
                <div className="section-casting-system-card__body mt-8 flex flex-col gap-5">
                  <header className="section-casting-system-card__head flex flex-col gap-3 sm:flex-row sm:items-end">
                    <span className="section-casting-system-card__number inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1 type-label-m font-extrabold leading-[1.2] text-white">
                      {formatCastingSystemIndex(index)}
                    </span>
                    <div className="section-casting-system-card__title-wrap flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
                      <h3 className="section-casting-system-card__title type-title-l font-bold leading-[1.2] text-neutral-900">
                        {item.title}
                      </h3>
                      <p className="section-casting-system-card__subtitle type-label-m font-medium leading-[1.6] text-neutral-500">
                        {item.englishTitle}
                      </p>
                    </div>
                  </header>
                  <div className="section-casting-system-card__description flex flex-col gap-4 type-body-m leading-relaxed text-neutral-500">
                    {item.description.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {item.id === 'profile' ? (
                    <Link
                      className="section-casting-system-card__link mt-2 inline-flex w-fit items-center gap-2.5 type-label-l font-bold text-neutral-900 transition hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                      href={`/${center}/profile-production`}
                    >
                      프로필 제작 절차 안내
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function formatCastingSystemIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
