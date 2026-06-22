import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Image from 'next/image'
import { getPayload } from 'payload'
import { cache } from 'react'

import { centers, type CenterSlug, assertCenter } from '@/lib/centers'
import type { History } from '@/payload-types'

import { CompanyAffiliateCarousel, type CompanyAffiliate } from './CompanyAffiliateCarousel.client'
import { CompanyTextDeco } from './CompanyTextDeco.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type HistoryItem = {
  date: string
  label: string
  side: 'left' | 'right'
}

const centerSlugs = Object.keys(centers) as CenterSlug[]

export const dynamic = 'force-dynamic'

const affiliates: CompanyAffiliate[] = [
  {
    description:
      '수많은 신인 배우 성장의 흐름을 바꿔온, 대한민국 연기 교육의 상징적인 플랫폼입니다. 이곳에서 연기는 직업이 되고, 배우는 하나의 브랜드가 됩니다.',
    href: null,
    imageAlt: 'BAEWOO&BAEWOOM EnM 서비스 이미지',
    imageSrc: '/assets/company/company-01.jpg',
    name: 'BAEWOO&BAEWOOM EnM',
  },
  {
    description:
      '개성과 감정, 에너지를 담아내는 ‘무브먼트 아티스트’들의 공간으로, 자유롭고 정교한 스토리 빌드업을 통해 무대 위에서 자신을 설계할 줄 아는 퍼포머를 만들어 갑니다.',
    href: null,
    imageAlt: 'PERFECT PERFORMANCE ENT 서비스 이미지',
    imageSrc: '/assets/company/company-02.jpg',
    name: 'PERFECT PERFORMANCE ENT',
  },
  {
    description:
      '수많은 화제작에서 주역을 발굴·연결해 온 경험을 바탕으로, 세대와 장르를 아우르는 최적의 캐스팅을 제공합니다. TV·OTT 등 다양한 매체에서 탁월한 매칭을 실현하며, 제작사와 감독들의 신뢰를 받고 있습니다.',
    href: null,
    imageAlt: 'BNB CASTING 서비스 이미지',
    imageSrc: '/assets/company/company-03.jpg',
    name: 'BNB CASTING',
  },
  {
    description:
      '세계 시장을 향해, 정교한 매니지먼트와 세심한 브랜딩으로 아티스트를 시대를 아우르는 주역으로 완성하며, 문화와 트렌드를 선도하는 글로벌 아이콘으로 성장시킵니다.',
    href: null,
    imageAlt: 'BISTUS ENT. 서비스 이미지',
    imageSrc: '/assets/company/company-04.jpg',
    name: 'BISTUS ENT.',
  },
  {
    description:
      '배우를 중심으로, 감독·작가의 성장을 함께 이끄는 종합 아티스트 매니지먼트입니다. 차별화된 전략으로 커리어를 확장하고, 각자가 지닌 색과 가치를 세계 무대에서 빛나게 합니다.',
    href: null,
    imageAlt: 'BAA ENT. 서비스 이미지',
    imageSrc: '/assets/company/company-05.jpg',
    name: 'BAA ENT.',
  },
  {
    description:
      '아티스트의 본질을 포착해 고유한 색을 깊이 끌어올리고, 독창적인 시각으로 정체성을 담은 이미지를 완성합니다. 한 컷의 사진으로 가치를 만들어가는 크리에이티브 포토 스튜디오입니다.',
    href: null,
    imageAlt: 'STUDIO BNB 촬영 이미지',
    imageSrc: '/assets/company/company-06.jpg',
    name: 'STUDIO BNB',
  },
  {
    description:
      '세계 무대와 팬덤의 중심에서 경쟁력 있는 아티스트를 기획·육성하며, 글로벌 브랜딩 경험과 해외 파트너십 네트워크를 통해 전략적 빌드업과 독창적인 콘텐츠로 K-pop의 다음 흐름을 만들어가는 음악 IP 제작사입니다.',
    href: null,
    imageAlt: 'BNB MUSIC 서비스 이미지',
    imageSrc: '/assets/company/company-07.jpg',
    name: 'BNB MUSIC',
  },
  {
    description:
      '글로벌 미디어 기업과의 프로젝트에서 검증된 제작 역량을 바탕으로, AI·버추얼·XR 등 첨단 기술을 창의적으로 결합합니다. 브랜드 메시지를 한층 입체적으로 구현하며, 시청자의 경험을 새롭게 디자인하는 차세대 프로덕션입니다.',
    href: null,
    imageAlt: 'VORD INSIGHT 미디어 이미지',
    imageSrc: '/assets/company/company-08.jpg',
    name: 'VORD INSIGHT',
  },
  {
    description:
      '틱톡 코리아에서 그룹 라이브 부문 1위를 공식 수상한 크리에이션 그룹으로, 라이브 스트리밍과 아티스트 매니지먼트를 통해 K-Culture 실시간 콘텐츠 IP를 기획·확장하며 글로벌 시장에서 새로운 팬 경험을 만들어갑니다.',
    href: null,
    imageAlt: 'BNB PLAY 서비스 이미지',
    imageSrc: '/assets/company/company-09.jpg',
    name: 'BNB PLAY',
  },
  {
    description:
      '우리는 아티스트 IP를 문화적 자산으로 완성해 온 경험을 바탕으로, 그 가치를 브랜드와 커머스로 확장합니다. IP의 스토리와 정체성을 제품에 입혀, 글로벌 K-Commerce의 새로운 기준을 만듭니다.',
    href: null,
    imageAlt: 'BNB CNX 서비스 이미지',
    imageSrc: '/assets/company/company-10.jpg',
    name: 'BNB CNX',
  },
  {
    description:
      'K-아티스트의 콘서트와 팬미팅을 비롯해, SNS를 통한 실시간 팬덤 연결까지 아우르는 글로벌 활동을 설계·운영합니다. IP를 중심에 두고, 팬들과의 거리를 좁히며 세계 무대에서 영향력을 확장하는 커뮤니케이션 플랫폼입니다.',
    href: null,
    imageAlt: 'FANCONN 서비스 이미지',
    imageSrc: '/assets/company/company-11.jpg',
    name: 'FANCONN',
  },
  {
    description:
      '국내외 유수 기업과 협력해 광고 캐스팅을 전문적으로 수행하며, 브랜드 아이덴티티와 모델의 헤리티지를 정교하게 매칭합니다. 글로벌 마켓 인사이트와 트렌드 분석력으로 브랜드 가치와 매력을 극대화합니다.',
    href: null,
    imageAlt: 'BX MODEL AGENCY 서비스 이미지',
    imageSrc: '/assets/company/company-12.jpg',
    name: 'BX MODEL AGENCY',
  },
  {
    description:
      'AI와 데이터 기반의 SOIAA 플랫폼은, 누구나 광고 영상을 제작하고 시청하며 보상을 얻을 수 있는 공간입니다. 창작과 참여가 선순환하는 IP 가치 생태계를 기술로 구현해, 새로운 패러다임을 열어갑니다.',
    href: null,
    imageAlt: 'DEEPCON 서비스 이미지',
    imageSrc: '/assets/company/company-13.jpg',
    name: 'DEEPCON',
  },
  {
    description:
      'IP 기반 콘텐츠의 성장 잠재력에 주목해, 엔터테인먼트를 비롯한 전방위 IP 비즈니스에 전략적으로 투자합니다. 브랜드 자산과 창의성을 결합한 기업에 집중하며, 장기 가치를 축적하고 지속 가능한 성장을 설계합니다.',
    href: null,
    imageAlt: 'BNB INVEST 서비스 이미지',
    imageSrc: '/assets/company/company-14.jpg',
    name: 'BNB INVEST',
  },
]

export function generateStaticParams() {
  return centerSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(decodeURIComponent(slug))

  return {
    description: `배우앤배움 ${centers[center]} 회사소개와 BNB INDUSTRY 네트워크를 확인하세요.`,
    title: `회사소개 | ${centers[center]}`,
  }
}

export default async function CompanyPage({ params }: Args) {
  const { slug } = await params
  assertCenter(decodeURIComponent(slug))
  const historyItems = await queryHistoryItems()

  return (
    <main className="page page-dark page-company bg-neutral-950 text-white" data-center="art">
      <section
        aria-labelledby="company-hero-title"
        className="section-company-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <Image
          alt=""
          className="absolute inset-0 size-full object-cover object-center opacity-60 grayscale"
          fill
          priority
          sizes="100vw"
          src="/assets/company/hero-building.png"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/55" />
        <Image
          alt=""
          aria-hidden="true"
          className="absolute -left-18 top-24 hidden size-45 md:block md:size-65 lg:size-90"
          height={360}
          src="/assets/company/deco-square.svg"
          unoptimized
          width={360}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="absolute -right-20 bottom-[-56px] hidden size-52 md:block md:size-72 lg:size-90"
          height={360}
          src="/assets/company/deco-ring.svg"
          unoptimized
          width={360}
        />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-30">
          <h1 className="section-company-hero__title type-display-l font-extrabold text-white md:type-display-xl" id="company-hero-title">
            <span className="block text-brand">배우앤배움</span>
            <span className="block">회사소개</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="company-branding-title"
        className="section-company-branding section-p-block-lg relative overflow-hidden"
      >
        <CompanyTextDeco />
        <div className="container relative">
          <div className="grid gap-14 md:grid-cols-3 md:grid-rows-[auto_1fr] md:gap-x-12 md:gap-y-4">
            <header className="section-company-branding__head md:col-start-1 md:row-start-1">
              <h2
                className="type-display-l font-extrabold uppercase text-white md:type-display-xl leading-[1.1]"
                id="company-branding-title"
              >
                BAEWOO
                <br />
                NEW
                <br />
                BRANDING
              </h2>
            </header>

            <p className="section-company-branding__summary type-title-l font-semibold text-white/75 md:col-start-1 md:row-start-2 md:self-start">
              아티스트들의 새로운 가치를 만드는 문화기업
            </p>

            <div className="section-company-branding__copy md:col-span-2 md:col-start-2 md:row-start-2 md:self-start">
              <p className="type-title-l font-semibold uppercase text-white">
                BNB INDUSTRY는 <br/>BAEWOO NEW BRANDING이라는 미션 아래 <br/>배우 관련 비즈니스 모델을 혁신하는 기업입니다.
              </p>
              <div className="mt-10 space-y-5 type-body-m text-white/55">
                <p>
                  BNB는 배우 중심 비즈니스에서 출발한 종합 엔터테인먼트 기업으로, ‘Integrated K-Creative Platform Corp’이라는 진화된 정체성을 바탕으로 성장하고 있습니다. 콘텐츠 기반의 창조력과 문화적 영향력을 핵심 가치로 삼으며 강력한 IP를 바탕으로 다양한 비즈니스 확장이 가능한 플랫폼으로 진화하고 있습니다. 엔터테인먼트와 첨단 기술의 융합을 통해 미래 산업을 선도할 새로운 가능성을 만들어가고 있습니다.
                </p>
                <p>
                  BNB는 신인 배우 발굴과 개발에 특화된 국내 대표 엔터테인먼트 플랫폼 기업을 지향합니다. 미디어 콘텐츠의 중심에서 배우의 영향력을 최우선 가치로 두고 높은 기준의 브랜딩과 시스템을 통해 신인 배우가 건강하고 가치 있는 하나의 브랜드로 성장할 수 있도록 지원합니다.
                </p>
                <p>
                  현재 BNB는 국내 최대 규모의 예체능 교육 및 엔터테인먼트 사업을 운영하고 있으며, 총 14개 분야의 CIC(Company In Company)로 구성되어 있습니다. 주요 계열사로는 배우앤배움이앤엠, 비스터스엔터테인먼트, 비에이에이엔터테인먼트, 유캐스팅, 비엑스모델에이전시, 배우화스튜디오, 퍼펙트제이댄스스튜디오, 비앤비플레이, 비앤비뮤직, 팬컨, 볼드인사이트, 엑스스트림, 비앤비씨앤엑스, 딥컨이 있습니다. 미디어 제작부터 드라마, 영화, OTT, 광고에 이르는 자체 캐스팅 및 매니지먼트 시스템을 통해 신인 배우의 데뷔와 성장을 안정적으로 지원하는 종합 솔루션을 구축하고 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="company-affiliates"
        className="section-company-affiliates section-p-block-lg relative overflow-hidden"
      >
        <div className="container relative">
          <CompanyAffiliateCarousel affiliates={affiliates} />
        </div>
      </section>

      <section
        aria-labelledby="company-message-title"
        className="section-company-message section-p-b-lg relative overflow-hidden"
      >
        <div className="container relative">
          <div className="mb-8 flex items-center gap-3 md:mb-10">
              <Image
                alt=""
                aria-hidden="true"
                height={28}
                src="/assets/company/ci.svg"
                unoptimized
                width={92}
              />
              <p className="type-label-l font-bold text-white/75">대표 인사말</p>
            </div>
            <figure className="relative overflow-hidden bg-neutral-300">
              <Image
                alt="배우앤배움 대표 임채홍"
                className="size-full object-cover"
                height={760}
                priority
                sizes="(max-width: 767px) calc(100vw - 40px), 960px"
                src="/assets/company/ceo-portrait.jpg"
                width={1120}
              />
              <figcaption className="sr-only">
                임채홍 LIM, CHAE-HONG
              </figcaption>
            </figure>

          <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-[200px_minmax(0,560px)] md:justify-center md:gap-24">
            <Image
              alt=""
              aria-hidden="true"
              className="hidden size-40 md:block"
              height={160}
              src="/assets/company/deco-square.svg"
              unoptimized
              width={160}
            />
            <div>
              <h2 className="type-headline-l font-extrabold text-white" id="company-message-title">
                우리가 아티스트의 새로운
                <br />
                가능성을 발견하는 순간,
              </h2>
              <div className="mt-8 space-y-5 type-body-s text-white/55">
                <p>
                  BNB는 배우의 가능성을 교육 과정 안에 가두지 않고, 현장의 언어와 산업의 흐름으로 확장합니다. 배우가 가진 감각을 발견하고 새로운 브랜드로 성장할 수 있도록 함께 설계합니다.
                </p>
                <p>
                  앞으로도 배우앤배움은 아티스트의 시작과 도약을 연결하는 문화기업으로서, 더 넓은 무대를 만드는 일에 집중하겠습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="company-history-title"
        className="section-company-history section-p-block-lg relative overflow-hidden"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute -left-8 bottom-0 hidden size-44 md:block"
          height={176}
          src="/assets/company/deco-square.svg"
          unoptimized
          width={176}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="absolute -right-36 top-56 hidden size-64 md:block lg:-right-44 lg:size-80"
          height={360}
          src="/assets/company/deco-ring.svg"
          unoptimized
          width={360}
        />
        <div className="container relative grid gap-14 grid-cols-1 md:grid-cols-3">
          <header className="section-company-history__head col-span-1">
            <p className="type-label-s font-extrabold uppercase text-brand">History</p>
            <h2 className="mt-7 type-display-m font-extrabold text-white md:type-display-l" id="company-history-title">
              새로운 가능성을
              <br />
              만들어온 시간
            </h2>
          </header>
          <ol className="section-company-history__list relative flex flex-col md:col-span-2">
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-0 top-4 w-px bg-white/10 md:left-1/2"
            />
            {historyItems.length > 0 ? (
              historyItems.map((item) => (
                <li
                  className="section-company-history__item relative grid min-h-16 grid-cols-[1fr] items-center pl-7 md:min-h-23 md:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] md:pl-0"
                  key={`${item.date}-${item.label}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-[-3px] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/20 md:left-1/2 md:z-10 md:-translate-x-1/2"
                  />
                  {item.side === 'left' ? (
                    <>
                      <div className="flex items-center justify-start gap-5 md:justify-end md:pr-4 md:text-right">
                        <span className="order-2 max-w-34 type-body-m font-bold text-white/30 md:order-1">{item.label}</span>
                        <strong className="order-1 type-headline-m font-extrabold text-white md:order-2">{item.date}</strong>
                      </div>
                      <span aria-hidden="true" className="hidden md:block" />
                      <span aria-hidden="true" className="hidden md:block" />
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="hidden md:block" />
                      <span aria-hidden="true" className="hidden md:block" />
                      <div className="flex items-center justify-start gap-5 md:pl-4">
                        <strong className="type-headline-m font-bold text-white">{item.date}</strong>
                        <span className="md:max-w-34 type-body-m font-extrabold text-white/30">{item.label}</span>
                      </div>
                    </>
                  )}
                </li>
              ))
            ) : (
              <li className="section-company-history__empty pl-7 type-body-m font-bold text-white/35 md:pl-[calc(50%+24px)]">
                등록된 연혁이 없습니다.
              </li>
            )}
          </ol>
        </div>
      </section>
    </main>
  )
}

const queryHistoryItems = cache(async (): Promise<HistoryItem[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'histories',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: '-year',
    })

    return toHistoryItems(result.docs as History[])
  } catch {
    return []
  }
})

function toHistoryItems(histories: History[]): HistoryItem[] {
  const items = histories.flatMap((history) => {
    const year = Number(history.year)

    if (!Number.isFinite(year)) {
      return []
    }

    return [...(history.months ?? [])]
      .filter((month) => Number.isFinite(Number(month.month)))
      .sort((a, b) => Number(b.month) - Number(a.month))
      .flatMap((month) => {
        const date = `${year}. ${String(month.month).padStart(2, '0')}`

        return (month.items ?? [])
          .map((item) => ({
            date,
            label: item.title.trim(),
          }))
          .filter((item) => item.label.length > 0)
      })
  })

  return items.map((item, index) => ({
    ...item,
    side: index % 2 === 0 ? 'left' : 'right',
  }))
}
