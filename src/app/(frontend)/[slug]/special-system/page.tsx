import type { Metadata } from 'next'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  getEducationHeroImage,
  PageHeroImage,
} from '@/app/(frontend)/_components/PageHeroImage'
import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, getCenterLabel } from '@/lib/centers'

import { SpecialSystemIndex } from './SpecialSystemIndex.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type SpecialSystemDetail = {
  description: string
  title: string
}

type SpecialSystemItem = {
  cta?: {
    href: string
    label: string
  }
  details?: SpecialSystemDetail[]
  description: string[]
  id: string
  image?: string
  navTitle: string
  title: string
}

const specialSystemItems: SpecialSystemItem[] = [
  {
    description: [
      '입시 실기시험에서 의상과 헤어, 메이크업 등의 비주얼적인 요소는 심사위원들에게 학생의 첫인상을 결정하는 중요한 요소로 작용합니다.',
      '그에 따라 배우앤배움 입시센터에서는 학생 개개인별 스타일링 회의를 통하여 시험에 적합한 의상 제작과 헤어, 메이크업에 관한 기획을 진행합니다.',
    ],
    details: [
      {
        description:
          '배우앤배움 입시센터는 각 학생의 자유연기 및 특기(뮤지컬, 움직임), 지정작품에 따른 헤어와 메이크업, 의상을 각 작품과 상황에 맞게 기획하여 준비시키고, 이 후 이러한 기획을 바탕으로 헤어&메이크업 전문샵과 제휴하여 수강생의 시험 스타일링을 위한 부담을 줄이고 있습니다. 또한 의상컨셉 회의를 통하여 필요 시, 의상제작 전문업체에 연계함으로서 시험준비환경에 전문성을 높이고 있습니다.',
        title: '진행방식',
      },
    ],
    id: 'image-making',
    image: '/assets/special-system/image-making.png',
    navTitle: '의상 제작 & 헤어, 메이크업',
    title:
      '의상·헤어·메이크업을 체계적으로 준비하는\n입시생 맞춤형 이미지 메이킹 프로그램',
  },
  {
    description: [
      '배우앤배움 입시센터는 정규수업시간 외 입시준비에도 도움이 될 수 있도록 다양한 교육지원 시스템을 구축하였습니다.',
      '연극영화과 입시에 필수적인 희곡에 대한 분석과 인물분석, 학생별 일상에서부터의 변화를 꾀할 수 있는 트레이닝 방법 등의 튜토리얼 영상을 연구 개발함으로서 학생들의 집중과 효율을 극대화 할 수 있는 시스템입니다.',
    ],
    details: [
      {
        description:
          '전문 입시 디자이너들이 분석 튜토리얼을 통해 연극영화과 입시생 필독 희곡에 대한 희곡분석법, 작품의 주제, 캐릭터에 대한 설명을 돕습니다.',
        title: '작품 분석 튜토리얼 클래스',
      },
      {
        description:
          '입시생이라면 알아야 할 연극영화과 입시에 대해 모든 것을 완벽 정리하여 시험준비부터 실기고사장을 나오기까지의 실전을 준비할 수 있습니다.',
        title: '마스터 클래스',
      },
    ],
    id: 'education-support',
    navTitle: '특별 교육 지원 시스템',
    title: '수업 밖에서도 이어지는 \n입시 맞춤형 교육지원 시스템',
  },
  {
    description: [
      '배우앤배움 입시센터는 매니지먼트BNB와 협력하여, 예비입시생에게 현장경험을 통한 수시 특기자전형 지원이 가능하도록 오디션의 기회를 제공합니다.',
      '배우앤배움은 국내에서 이루어지는 모든 드라마, 영화, 광고 오디션 정보를 보유하고 있으며, 아트센터 1층 DID를 통해 이 달의 오디션에 대한 공지와 안내를 하고 있습니다. 특히 계열사인 ㈜라인업(드라마 캐스팅)과 ㈜유캐스팅(드라마 캐스팅) 및 ㈜BX모델에이전시(광고 캐스팅)에서 진행하는 오디션을 통해 국내 드라마, 영화, OTT 및 주요 CF광고를 다이렉트 캐스팅하고 있으며, 이를 통해 배우앤배움 입시센터 학생들이 각 대학 특기자전형 지원자격을 갖출 수 있도록 지원합니다.',
    ],
    id: 'special-admission',
    navTitle: '특기 전형 시스템',
    title: '현장 경험부터 오디션 기회까지\n특기자 전형을 체계적으로 지원합니다.',
  },
]

export function generateStaticParams() {
  return [{ slug: 'exam' }]
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  return {
    description: `${getCenterLabel(center)} 의상, 헤어, 메이크업과 특별 교육 지원, 특기자전형 지원 시스템 안내`,
    title: '특별한 시스템',
  }
}

export default async function SpecialSystemPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  const decoIcons = getPageDecoIcons(
    specialSystemItems.length + 2,
    'special-system',
  )

  return (
    <main className="page page-dark page-special-system" data-center={center}>
      <section
        aria-labelledby="special-system-hero-title"
        className="section-kv-hero section-kv-hero--standard section-special-system-hero overflow-hidden"
        data-page-tone="dark"
      >
        <PageHeroImage
          image={getEducationHeroImage(center)}
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[38%] md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <div
            className="section-special-system-hero__title page-hero-label"
            id="special-system-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">특별한 시스템</span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="special-system-list-title"
        className="section-special-system-list section-p-block-base text-white"
      >
        <div className="container grid items-start gap-12 overflow-visible lg:grid-cols-3">
          <aside className="section-special-system-list__aside lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:self-start">
            <PageIntro
              className="page-heading--dark"
              id="special-system-list-title"
              title={'실기시험의 완성은\n디테일입니다.'}
              titleClassName="section-special-system-list__title"
            />

            <SpecialSystemIndex
              items={specialSystemItems.map(({ id, navTitle }) => ({
                id,
                title: navTitle,
              }))}
            />
          </aside>

          <div className="section-special-system-list__items col-span-1 flex flex-col gap-24 md:gap-40 lg:col-span-2">
            {specialSystemItems.map((item, index) => (
              <article
                className="section-special-system-card scroll-mt-(--page-top-offset)"
                id={item.id}
                key={item.id}
              >
                <header className="section-special-system-card__head relative flex min-h-14 items-start gap-5 pl-20">
                  <PageDeco
                    className="left-0 top-0 opacity-90"
                    icon={decoIcons[index + 2]}
                    size="57px"
                  />
                  <h3 className="section-special-system-card__title whitespace-pre-line type-title-l font-bold leading-1.4 text-white">
                    {item.title}
                  </h3>
                </header>

                <div className="section-special-system-card__intro mt-8 flex flex-col gap-3 type-body-m font-medium leading-normal">
                  <p className="text-white">{item.description[0]}</p>
                  <p className="text-white/40">{item.description[1]}</p>
                </div>

                {item.image ? (
                  <div className="section-special-system-card__media mt-8 overflow-hidden bg-neutral-900">
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="h-auto w-full"
                      height={308}
                      sizes="(max-width: 1023px) calc(100vw - 40px), 552px"
                      src={item.image}
                      width={552}
                    />
                  </div>
                ) : null}

                {item.details ? (
                  <div className="section-special-system-card__details mt-8 flex flex-col">
                    {item.details.map((detail, detailIndex) => (
                      <section
                        className={[
                          'section-special-system-detail flex flex-col gap-5 py-8 first:pt-0 last:pb-0',
                          detailIndex > 0 ? 'border-t border-white/10' : '',
                        ].join(' ')}
                        key={detail.title}
                      >
                        <header className="section-special-system-detail__head flex items-center gap-3">
                          <span className="section-special-system-detail__number inline-flex w-fit rounded-full bg-white px-3 py-1 type-label-m font-extrabold leading-[1.2] text-neutral-900">
                            {formatSpecialSystemIndex(detailIndex)}
                          </span>
                          <h4 className="section-special-system-detail__title type-title-m font-bold leading-[1.4] text-white">
                            {detail.title}
                          </h4>
                        </header>
                        <p className="section-special-system-detail__description type-body-m font-medium leading-normal text-white/55">
                          {detail.description}
                        </p>
                      </section>
                    ))}
                  </div>
                ) : null}

                {item.cta ? (
                  <Link
                    className="section-special-system-card__link mt-8 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-white/40 px-5 py-3 type-label-l font-semibold leading-[1.2] text-white transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    href={item.cta.href}
                  >
                    {item.cta.label}
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={2.3}
                    />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function formatSpecialSystemIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
