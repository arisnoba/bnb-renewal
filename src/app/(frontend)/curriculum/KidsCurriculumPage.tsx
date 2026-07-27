import {
  Brain,
  BookOpenText,
  Camera,
  Clapperboard,
  ClipboardCheck,
  Heart,
  Monitor,
  PersonStanding,
  Speech,
  Theater,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { getEducationHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'

type KidsCurriculumSection = {
  cards: KidsCurriculumCard[]
  description: string
  heading: string
  id: string
  level: string
  summary: string[]
}

type KidsCurriculumCard = {
  description: string
  icon: LucideIcon
  items: string[]
  title: string
}

const kidsCurriculumSections: KidsCurriculumSection[] = [
  {
    cards: [
      {
        description:
          '단순히 감정을 크게 표현하는 것이 아니라 ‘왜 그런 감정을 느끼는지’를 이해하며 표현(행동)하는 힘을 기릅니다.',
        icon: Heart,
        items: [
          '기초 감정(기쁨, 슬픔, 화남, 놀람 등) 표현하기',
          '감정 변화 이해하기',
          '즉흥 상황극',
          '행동동사 기초',
        ],
        title: '감정 표현 훈련',
      },
      {
        description:
          '연기의 기본이 되는 목소리와 전달력을 익히며 발표력과 자신감까지 함께 성장시킵니다.',
        icon: Speech,
        items: [
          '발성·발음 기초',
          '호흡 훈련',
          '리듬/템포',
          '쉼 (Pause)',
          '또렷한 전달력 만들기',
        ],
        title: '화술 훈련',
      },
      {
        description:
          '몸을 자유롭게 사용하는 방법을 배우며 감정을 신체로 표현하는 기초를 다집니다.',
        icon: PersonStanding,
        items: ['긴장 풀기', '신체 균형', '공간 인식', '다양한 움직임 표현'],
        title: '신체 표현 훈련',
      },
    ],
    description:
      '연기를 처음 접하는 아이들이 연기의 즐거움을 경험하며 자신의 감정과 생각을 자연스럽게 표현할 수 있도록 지도합니다. 다양한 신체활동과 즉흥연기를 통해 상상력과 표현력을 확장하고, 발성·발음·호흡의 기초를 함께 익혀 건강한 표현 습관을 만들어갑니다.',
    heading: 'I Class',
    id: 'i',
    level: '표현의 기초 (Intro)',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주 1회 2~3시간',
      '교육목표 : 표현하기 / 상상하기 / 전달하기',
    ],
  },
  {
    cards: [
      {
        description: '감정을 표현하기보다 감정을 품는 힘을 배우는 단계입니다.',
        icon: Brain,
        items: ['생각 만들기', '감정의 밀도 높이기', '감정 절제', '침묵의 연기'],
        title: '내면 연기 훈련',
      },
      {
        description: '대사를 외우는 것이 아니라 인물을 이해하는 배우의 사고방식을 훈련합니다.',
        icon: BookOpenText,
        items: ['전 상황', '인물의 목표', '행동동사 심화', '관계 분석'],
        title: '장면 분석 훈련',
      },
      {
        description: '카메라 앞에서 자연스럽게 표현하는 기초를 익힙니다.',
        icon: Camera,
        items: ['시선 처리', '카메라 거리 이해', '롱샷 / 미디엄샷 / 클로즈업', '자연스러운 리액션'],
        title: '매체 기초 훈련',
      },
    ],
    description:
      '표현된 감정을 조금 더 깊이 있게 만들어가는 단계입니다. 감정을 크게 드러내기보다 생각과 호흡을 통해 자연스럽게 전달하는 방법을 익히며, 인물의 심리를 이해하고 장면 속에서 살아가는 배우의 기본기를 훈련합니다.',
    heading: 'R Class',
    id: 'r',
    level: '감정을 담아내는 배우 (Refine)',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주 1회 2~3시간',
      '교육목표 : 담아내기 / 절제하기 / 이해하기',
    ],
  },
  {
    cards: [
      {
        description: '복합적인 감정을 자연스럽게 연결하는 훈련을 진행합니다.',
        icon: Theater,
        items: ['웃지만 슬픈 감정', '화나지만 참는 감정', '기쁘지만 불안한 감정'],
        title: '복합감정 훈련',
      },
      {
        description: '연기는 혼자 하는 것이 아니라 상대와 함께 만들어가는 과정임을 익힙니다.',
        icon: Users,
        items: ['상대 배우 듣기', '반응 연기', '거리감', '감정의 흐름'],
        title: '관계 연기',
      },
      {
        description: '실제 촬영을 위한 장면을 반복 연습하며 완성도를 높입니다.',
        icon: Clapperboard,
        items: ['에쭈드', '매체 장면', '감정 연결', '카메라 리허설'],
        title: '장면 완성',
      },
    ],
    description:
      '하나의 감정을 표현하는 것을 넘어 서로 다른 감정을 자연스럽게 연결하고, 상대 배우와의 관계 속에서 살아있는 연기를 만들어갑니다.',
    heading: 'U Class',
    id: 'u',
    level: '감정을 연결하는 배우 (Upgrade)',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주 1회 2~3시간',
      '교육목표 : 연결하기 / 반응하기 / 몰입하기',
    ],
  },
  {
    cards: [
      {
        description: '현장에서 요구되는 배우의 대응력을 훈련합니다.',
        icon: ClipboardCheck,
        items: ['감독 디렉팅 이해', '다양한 버전 연기', '즉각적인 수정 능력', '애드리브 대응'],
        title: '디렉팅 훈련',
      },
      {
        description: '매체연기에서 가장 중요한 ‘절제된 표현’을 완성합니다.',
        icon: Monitor,
        items: ['시선 안에 정서 담기', '호흡으로 감정 전달', '최소한의 움직임', '클로즈업 연기'],
        title: '매체 심화',
      },
      {
        description: '실제 촬영 환경을 재현하여 실전 감각을 익힙니다.',
        icon: Clapperboard,
        items: ['오디션 연습', '촬영 리허설', '원테이크', '현장 동선'],
        title: '현장 시뮬레이션',
      },
    ],
    description:
      '실제 촬영 현장을 기준으로 진행되는 실전 과정입니다. 감독의 디렉팅을 빠르게 이해하고 다양한 버전의 연기를 즉시 구현하는 능력을 기르며, 눈빛과 호흡만으로도 인물의 정서를 전달하는 매체연기를 심화합니다.',
    heading: 'DA Class',
    id: 'da',
    level: '현장을 준비하는 배우 (Directing Actor)',
    summary: [
      '인원 : 정원 6명',
      '수업시간 : 주 1회 2~3시간',
      '교육목표 : 구현하기 / 대응하기 / 완성하기',
    ],
  },
]

const heroDecoIcons = getPageDecoIcons(2, 'kids-curriculum-hero')

export function KidsCurriculumPage() {
  return (
    <main className="page page-dark page-curriculum page-curriculum--kids bg-neutral-950" data-center="kids">
      <section
        aria-labelledby="kids-curriculum-hero-title"
        className="section-kv-hero section-kv-hero--standard section-kids-curriculum-hero"
        data-page-tone="dark"
      >
        <PageHeroImage image={getEducationHeroImage('kids')} />
        <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
        <PageDeco
          className="-left-24 top-[48%] md:-left-28"
          icon={heroDecoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] md:right-[-104px]"
          icon={heroDecoIcons[1]}
        />

        <div className="container relative z-10 flex min-h-140 items-end pb-20 md:min-h-200 md:pb-35">
          <h1
            className="section-kids-curriculum-hero__title page-hero-label"
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
                key={section.id}
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
      aria-labelledby={`kids-curriculum-${section.id}`}
      className={`section-kids-curriculum-course ${isFirst ? '' : 'border-t border-white/10 pt-16 md:pt-20'} ${isFirst ? '' : 'mt-16 md:mt-20'}`}
    >
      <header className="section-kids-curriculum-course__header grid gap-8 md:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)] md:gap-12">
        <h2
          className="type-display-m font-extrabold leading-[1.3] text-white"
          id={`kids-curriculum-${section.id}`}
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
        <h3 className="type-title-s font-bold leading-normal">{card.title}</h3>
        <ul className="mt-3 space-y-1.5 type-body-s leading-[1.6] text-white/60">
          {card.items.map((item) => (
            <li className="flex gap-2" key={item}>
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-white/40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 type-body-s leading-[1.7] text-white/45">
          {card.description}
        </p>
      </div>
    </div>
  )
}
