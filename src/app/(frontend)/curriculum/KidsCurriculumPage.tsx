import {
  BookOpenText,
  Camera,
  Clapperboard,
  Drama,
  Monitor,
  PersonStanding,
  ScanSearch,
  Smile,
  Speech,
  Theater,
  type LucideIcon,
} from 'lucide-react'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'

type KidsCurriculumSection = {
  cards: KidsCurriculumCard[]
  description: string
  heading: string
  level: string
  summary: string[]
}

type KidsCurriculumCard = {
  icon: LucideIcon
  items: string[]
  title: string
}

const kidsCurriculumSections: KidsCurriculumSection[] = [
  {
    cards: [
      {
        icon: Smile,
        items: [
          '역할놀이를 통한 흥미 유발',
          '상황극을 통한 창의력, 상상력, 관찰력 훈련',
        ],
        title: '놀이 훈련',
      },
      {
        icon: Speech,
        items: [
          '개인별 화술의 습관 분석 및 교정',
          '화술 훈련 (소리, 발음교정)',
        ],
        title: '화술 훈련',
      },
      {
        icon: PersonStanding,
        items: [
          '신체적으로 몸을 활용하는 방법 및 훈련',
          '기초 신체훈련을 통해 적극성을 올리는 훈련',
        ],
        title: '신체 훈련',
      },
    ],
    description:
      '연기 교육과정의 첫 걸음은 놀이로 시작하여 이를 통해 재능과 공감능력을 향상시키는 것입니다. 자신의 소리와 움직임을 활용하는 아이들의 흥미와 재미를 유발시켜, 단순히 생활에 접목할 수 있는 자연스러운 카메라 동작에 맞는 연기 장면의 피드백과 능동적으로 접근할 수 있도록 적극성과 사회성을 개발시키기 위한 프로그램입니다. 또한 연기의 틀을 받아들이는 기초 과정으로 표현의 가장 기본이 되는 화술 훈련을 중심으로 구성되어 있으며, 자기 소개와 대본 읽기를 통해 아이의 성향과 좋은 습관을 형성할 수 있도록 창의력과 표현력을 함께 키워나갑니다.',
    heading: '영재',
    level: '초급 Class',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주1회 2-3시간',
      '과정 : 이해하기 / 말하기 / 움직이기 / 표현하기',
    ],
  },
  {
    cards: [
      {
        icon: Drama,
        items: [
          '다양한 상황극을 통해 경험하지 못한 새로운 감정과 표현 도출',
          '반복적인 상황극 훈련을 통해 정형화되지 않은 유연한 연기 유도',
          "2인극을 통해 주고 받는 '액션'과 '리액션' 훈련",
        ],
        title: '심화 연기훈련',
      },
      {
        icon: Camera,
        items: [
          '카메라를 이용한 연기수업',
          '모니터링을 통해 연기의 디테일을 잡는 방법과 표현구체화',
        ],
        title: '카메라연기',
      },
      {
        icon: BookOpenText,
        items: [
          '대본 전체 파악하는 방법 배우기',
          '대본의 상황과 인물 분석 방법 알아보기',
        ],
        title: '대본 이해와 분석',
      },
      {
        icon: ScanSearch,
        items: [
          '자신에게 맞는 상황별 독백을 통해 오디션 준비',
          '오디션에서 이루어지는 과정 시뮬레이션 훈련',
        ],
        title: '오디션 독백 준비',
      },
    ],
    description:
      "아역배우 과정에서는 연기자로서 현장에 나갈 수 있는 기초 컨디션을 다지는 훈련이 진행됩니다. 대사를 직접적으로 읽는 것이 아닌, 상황과 대사에 대해 충분한 이해를 통해 본질적이고 깊이 있는 연기로 섬세하게 표현하는 것을 지향합니다. 또한 감정훈련과 대본 이해, 상황 분석을 통해 '왜' 배우가 아닌 '아이'로 출발해 자연스럽게 역할에 이입하고 그 경험 안에 자신을 담을 수 있도록 다양한 교육 프로그램을 구성하였습니다.",
    heading: '아역배우',
    level: '중급 Class',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주1회 2-3시간',
      '과정 : 인물창조 / 디테일작업 / 심화 카메라연기 / 현장 피드백',
    ],
  },
  {
    cards: [
      {
        icon: Theater,
        items: [
          '완성된 연기에 캐릭터의 색깔과 매력 입히기',
          '1차원적인 표현이 아닌 복합적인 감정을 통해 표현하기',
        ],
        title: '심화 연기 디테일 교정',
      },
      {
        icon: Clapperboard,
        items: [
          '오디션을 통한 개인별 연기 스타일, 특징 분석',
          '오디션 장르별 맞춤 전략',
        ],
        title: '오디션 훈련',
      },
      {
        icon: Monitor,
        items: [
          '모니터링을 통해 연기의 디테일을 잡는 방법과 액팅 리뷰',
          '시선, 제스처, 비즈니스, 디테일 표정 분석 및 교정',
        ],
        title: '카메라 훈련/모니터링 훈련',
      },
    ],
    description:
      '아티스트 과정은 그동안 영재교육과 아역배우 과정을 통해 배우로서 현장에 투입된 아역배우들을 위한 전문교육 과정입니다. 본 과정은 아이들이 오디션이나 촬영 현장에서 필요한 커리큘럼으로만 구성되어 있습니다. 단순히 자연스러운 연기를 넘어 디테일한 상황분석과 인물 창조를 통해 연기의 본질을 이해하고 표현할 수 있도록 하는 실전 훈련반입니다.',
    heading: '아티스트',
    level: '고급 Class',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주1회 2-3시간',
      '과정 : 인물창조 / 디테일작업 / 심화 카메라연기 / 현장 피드백',
    ],
  },
]

const heroDecoIcons = getPageDecoIcons(2, 'kids-curriculum-hero')

export function KidsCurriculumPage() {
  return (
    <main className="page page-dark page-curriculum page-curriculum--kids bg-neutral-950" data-center="kids">
      <section
        aria-labelledby="kids-curriculum-hero-title"
        className="section-kids-curriculum-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{ backgroundImage: "url('/assets/curriculum/hero.png')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/75" />
        <PageDeco
          className="-left-24 top-[48%] max-md:!hidden md:-left-28"
          icon={heroDecoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:!hidden md:right-[-104px]"
          icon={heroDecoIcons[1]}
        />

        <div className="container relative z-10 flex min-h-140 items-end pb-20 md:min-h-200 md:pb-35">
          <h1
            className="section-kids-curriculum-hero__title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="kids-curriculum-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">커리큘럼</span>
          </h1>
        </div>
      </section>

      <section className="section-kids-curriculum-list section-p-block-lg text-white">
        <div className="container">
          <div className="section-kids-curriculum-list__stack flex flex-col">
            {kidsCurriculumSections.map((section, index) => (
              <KidsCurriculumSection
                isFirst={index === 0}
                key={section.heading}
                section={section}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function KidsCurriculumSection({
  isFirst,
  section,
}: {
  isFirst: boolean
  section: KidsCurriculumSection
}) {
  return (
    <article
      aria-labelledby={`kids-curriculum-${section.heading}`}
      className={`section-kids-curriculum-course ${isFirst ? '' : 'border-t border-white/10 pt-16 md:pt-20'} ${isFirst ? '' : 'mt-16 md:mt-20'}`}
    >
      <header className="section-kids-curriculum-course__header grid gap-8 md:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)] md:gap-12">
        <h2
          className="type-display-m font-extrabold leading-[1.3] text-white"
          id={`kids-curriculum-${section.heading}`}
        >
          <span className="block text-brand">{section.heading}</span>
          <span className="block">교육 과정</span>
        </h2>

        <div className="section-kids-curriculum-course__summary">
          <p className="type-title-l font-bold leading-[1.4] text-white">{section.level}</p>
          <p className="mt-7 whitespace-pre-line type-body-m text-white/60">
            {section.summary.join('\n')}
          </p>
        </div>
      </header>

      <div className="section-kids-curriculum-course__body mt-10 md:mt-20">
        <p className="type-body-s leading-[1.7] text-white/60">{section.description}</p>

        <div
          className={`section-kids-curriculum-course__cards mt-10 grid gap-5 md:grid-cols-2 ${section.cards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
          {section.cards.map((card) => (
            <KidsCurriculumCard card={card} key={card.title} />
          ))}
        </div>
      </div>
    </article>
  )
}

function KidsCurriculumCard({ card }: { card: KidsCurriculumCard }) {
  const Icon = card.icon

  return (
    <div className="section-kids-curriculum-card flex min-h-44 flex-col gap-8 rounded-xl bg-white/6 p-7 text-white md:min-h-48">
      <Icon aria-hidden="true" className="size-8 text-white/25" strokeWidth={1.8} />
      <div className="section-kids-curriculum-card__body">
        <h3 className="type-title-s font-bold leading-[1.5]">{card.title}</h3>
        <ul className="mt-3 space-y-1.5 type-body-s leading-[1.6] text-white/60">
          {card.items.map((item) => (
            <li className="flex gap-2" key={item}>
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-white/40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
