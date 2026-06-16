import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import React, { cache } from 'react'

import { Media } from '@/components/Media/Renderer'
import { assertCenter, centers, type CenterSlug } from '@/lib/centers'
import type { Agency } from '@/payload-types'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type EntertainmentCenter = Exclude<CenterSlug, 'exam'>

const entertainmentMetadata = {
  art: {
    description: '배우앤배움 아트센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육 | 배우앤배움 아트센터',
  },
  avenue: {
    description: '배우앤배움 애비뉴센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육 | 배우앤배움 애비뉴센터',
  },
  highteen: {
    description: '배우앤배움 하이틴센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육 | 배우앤배움 하이틴센터',
  },
  kids: {
    description: '배우앤배움 키즈센터 엔터테인먼트 위탁교육 안내',
    title: '엔터테인먼트 위탁교육 | 배우앤배움 키즈센터',
  },
} satisfies Record<EntertainmentCenter, Metadata>

function isEntertainmentCenter(center: CenterSlug): center is EntertainmentCenter {
  return center !== 'exam'
}

export function generateStaticParams() {
  return Object.keys(entertainmentMetadata).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (!isEntertainmentCenter(center)) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return entertainmentMetadata[center]
}

export default async function EntertainmentEducationPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  if (!isEntertainmentCenter(center)) {
    notFound()
  }

  const agencies = await queryAgencies(center)

  return (
    <main className="page page-dark page-entertainment" data-center={center}>
      <EntertainmentHero />
      <EntertainmentEducationSection agencies={agencies} center={center} />
    </main>
  )
}

function EntertainmentHero() {
  return (
    <section className="section-entertainment-hero relative min-h-[520px] overflow-hidden bg-black md:min-h-[740px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-55 grayscale"
        style={{ backgroundImage: "url('/assets/curriculum/hero.png')" }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div
        aria-hidden="true"
        className="absolute left-[-72px] top-[34%] size-[170px] rounded-full border-[48px] border-brand md:left-[-94px] md:size-[240px] md:border-[68px]"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-64px] right-[-52px] size-[190px] border-[58px] border-brand md:bottom-[-78px] md:right-[-70px] md:size-[260px] md:border-[78px]"
      />
      <div className="container relative flex min-h-[520px] items-end pb-[72px] pt-[calc(var(--admin-bar-height,0px)+118px)] md:min-h-[740px] md:pb-[126px] md:pt-[calc(var(--admin-bar-height,0px)+144px)]">
        <h1 className="page-title">
          <span className="block text-brand">교육</span>
          <span className="block">엔터테인먼트</span>
          <span className="block">위탁교육</span>
        </h1>
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

  return (
    <section
      aria-labelledby="entertainment-title"
      className="section-entertainment section-p-block-base bg-bg-footer text-white"
    >
      <div className="container">
        <div className="section-entertainment__header max-w-[1120px]">
          <p className="type-title-l font-bold leading-[1.4] text-brand">엔터테인먼트 파트너</p>
          <h2
            className="mt-8 type-display-l font-bold leading-[1.35] tracking-normal text-white md:mt-10"
            id="entertainment-title"
          >
            IRUDA 위탁교육 시스템입니다.
            <br />
            현장 경험으로 배우의 성장을 만듭니다.
          </h2>
          <div className="mt-8 max-w-[960px] type-body-m leading-[1.5] text-white/60 md:mt-10">
            <p>
              {centerName}는 국내 60여 곳 엔터테인먼트의 연기교육 파트너사로서 2010년
              개원부터 지금까지 해당 기획사의 소속 배우들을 위탁받아 교육하고 있습니다.
            </p>
            <p>
              교육했던 연기자들의 수많은 오디션과 작품 경험을 통해 수강생들에게 경험적,
              질적 우수성을 제공하고 있습니다.
            </p>
          </div>
        </div>

        {actorTotal > 0 ? (
          <div className="section-entertainment__summary mt-12 flex flex-wrap items-end gap-6 md:mt-16">
            <p className="type-headline-s font-bold leading-[1.35] text-white/80">위탁중인 배우</p>
            <p className="type-display-xl font-extrabold leading-none text-white">{actorTotal}명</p>
          </div>
        ) : null}
      </div>

      <div className="container-fluid px-0!">
        <AgencyLogoGrid agencies={agencies} />
      </div>

      <div className="container">
        {center !== 'highteen' ? (
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
    <div className="section-entertainment__partners mt-14 grid grid-cols-4 overflow-hidden sm:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-14">
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
          pictureClassName="relative block h-[64%] w-[88%] transition-opacity duration-200 group-hover:opacity-10 group-focus-visible:opacity-10"
          resource={logo}
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
      className="section-trust-actor-system mt-24 md:mt-32"
    >
      <div className="section-trust-actor-system__header">
        <p className="type-title-l font-bold leading-[1.4] text-brand">위탁연기자 교육시스템</p>
        <h2
          className="mt-8 type-display-l font-bold leading-[1.35] tracking-normal text-white md:mt-10"
          id="trust-actor-system-title"
        >
          배우의 성장은 체계적인
          <br />
          관리에서 시작됩니다.
        </h2>
        <div className="mt-8 max-w-[960px] type-body-m leading-[1.5] text-white/60 md:mt-10">
          <p>
            {centerName}의 위탁 교육연기자는 ‘활동준비 대상자’와 ‘현장투입 대상자’로
            분류되어 관리되고 있습니다.
          </p>
          <p>
            활동준비자의 경우 교육팀에서 관리하며, 현장투입자의 경우 교육팀과 캐스팅팀이
            함께 연기자를 관리하고 있습니다.
          </p>
        </div>
      </div>

      <div className="section-trust-actor-system__cards mt-16 grid gap-5 lg:grid-cols-2 md:mt-24">
        {educationSystemCards(center).map((card) => (
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
  steps?: string[]
  title: string
}

function educationSystemCards(center: EntertainmentCenter): EducationSystemCardData[] {
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
        '소속사는 위탁연기자의 외부 오디션을 진행하는 경우, 배우앤배움 교육팀으로 해당 작품의 시놉시스나 대본, 혹은 오디션 대본을 보내주시면 됩니다. 해당 오디션에서 연기자들이 경쟁력을 갖출 수 있도록 감독 및 작가의 성향이나 전작에 대한 정보를 분석해 이에 맞춘 오디션 전략교육이 이루어집니다.',
      id: '03',
      note: '※ 일반 수강생의 경우에도 외부 오디션 시 동일하게 진행됩니다.',
      title: '오디션 준비',
    },
    {
      body:
        '배역 확정 시 1:1 작품코치진이 투입됩니다. 연출진의 작품의도와 원하는 전체 캐릭터 등 기본적인 내용을 파악한 후 코치진은 배우와 함께 개인 캐릭터 분석을 시작으로 대본리딩을 시작하게 됩니다.',
      id: '04',
      note: '※ 소속사가 없는 배우의 경우에도 코치진과 작품 준비를 하게 됩니다.',
      title: '작품 준비',
    },
    {
      body:
        '배우가 성장하는 과정을 보여드리기 위한 연기 영상자료를 제공해 드립니다. 배우앤배움은 다양한 각도에서 엔터사 및 연기자를 보조하는 역할을 수행합니다.',
      cta: { href: `/${center}/profile-production`, label: '영상제작 서비스' },
      id: '05',
      title: '영상제작지원',
    },
  ]
}

function EducationSystemCard({ card }: { card: EducationSystemCardData }) {
  return (
    <article className="section-trust-actor-system-card flex min-h-[340px] flex-col rounded-xl bg-white/[0.06] p-7 md:p-8">
      <p className="type-headline-l font-black leading-none text-white/20">{card.id}</p>
      <div className="mt-10 flex flex-1 flex-col">
        <h3 className="type-title-s font-bold leading-[1.5] text-white">{card.title}</h3>
        <p className="mt-3 type-body-s leading-[1.5] text-white/60">{card.body}</p>
        {card.steps ? <EducationSystemSteps steps={card.steps} /> : null}
        {card.note ? <p className="mt-auto pt-8 type-body-s text-white/60">{card.note}</p> : null}
        {card.cta ? (
          <Link
            className="mt-auto inline-flex w-fit items-center rounded-full border border-white/40 px-5 py-3 type-label-l font-semibold leading-[1.2] text-white transition-colors hover:border-brand hover:text-brand"
            href={card.cta.href}
          >
            {card.cta.label}
            <ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />
          </Link>
        ) : null}
      </div>
    </article>
  )
}

function EducationSystemSteps({ steps }: { steps: string[] }) {
  const levelSteps = steps.every((step) => step.length === 1)

  if (levelSteps) {
    return (
      <div className="mt-5 grid grid-cols-5 gap-1">
        {steps.map((step) => (
          <div
            className="grid h-20 place-items-center rounded-xl border border-white/10 text-center"
            key={step}
          >
            <span className="block type-headline-s font-black uppercase leading-none text-white">
              {step}
            </span>
            <span className="mt-1 block type-caption-s font-medium text-white/50">class</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ol className="mt-5 space-y-2 border-y border-white/10 py-5">
      {steps.map((step, index) => (
        <li className="flex gap-2 type-body-s leading-[1.5] text-white/60" key={step}>
          <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 type-caption-s font-medium leading-[1.35]">
            {['첫번째', '두번째', '세번째', '네번째'][index] ?? `${index + 1}번째`}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function NoticeCard() {
  return (
    <article className="section-trust-actor-system-card section-trust-actor-system-card--notice flex min-h-[240px] flex-col rounded-xl border border-white/20 bg-bg-footer p-7 md:p-8">
      <Bell aria-hidden="true" className="size-8 text-white/25" strokeWidth={1.8} />
      <div className="mt-10">
        <h3 className="type-title-s font-bold leading-[1.5] text-white">Notice</h3>
        <p className="mt-3 type-body-s leading-[1.5] text-white/60">
          엔터테인먼트 위탁 교육에 관련한 일체의 할인 및 협찬은 불가합니다.
        </p>
      </div>
    </article>
  )
}

function actorCount(agency: Agency) {
  return agency.actors?.length ?? 0
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
