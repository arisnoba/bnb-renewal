import type { Metadata } from 'next'

import Image from 'next/image'
import { notFound } from 'next/navigation'

import { getEducationHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, getCenterLabel } from '@/lib/centers'

import { ExamManagementIndex } from './ExamManagementIndex.client'

type Args = {
  params: Promise<{
    slug: string
  }>
}

type ExamManagementItem = {
  description: string[]
  englishTitle: string
  id: string
  image: string
  title: string
}

const examManagementItems = [
  {
    description: [
      '배우앤배움 입시센터는 개별 학생의 시각적 강점을 극대화하기 위한 맞춤형 이미지 컨설팅을 제공합니다. 학생의 체형, 분위기, 퍼스널 컬러에 따라 의상, 헤어, 메이크업 스타일링을 설계하며, 실기 준비를 위한 표정, 자세, 태도 교정까지 함께 진행됩니다. 또한, 개개인의 서사를 효과적으로 드러낼 수 있도록 개별 미팅을 병행하여, 입시 현장에서 ‘가장 나다운 이미지’를 완성할 수 있도록 돕고 있습니다.',
    ],
    englishTitle: 'BNB Image Consulting Program',
    id: 'personal-consulting',
    image: '/assets/exam-management/personal-consulting.png',
    title: '퍼스널 컨설팅',
  },
  {
    description: [
      '입시는 순간의 결과가 아닌 하루하루의 관리에서 시작됩니다. 배우앤배움 입시센터는 매주 인바디 측정을 통해 체력과 생활 습관을 점검하고, 성과·진도·피드백을 데이터베이스화하여 지속적인 성장경로를 설계합니다. 또한 목표 달성률을 추적하고, 모의평가 결과를 반영한 전략 수정으로 학생 개인에게 가장 효과적인 입시 루트를 안내합니다. 정교한 관리는 안정적 성과로 연결되며 최종 결과를 예측 가능하게 만듭니다.',
    ],
    englishTitle: 'BNB Daily Monitoring System',
    id: 'daily-monitoring',
    image: '/assets/exam-management/daily-monitoring.png',
    title: '365 관리',
  },
  {
    description: [
      '입시를 준비하는 학생들에게 자신만의 이미지와 매력을 효과적으로 표현하는 법은 가장 중요한 전략 중 하나입니다. 배우앤배움은 학생 개개인의 성향과 장점에 맞춘 스타일 가이드를 통해 입시에서의 첫인상을 설계합니다. 의상·헤어·메이크업의 방향성을 컨셉화하고, 카메라 테스트 및 이미지 시뮬레이션을 반복 진행하여 실전에서 가장 세련되고 자연스러운 연기자가 될 수 있도록 준비합니다.',
    ],
    englishTitle: 'Style & Image Matching Strategy',
    id: 'style-concept',
    image: '/assets/exam-management/style-concept.png',
    title: '스타일 컨셉 미팅',
  },
  {
    description: [
      '배우앤배움 입시센터는 학생의 현재 실력, 희망 대학의 평가 기준, 이미지 분석을 바탕으로 맞춤형 입시 전략을 설계합니다. 월간 단위로 진행되는 집중 훈련을 통해 몰입도와 실전력을 끌어올리며, 누적 데이터베이스를 기반으로 매월 합격 가능성을 점검합니다. 다양한 특강 및 집중 훈련 프로그램은 전략적 입시 운영의 중심이 되며 합격을 위한 가장 현실적이고 효과적인 지도를 제공합니다.',
    ],
    englishTitle: 'BNB Admission Strategy Mapping',
    id: 'strategy-mapping',
    image: '/assets/exam-management/strategy-mapping.png',
    title: '전략 매핑',
  },
  {
    description: [
      '배우앤배움 입시센터는 교육부와 매니지먼트팀 간의 정기 협업 시스템을 운영합니다. 수업 리포트와 개별 피드백을 상호 공유하며 입시 실기와 관련한 세부 내용들을 체계적으로 분석합니다. 대학별 입시 성향과 학생의 개성을 조율하여 최종 시험 전까지 전략을 지속적으로 보완하고 실전 준비도를 높입니다. 또한, 시험 스트레스를 최소화할 수 있도록 심리적 지원과 컨디션 관리를 병행하며 학생의 자신감과 동기부여를 강화합니다.',
    ],
    englishTitle: 'Management-Driven Training Feedback',
    id: 'training-feedback',
    image: '/assets/exam-management/training-feedback.png',
    title: '교육부 & 매니지먼트 협업',
  },
  {
    description: [
      '합격 이후의 진로 역시 입시만큼 중요합니다. 배우앤배움은 합격 학생들을 대상으로 전공 심화 및 진로 방향성에 대한 맞춤형 컨설팅을 제공합니다. 희망 진로에 따라 오디션 지원 전략을 수립하고, 포트폴리오 및 영상 프로필 관리까지 함께 진행하며, 현장 진출에 필요한 준비를 체계적으로 지원합니다. 데뷔를 희망하는 학생에게는 실전 연계를 포함한 구체적인 로드맵을 제공함으로써 입시 이후에도 안정적으로 성장할 수 있도록 돕고 있습니다.',
    ],
    englishTitle: 'Post-Admission Path Consulting',
    id: 'post-admission',
    image: '/assets/exam-management/post-admission.png',
    title: '입시 이후 관리',
  },
] satisfies ExamManagementItem[]

const examManagementCardDecoClasses = [
  'left-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]',
  'right-[calc(var(--page-deco-size)/-2)] top-[calc(var(--page-deco-size)/-2)]',
  'right-[calc(var(--page-deco-size)/-2)] bottom-[calc(var(--page-deco-size)/-2)]',
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
    description: `${getCenterLabel(center)} 입시 설계, 이미지 컨설팅, 전략 매핑, 합격 이후 관리 안내`,
    title: '입시 매니지먼트',
  }
}

export default async function ExamManagementPage({ params }: Args) {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'exam') {
    notFound()
  }

  const decoIcons = getPageDecoIcons(
    examManagementItems.length + 2,
    'exam-management',
  )

  return (
    <main className="page page-dark page-exam-management" data-center={center}>
      <section
        aria-labelledby="exam-management-hero-title"
        className="section-exam-management-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <PageHeroImage image={getEducationHeroImage(center)} className="opacity-70" />
        <div className="absolute inset-0 bg-black/72" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[38%] max-md:hidden! md:block md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:hidden! md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <div
            className="section-exam-management-hero__title page-hero-label"
            id="exam-management-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">입시 매니지먼트</span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="exam-management-list-title"
        className="section-exam-management-list section-p-block-base text-white"
      >
        <div className="container grid items-start gap-12 overflow-visible lg:grid-cols-3">
          <aside className="section-exam-management-list__aside lg:sticky lg:top-[calc(var(--page-top-offset)+32px)] lg:self-start">
            <PageIntro
              className="page-heading--dark"
              id="exam-management-list-title"
              title={'입시 설계부터\n실전 대응까지'}
              titleClassName="section-exam-management-list__title"
            />

            <ExamManagementIndex
              items={examManagementItems.map(({ id, title }) => ({
                id,
                title,
              }))}
            />
          </aside>

          <div className="section-exam-management-list__items col-span-1 flex flex-col gap-16 md:gap-20 lg:col-span-2">
            {examManagementItems.map((item, index) => (
              <article
                className="section-exam-management-card scroll-mt-(--page-top-offset)"
                id={item.id}
                key={item.id}
              >
                <div className="section-exam-management-card__media relative aspect-[552/320]">
                  <PageDeco
                    className={[
                      'z-20 opacity-90',
                      examManagementCardDecoClasses[
                        index % examManagementCardDecoClasses.length
                      ],
                    ].join(' ')}
                    icon={decoIcons[index + 2]}
                    size="90px"
                  />
                  <div className="relative z-10 size-full overflow-hidden bg-neutral-900">
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
                <div className="section-exam-management-card__body mt-8 flex flex-col gap-5">
                  <header className="section-exam-management-card__head flex flex-col gap-3 sm:flex-row sm:items-end">
                    <span className="section-exam-management-card__number inline-flex w-fit rounded-full bg-white px-3 py-1 type-label-m font-extrabold leading-[1.2] text-neutral-900">
                      {formatExamManagementIndex(index)}
                    </span>
                    <div className="section-exam-management-card__title-wrap flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
                      <h3 className="section-exam-management-card__title type-title-l font-bold leading-[1.2] text-white">
                        {item.title}
                      </h3>
                      <p className="section-exam-management-card__subtitle type-label-m font-medium leading-[1.6] text-white/45">
                        {item.englishTitle}
                      </p>
                    </div>
                  </header>
                  <div className="section-exam-management-card__description flex flex-col gap-4 type-body-s leading-relaxed text-white/55 md:type-body-m">
                    {item.description.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function formatExamManagementIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
