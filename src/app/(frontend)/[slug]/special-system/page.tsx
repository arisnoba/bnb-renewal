import type { Metadata } from 'next'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { notFound } from 'next/navigation'

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
  details?: SpecialSystemDetail[]
  description: string[]
  id: string
  image?: string
  title: string
}

const specialSystemItems = [
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
    title: '의상·헤어·메이크업을 체계적으로 준비하는\n입시생 맞춤형 이미지 메이킹 프로그램',
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
    title: '수업 밖에서도 이어지는 입시 맞춤형 교육지원 시스템',
  },
] satisfies SpecialSystemItem[]

const specialSystemQuickLinks = [
  '특가 전형 시스템',
  '매니지먼트 연계 시스템',
] as const

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
    description: `${getCenterLabel(center)} 의상, 헤어, 메이크업과 특별 교육 지원 시스템 안내`,
    title: `특별한 시스템 | ${getCenterLabel(center)}`,
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
        className="section-special-system-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-70"
          fill
          priority
          sizes="100vw"
          src="/assets/special-system/hero.png"
        />
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[38%] max-md:hidden! md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:hidden! md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-special-system-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="special-system-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">특별한 시스템</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="special-system-list-title"
        className="section-special-system-list section-p-block-base text-white"
      >
        <div className="container grid items-start gap-12 overflow-visible lg:grid-cols-3">
          <aside className="section-special-system-list__aside lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:self-start">
            <h2
              className="section-special-system-list__title type-display-m font-semibold md:type-display-l"
              id="special-system-list-title"
            >
              실기시험의 완성은
              <br className="hidden md:block" /> 디테일입니다.
            </h2>

            <SpecialSystemIndex
              items={specialSystemItems.map(({ id, title }) => ({
                id,
                title: indexTitle(title),
              }))}
            />

            <div
              aria-label="특별 시스템 추가 항목"
              className="section-special-system-list__quick mt-10 flex w-fit flex-col text-white md:mt-14"
            >
              {specialSystemQuickLinks.map((label, index) => (
                <div
                  className={[
                    'inline-flex items-center gap-2 border border-white/10 px-4 py-3 type-label-m font-medium leading-[1.6] text-white',
                    index > 0 ? 'border-t-0' : '',
                  ].join(' ')}
                  key={label}
                >
                  {label}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-3 text-brand"
                    strokeWidth={2.3}
                  />
                </div>
              ))}
            </div>
          </aside>

          <div className="section-special-system-list__items col-span-1 flex flex-col gap-24 md:gap-32 lg:col-span-2">
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
                  <h3 className="section-special-system-card__title whitespace-pre-line type-title-l font-bold leading-[1.2] text-white">
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
                      height={523}
                      sizes="(max-width: 1023px) calc(100vw - 40px), 552px"
                      src={item.image}
                      width={917}
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
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function indexTitle(title: string) {
  if (title.startsWith('의상')) {
    return '의상 제작 & 헤어, 메이크업'
  }

  return '특별 교육 지원 시스템'
}

function formatSpecialSystemIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
