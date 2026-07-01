import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { ChevronRight, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import React, { cache } from 'react'

import { getEducationHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { Media } from '@/components/Media/Renderer'
import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { assertCenter, centers, type CenterSlug } from '@/lib/centers'
import type { Agency } from '@/payload-types'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type EntertainmentCenter = CenterSlug

const TRUST_EDUCATION_STARTED_YEAR = 2010

const entertainmentMetadata = {
  art: {
    description: '배우앤배움 아트센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육',
  },
  avenue: {
    description: '배우앤배움 애비뉴센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육',
  },
  exam: {
    description: '배우앤배움 입시센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육',
  },
  highteen: {
    description: '배우앤배움 하이틴센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육',
  },
  kids: {
    description: '배우앤배움 키즈센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육',
  },
} satisfies Record<EntertainmentCenter, Metadata>

export function generateStaticParams() {
  return Object.keys(entertainmentMetadata).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  return entertainmentMetadata[center]
}

export default async function EntertainmentEducationPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  const agencies = await queryAgencies(center)

  return (
    <main className="page page-dark page-entertainment" data-center={center}>
      <EntertainmentHero center={center} />
      <EntertainmentEducationSection agencies={agencies} center={center} />
    </main>
  )
}

function EntertainmentHero({ center }: { center: EntertainmentCenter }) {
  const decoIcons = getPageDecoIcons(2, `entertainment-${center}`)

  return (
    <section className="section-entertainment-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]">
      <PageHeroImage image={getEducationHeroImage(center)} className="opacity-55 grayscale" />
      <div aria-hidden="true" className="absolute inset-0 bg-black/55" />
      <PageDeco
        className="-left-20 top-[22%] md:-left-28"
        icon={decoIcons[0]}
      />
      <PageDeco
        className="-right-12 bottom-[10%] md:-right-20"
        icon={decoIcons[1]}
      />
      <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
        <div className="page-hero-label">
          <span className="block text-brand">교육</span>
          <span className="block">엔터테인먼트</span>
          <span className="block">위탁교육</span>
        </div>
      </div>
    </section>
  )
}

function EntertainmentEducationSection({
  agencies,
  center,
}: {
  agencies: Agency[]
  center: EntertainmentCenter
}) {
  const centerName = `배우앤배움 ${centers[center]}`
  const actorTotal = agencies.reduce((total, agency) => total + actorCount(agency), 0)
  const summaryMetrics = getEntertainmentSummaryMetrics(agencies.length, actorTotal)

  return (
    <section
      aria-labelledby="entertainment-title"
      className="section-entertainment section-p-t-base text-white"
    >
      <div className="container">
        <div className="section-entertainment__header">
          <PageIntro
            className="page-heading--dark"
            description={(
              <>
            <p>
              {centerName}는 국내 56여 곳 엔터테인먼트의 연기교육 파트너사로서 2010년
              개원부터 지금까지 해당 기획사의 소속 배우들을 위탁받아 교육하고 있습니다.
            </p>
            <p>
              교육했던 연기자들의 수많은 오디션과 작품 경험을 통해 수강생들에게 경험적,
              질적 우수성을 제공하고 있습니다.
            </p>
              </>
            )}
            eyebrow="엔터테인먼트 파트너"
            id="entertainment-title"
            title={'IRUDA 위탁교육 시스템입니다.\n현장 경험으로 배우의 성장을 만듭니다.'}
          />
        </div>

        {agencies.length > 0 ? (
          <div className="section-entertainment__summary grid gap-y-8 sm:grid-cols-3 sm:gap-y-0 section-p-block-sm">
            {summaryMetrics.map((metric) => (
              <div
                className="section-entertainment__summary-item border-t border-white/15 pt-6 first:border-t-0 first:pt-0 sm:border-l sm:border-white/25 sm:border-t-0 sm:pl-6 sm:pt-0"
                key={metric.label}
              >
                <p className="type-title-s font-semibold leading-[1.35] text-white/60">
                  {metric.label}
                </p>
                <p className="mt-5 type-display-l font-bold leading-none text-white">
                  <AnimatedCounter value={metric.value} />
                  {metric.unit}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="container-fluid px-0!">
        <AgencyLogoGrid agencies={agencies} />
      </div>

      <div className="container">
        {center !== 'highteen' && center !== 'exam' ? (
          <TrustActorEducationSystem center={center} centerName={centerName} />
        ) : null}
      </div>
    </section>
  )
}

function AgencyLogoGrid({ agencies }: { agencies: Agency[] }) {
  if (agencies.length === 0) {
    return (
      <p className="section-entertainment__empty mt-16 bg-white/3 px-6 py-10 text-center type-body-m text-white/50">
        등록된 엔터테인먼트 파트너사가 없습니다.
      </p>
    )
  }

  return (
    <div className="section-entertainment__partners grid grid-cols-4 overflow-hidden sm:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
      {agencies.map((agency) => (
        <AgencyLogoCard agency={agency} key={agency.id} />
      ))}
    </div>
  )
}

function AgencyLogoCard({ agency }: { agency: Agency }) {
  const count = actorCount(agency)
  const logo = agency.logoMedia && typeof agency.logoMedia === 'object' ? agency.logoMedia : null

  return (
    <article
      aria-label={`${agency.subject} 위탁중인 배우 ${count}명`}
      className="group section-entertainment-partner relative grid aspect-10/8 place-items-center bg-[#F2F2F2] px-5"
      tabIndex={0}
    >
      {logo ? (
        <Media
          alt={agency.subject}
          fill
          htmlElement={null}
          imgClassName="object-contain"
          placeholder="empty"
          pictureClassName="relative block h-[64%] w-[88%] transition-opacity duration-200 group-hover:opacity-10 group-focus-visible:opacity-10"
          resource={logo}
          fadeIn={true}
        />
      ) : (
        <span className="type-title-s font-bold text-neutral-900 transition-opacity duration-200 group-hover:opacity-10 group-focus-visible:opacity-10">
          {agency.name || agency.subject}
        </span>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center bg-bg-footer/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <div className="text-center">
          <p className="type-caption-s font-medium text-white/60">위탁중인 배우</p>
          <p className="mt-1 type-headline-m font-extrabold leading-none text-white">{count}명</p>
        </div>
      </div>
    </article>
  )
}

function TrustActorEducationSystem({
  center,
  centerName,
}: {
  center: EntertainmentCenter
  centerName: string
}) {
  return (
    <section
      aria-labelledby="trust-actor-system-title"
      className="section-trust-actor-system section-p-block-base text-white"
    >
      <PageIntro
        as="h2"
        className="section-trust-actor-system__header page-heading--dark"
        description={(
          <>
            <p>
              {centerName}의 위탁 교육연기자는 ‘활동준비 대상자’와 ‘현장투입 대상자’로
              분류되어 관리되고 있습니다.
            </p>
            <p>
              활동준비자의 경우 교육팀에서 관리하며, 현장투입자의 경우 교육팀과 캐스팅팀이
              함께 연기자를 관리하고 있습니다.
            </p>
          </>
        )}
        eyebrow="위탁연기자 교육시스템"
        id="trust-actor-system-title"
        title={'배우의 성장은 체계적인\n관리에서 시작됩니다.'}
      />

      <div className="section-trust-actor-system__list mt-[60px] flex flex-col">
        {educationSystemCards(center, centerName).map((card) => (
          <EducationSystemCard card={card} key={card.id} />
        ))}
        <NoticeCard />
      </div>
    </section>
  )
}

type EducationSystemCardData = {
  body: string
  cta?: {
    href: string
    label: string
  }
  id: string
  note?: string
  steps?: EducationSystemStep[]
  title: string
}

type EducationSystemStep = string | {
  label: string
  level: string
}

function educationSystemCards(
  center: EntertainmentCenter,
  centerName: string,
): EducationSystemCardData[] {
  if (center === 'kids') {
    return [
      {
        body:
          '위탁연기자의 경력, 영상자료 체크 및 대본리딩 테스트를 통해 Class가 나누어집니다. 자세한 내용은 홈페이지 교육폴더 중 등급제 교육관리시스템에 들어가시면 확인하실 수 있습니다.',
        cta: { href: `/${center}/grade-system`, label: '등급제 교육관리시스템' },
        id: '01',
        steps: [
          { label: '영재교육 Class', level: '초급' },
          { label: '아역배우 Class', level: '중급' },
          { label: '아티스트 Class', level: '고급' },
        ],
        title: '레벨 테스트',
      },
      {
        body: '배우앤배움 위탁생의 교육관리는 총 네 가지로 나누어집니다.',
        id: '02',
        note: '※ 전체적인 교육은 일반 수강생과 동일하게 진행됩니다.',
        steps: [
          '커리큘럼 관리를 통해 위탁생의 전체적인 교육 흐름을 점검합니다.',
          '개인 독백관리를 통해 차후 오디션이나 미팅에서 보여줄 연기를 준비합니다.',
          '부족한 부분을 집중 보완하여 수정 보완합니다.',
          '출결사항 및 수업내용 강사 피드백을 소속사에 전달합니다.',
        ],
        title: '교육 관리',
      },
      {
        body:
          `소속사는 위탁연기자의 외부 오디션을 진행하는 경우, ${centerName} 교육팀으로 작품의 시놉시스나 대본, 혹은 오디션 대본을 보내주시면 됩니다. 배우앤배움의 오디션전문 1:1 강사진은 현재 미팅이 진행되고 있는 전체 드라마, 영화의 흐름을 파악하고 있으며, 해당 오디션에서 연기자들이 경쟁력을 갖출 수 있도록 감독 및 작가의 성향이나 전작에 대한 정보를 분석해 이에 맞춘 오디션 전략교육이 이루어집니다. 특히 최종 오디션에 가까워지면 연기자, 소속사 매니저, 전문강사, 배우앤배움 원장이 회의를 통해 작품에서 바라는 캐릭터 등의 정보를 취합하여 완성도 있는 오디션을 볼 수 있도록 준비합니다.`,
        id: '03',
        note: '※ 일반 수강생의 경우에도 외부 오디션 시 동일하게 진행됩니다.',
        title: '오디션 준비',
      },
      {
        body:
          '배우가 성장하는 과정을 보여드리기 위한 연기 영상자료를 제공해 드립니다. 특히 미디어 콘텐츠 계열사 ㈜비앤비 미디어를 통해 수준 있는 영상퀄리티로 연기자의 여러 가지 모습들을 담아낼 수 있습니다. 배우앤배움은 다양한 각도에서 엔터사 및 연기자를 보조하는 역할을 수행합니다.',
        cta: { href: `/${center}/profile-production`, label: '영상제작 서비스' },
        id: '04',
        title: '영상제작지원',
      },
    ]
  }

  return [
    {
      body:
        '위탁연기자의 전공, 경력 및 대본리딩 테스트를 통해 I/R/U/D/A Class가 나누어집니다. 자세한 내용은 홈페이지 교육폴더 중 등급제 교육관리시스템에 들어가시면 확인하실 수 있습니다.',
      cta: { href: `/${center}/grade-system`, label: '등급제 교육관리시스템' },
      id: '01',
      steps: ['I', 'R', 'U', 'D', 'A'],
      title: '레벨 테스트',
    },
    {
      body: '배우앤배움 위탁생의 교육관리는 총 네 가지로 나누어집니다.',
      id: '02',
      note: '※ 전체적인 교육은 일반 수강생과 동일하게 진행됩니다.',
      steps: [
        '커리큘럼 관리를 통해 위탁생의 전체적인 교육 흐름을 점검합니다.',
        '개인 독백관리를 통해 차후 오디션이나 미팅에서 보여줄 연기를 준비합니다.',
        '운동관리를 통해 건강한 신체관리를 돕습니다.',
        '출결사항 및 수업내용 강사 피드백을 소속사에 전달합니다.',
      ],
      title: '교육 관리',
    },
    {
      body:
        `소속사는 위탁연기자의 외부 오디션을 진행하는 경우, ${centerName} 교육팀으로 해당 작품의 시놉시스나 대본, 혹은 오디션 대본을 보내주시면 됩니다. 배우앤배움의 오디션전문 1:1 강사진은 현재 미팅이 진행되고 있는 전체 드라마, 영화의 흐름을 파악하고 있으며, 해당 오디션에서 연기자들이 경쟁력을 갖출 수 있도록 감독 및 작가의 성향이나 전작에 대한 정보를 분석해 이에 맞춘 오디션 전략교육이 이루어집니다. 특히 최종 오디션에 가까워지면 연기자, 소속사 매니저, 전문강사, 배우앤배움 원장이 회의를 통해 작품에서 바라는 캐릭터 등의 정보를 취합하여 완성도 있는 오디션을 볼 수 있도록 준비합니다.`,
      id: '03',
      note: '※ 일반 수강생의 경우에도 외부 오디션 시 동일하게 진행됩니다.',
      title: '오디션 준비',
    },
    {
      body:
        '배역 확정 시 1:1 작품코치진이 투입됩니다. 연출진의 작품의도와 원하는 전체 캐릭터 등 기본적인 내용을 파악한 후 코치진은 배우와 함께 개인 캐릭터 분석을 시작으로 대본리딩을 시작하게 됩니다. 작품의 전체 흐름 속에서 각 장면의 의도와 상황을 분석해 배우가 돋보이면서도 장면의 몰입도를 높일 수 있는 연기를 준비합니다. 배우앤배움 작품코치진은 첫번째 작품 연출진의 의도, 두번째 배우가 원하는 캐릭터, 세번째 소속사에서 원하는 부분들을 수렴해 배우의 전체적인 컨셉이나 연기의 톤을 결정하며, 작품이 끝날 때까지 배우는 모든 연기 부분에 있어 체계적인 시스템으로 관리됩니다.',
      id: '04',
      note: '※ 소속사가 없는 배우의 경우에도 코치진과 작품 준비를 하게 됩니다.',
      title: '작품 준비',
    },
    {
      body:
        '배우가 성장하는 과정을 보여드리기 위한 연기 영상자료를 제공해 드립니다. 특히 미디어 콘텐츠 계열사 ㈜비앤비 콘텐츠를 통해 수준 있는 영상퀄리티로 연기자의 여러 가지 모습들을 담아낼 수 있습니다. 배우앤배움은 다양한 각도에서 엔터사 및 연기자를 보조하는 역할을 수행합니다.',
      cta: { href: `/${center}/profile-production`, label: '영상제작 서비스' },
      id: '05',
      title: '영상제작지원',
    },
  ]
}

function EducationSystemCard({ card }: { card: EducationSystemCardData }) {
  const hasDetailSteps =
    card.steps?.some((step) => typeof step === 'string' && step.length > 1) ?? false

  return (
    <article className="section-trust-actor-system-card border-b border-white/15 py-12 md:py-14">
      <div className="flex flex-col gap-7 md:flex-row md:gap-1">
        <div className="section-trust-actor-system-card__label flex shrink-0 flex-col gap-1 md:w-[200px]">
          <p className="type-headline-s font-bold leading-[1.2] text-brand">{card.id}</p>
          <h3 className="type-title-s font-bold leading-normal text-white">{card.title}</h3>
        </div>
        <div className="section-trust-actor-system-card__body flex min-w-0 flex-1 flex-col gap-7 md:px-6">
          <div className="flex flex-col gap-4">
            <p
              className={
                hasDetailSteps
                  ? 'type-title-s font-bold leading-normal text-white'
                  : 'type-body-m leading-relaxed text-white/60'
              }
            >
              {card.body}
            </p>
            {card.steps ? <EducationSystemSteps steps={card.steps} /> : null}
          </div>
          {card.note ? (
            <p className="type-body-s leading-normal text-white/60">{card.note}</p>
          ) : null}
          {card.cta ? (
            <Link
              className="inline-flex w-fit items-center rounded-full border border-white/40 px-5 py-3 type-label-l font-semibold leading-[1.2] text-white transition-colors hover:border-brand hover:text-brand"
              href={card.cta.href}
            >
              {card.cta.label}
              <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function EducationSystemSteps({ steps }: { steps: EducationSystemStep[] }) {
  const levelSteps = steps.every((step) => typeof step !== 'string' || step.length === 1)

  if (levelSteps) {
    return (
      <div className="flex w-full items-stretch gap-1">
        {steps.map((step, index) => (
          <React.Fragment key={typeof step === 'string' ? step : step.label}>
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-white/20 p-4 text-center text-white sm:gap-2 md:p-7">
              {typeof step === 'string' ? (
                <>
                  <span className="block type-headline-s font-black uppercase leading-none">{step}</span>
                  <span className="block type-caption-s font-medium leading-none text-white/60">
                    class
                  </span>
                </>
              ) : (
                <>
                  <span className="block type-label-l font-extrabold leading-none text-brand">
                    {step.level}
                  </span>
                  <span className="mt-2 block type-title-s font-extrabold leading-tight">
                    {step.label.replace(' Class', '\nClass')}
                  </span>
                </>
              )}
            </div>
            {index < steps.length - 1 ? (
              <div className="grid shrink-0 place-items-center self-stretch text-white/30">
                <ChevronRight aria-hidden="true" className="size-3 sm:size-4" strokeWidth={1.8} />
              </div>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-white/60">
      {steps.map((step) => (
        <li className="pl-2 type-body-s leading-normal text-white/60" key={String(step)}>
          {typeof step === 'string' ? step : step.label}
        </li>
      ))}
    </ol>
  )
}

function NoticeCard() {
  return (
    <article className="section-trust-actor-system-card section-trust-actor-system-card--notice flex items-center gap-3 pt-7 text-white/60">
      <Megaphone aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
      <p className="type-body-s leading-normal">
        엔터테인먼트 위탁 교육에 관련한 일체의 할인 및 협찬은 불가합니다.
      </p>
    </article>
  )
}

function actorCount(agency: Agency) {
  return agency.actors?.length ?? 0
}

function getEntertainmentSummaryMetrics(partnerCount: number, actorTotal: number) {
  const educationYears = Math.max(
    0,
    new Date().getFullYear() - TRUST_EDUCATION_STARTED_YEAR,
  )

  return [
    { label: '위탁 교육 기간', unit: '년', value: educationYears },
    { label: '파트너사', unit: '개사', value: partnerCount },
    { label: '교육 연기자', unit: '명', value: actorTotal },
  ]
}

const queryAgencies = cache(async (center: EntertainmentCenter) => {
  try {
    const payload = await getPayload({ config: configPromise })
    const where: Where = {
      and: [
        {
          displayStatus: {
            equals: 'published',
          },
        },
        {
          or: [
            {
              centers: {
                contains: center,
              },
            },
            {
              centers: {
                contains: 'all',
              },
            },
          ],
        },
      ],
    }

    const result = await payload.find({
      collection: 'agencies',
      depth: 2,
      limit: 100,
      sort: 'displayOrder',
      where,
    })

    return result.docs as Agency[]
  } catch {
    return []
  }
})
