'use client'

import {
  ArrowRight,
  AudioLines,
  Brain,
  CalendarDays,
  Clapperboard,
  ClipboardCheck,
  Clock,
  Drama,
  FileText,
  Heart,
  Image,
  Monitor,
  ScanFace,
  Sparkles,
  Speech,
  ThumbsUp,
  Users,
  Video,
} from 'lucide-react'
import NextImage from 'next/image'
import { useEffect, useState } from 'react'

import { cn } from '@/utilities/ui'

type TabKey = 'steps' | 'criteria' | 'cohorts'

const tabs = [
  { key: 'steps', label: '단계별 교육' },
  { key: 'criteria', label: '등급 · 심사 기준' },
  { key: 'cohorts', label: '기수 안내' },
] satisfies Array<{ key: TabKey; label: string }>

const gradeAssetBase = '/assets/art/grade-system'

const stepClasses = [
  {
    className: 'I Class',
    cards: [
      {
        icon: Speech,
        items: ['호흡/발성/발음/템포&리듬/억양/성량 훈련', '개인별 화술적 습관 분석 및 교정', '독백 대본으로 화술 훈련'],
        title: '화술 훈련',
      },
      {
        icon: Heart,
        items: ["'나'로서 감정 표현하는 방법 알아보기", '정서적 경험과 체험 꺼내 놓기'],
        title: '감정 훈련',
      },
      {
        icon: ScanFace,
        items: ['신체적으로 몸을 활용하는 방법 탐구 및 훈련'],
        title: '신체 훈련',
      },
    ],
    description:
      "내가 배우로서 가진 재산이 무엇인지 알아보고, '나'를 활용하고 통제할 수 있게 훈련합니다. 배우가 자연스러운 연기를 하기 위해서는 본인이 가지고 있는 말과 신체에 대한 인지와 이해가 필요합니다. 배우앤배움의 초급 I-Class에서는 배우 본연의 정서-호흡-시선(행동)-화술에 관한 연구를 통해 '나'를 알아가는 과정을 공부하게 됩니다. 기초 연기의 훈련과정은 연기를 전달하는 데 기본적으로 필요한 말과 신체의 움직임을 시작으로 본인의 경험과 체험을 통한 감정 훈련으로 이어지게 되며, 교육목표는 '나를 움직이기 / 나로부터 시작하기 / 나를 공부하기' 세 가지로 이루어집니다.",
    headline: "'나'를 움직이기 / '나'로부터 시작하기 / '나'를 공부하기",
    label: '초급 I Class',
    letter: 'I',
  },
  {
    className: 'R Class',
    cards: [
      {
        icon: Users,
        items: ['즉흥 2인극을 통해 즉발적 반응에 의한 진정성 찾기', '본인이 만든 이야기 속에서 즉흥적으로 상황과 부딪치기'],
        title: '액팅&리액팅 훈련',
      },
      {
        icon: Brain,
        items: ['나의 정서와 연관된 텍스트 자기로부터의 출발 독백 연기', '2인극으로 서로 부딪치는 감정 훈련, 내 정서의 변화 관찰'],
        title: '심화 감정 훈련',
      },
      {
        icon: Video,
        items: ['화면으로 보이는 본인의 모습과 행동을 관찰 및 분석', '카메라 프레임 안에서 몸을 움직이는 방법과 적합한 동선 알아보기'],
        title: '카메라 훈련',
      },
      {
        icon: FileText,
        items: ['대본 전체 파악하는 방법 배우기', '대본의 상황과 인물 분석 방법 알아보기'],
        title: '대본 이해와 분석',
      },
    ],
    description:
      "내 몸을 알아가고 컨트롤이 가능하기 시작할 때에 '나'로서 연기에 접하는 것을 훈련합니다. '나'로서의 대사처리, 움직임, 제스처, 리액션 등을 자연스럽게 표현할 수 있는 것이 중급 과정입니다. 대사와 카메라는 '나'로부터 접근해서 타인이 봤을 때 나의 상태가 명확히 보이게끔 자신을 확장하는 작업에 들어갑니다. 그러기 위해 카메라로 보여지는 본인의 모습을 보면서 화면상 자연스러운 연기기술과 카메라 프레임 속에서 필요한 움직임에 대한 부분을 연구합니다.",
    headline: "'나'로서 연기하기",
    label: '중급 R Class',
    letter: 'R',
  },
  {
    className: 'U Class',
    cards: [
      {
        icon: FileText,
        items: ['대사의 감정선 파악과 연기의 기능전달 구성하기', '캐릭터의 이해와 성격구축'],
        title: '대본&대사 집중 훈련',
      },
      {
        icon: Monitor,
        items: ['모니터링을 통해 연기의 디테일을 잡는 방법과 표현 구체화하기', '시선, 제스처, 비즈니스, 더블액션 훈련'],
        title: '카메라 심화훈련',
      },
      {
        icon: Sparkles,
        items: ['배우로서의 본인만의 매력성을 찾아서 캐릭터 구축하기', '대본 안의 인물로서 매력 있는 정서표현 구현'],
        title: '매력 개발',
      },
    ],
    description:
      "'나'로서 연기에 상당 부분을 채워나갔다면, 이제는 캐릭터로의 접근을 시도해야 합니다. 상상을 통해 캐릭터를 창조하는 동시에 장면 속에 매 순간 진정성이 촉발되는 순간을 만들어내는 작업을 통해 연기를 배웁니다. 카메라에서 비춰진 본인의 모습에서 디테일을 살릴 방법을 알아가고 더 나아가 본인에게 어울리는 이미지를 찾습니다. 마지막으로 자신이 배우로서의 매력을 키워낼 방법들을 연기 코치진과 함께 연구합니다.",
    headline: "'나'를 변화시키기",
    label: '고급 U Class',
    letter: 'U',
  },
  {
    className: 'D Class',
    cards: [
      {
        icon: Image,
        items: ['출연했던 작품 캐스팅 디렉터와 함께 연기 모니터링 후 액팅 리뷰', '나에게 어울리는 이미지 메이킹 찾기'],
        title: '모니터링 훈련',
      },
      {
        icon: ScanFace,
        items: ['상황별(드라마/영화/연극) 오디션/미팅 테크닉 알아보기', '오디션을 통한 개인별 연기 스타일, 특징 분석'],
        title: '오디션 훈련',
      },
      {
        icon: Drama,
        items: ['작품선정 타입 캐스팅 후 전체 대본 리딩', '배우의 씬 장악력과 감독 눈높이에 맞는 캐릭터 분석'],
        title: '심화 연기 훈련',
      },
    ],
    description:
      '연기자가 필드에서 캐스팅 기회를 잡을 수 있도록 연기의 완성도를 높이고, 배우로서 본인의 장점을 개발하는 과정입니다. 본인의 존재감을 해당 작품의 감독과 캐스팅 디렉터에게 어필할 방법과 오디션과 미팅에서 돋보일 방법을 연구합니다. 특히 오디션별 특징을 분석해서 작품 또는 매체에 맞게끔 미팅을 준비하게 하고, 감독이 원하는 장면과 캐릭터를 표현하는 것에 대한 테크닉을 배웁니다. 전문 D-Class에서는 신인배우가 오디션과 미팅을 보고 작품에 출연하기까지의 전체적인 부분을 연기적·실용적인 부분에 맞춰 디테일하게 준비하는 과정을 담았습니다.',
    headline: "'나'를 알려주기",
    label: '전문 D Class',
    letter: 'D',
  },
  {
    className: 'A Class',
    cards: [
      {
        icon: Clapperboard,
        items: ['원테이크, 롱테이크 촬영 및 모니터링', '촬영현장의 이해(감독, 작가, 카메라, 조명, 음향의 이해)를 통한 연기력 향상 방법 연구'],
        title: '심화 모니터링 훈련',
      },
      {
        icon: AudioLines,
        items: ['상황별 현장 로케이션 연기 수업', '작품 안에서의 캐릭터 간 연기 앙상블 연구'],
        title: '심화 연기 훈련',
      },
    ],
    description:
      '신인배우가 본격적인 활동과 함께 대중적으로 인정받은 이후에도 현장에서 좋은 연기를 계속 이어 나가려면 지속적인 모니터링과 자기개발이 필요합니다. 특히 작품의 모니터링에 있어 촬영 분량의 원테이크와 롱테이크 부분의 호흡을 자세히 살펴봅니다. 또한, 다음 로케이션 촬영의 대본준비와 함께 상황별 기술적인 부분에 대한 이해도를 높인 상태에서 현장을 준비합니다. 마지막으로 평소 작품을 쉬는 기간에는 최근 유명 감독들의 연출 스타일을 연구하고, 그 작품 캐릭터 간의 연기 앙상블 등을 공부합니다.',
    headline: "'나'로서 활동하기",
    label: '배우 A Class',
    letter: 'A',
  },
]

const adultGradeRows = [
  {
    process: '배움\n과정',
    className: 'I Class',
    department: '교육 본부',
    experience: '해당사항 없음',
    inHouse: '연기 처음인 자',
    level: '초급',
    major: '해당사항 없음',
    processSpan: 3,
    transfer: '1~4개월 이수자',
  },
  {
    className: 'R Class',
    department: '교육 본부',
    experience: '해당사항 없음',
    inHouse: 'I Class 승급자\n*외부작품 오디션은 R Class부터 응시가능합니다.',
    level: '중급',
    major: '2~4년제 전공자 중\n1학년 이상 재학/휴학자\n<레벨테스트>',
    transfer: '5개월 이상 이수자 중\n레벨테스트',
  },
  {
    className: 'U Class',
    department: '주)교육본부\n부)매니지먼트본부\n부)광고에이전시본부',
    experience: '',
    inHouse: 'R Class 승급자\n*매니지먼트 위탁배우',
    level: '고급',
    major: '2~4년제 전공자 중\n2학년 이상 재학/휴학자\n<레벨테스트>',
    transfer: '12개월 이상 이수자 중\n레벨테스트',
  },
  {
    process: '배우\n과정',
    className: 'I Class',
    department:
      '주)매니지먼트본부\n부)광고에이전시본부\n부)드라마캐스팅본부\n* 대표이사 특별관리\n(작품 & 오디션)',
    experience:
      '드라마, 영화 조/단역이상\n경력 인정자\n뮤직비디오/뮤지컬 경력 인정자\n* 학교 작품 제외',
    inHouse: 'U Class 승급자',
    level: '초급',
    major:
      '4년제 전공자\n(서울예대포함) 중\n3학년 이상 이수자/졸업자\n<레벨테스트>\n혹은 매니지먼트본부 추천',
    processSpan: 2,
    transfer: '18개월 이상 이수자 중\n레벨테스트\n<광고에이전시/\n매니지먼트본부 추천>',
  },
  {
    className: 'R Class',
    department:
      '주)매니지먼트본부\n부)광고에이전시본부\n부)드라마캐스팅본부\n* 대표이사 특별관리\n(작품 & 오디션)',
    experience:
      '드라마, 영화 조/단역이상\n경력 인정자\n뮤직비디오 다수출연\n경력 인정자\n독립영화제 및 연극제\n연기상 수상자',
    inHouse: 'D Class 승급자',
    level: '중급',
    major:
      '4년제 전공자\n(서울예대포함) 졸업자 중\n경력인정자\n<레벨테스트>\n혹은 매니지먼트본부 추천',
    transfer:
      '24개월 이상 이수자 중\n경력인정자\n<매니지먼트/\n드라마캐스팅본부 추천>',
  },
]

type AdultGradeCard = {
  className: string
  department: string
  experience: string
  inHouse: string
  level: string
  major: string
  process: string
  transfer: string
}

// 모바일 카드용: process는 그룹 첫 행에만 있으므로 직전 값을 carry-forward.
const adultGradeCards = adultGradeRows.reduce<AdultGradeCard[]>((acc, row) => {
  const process = ('process' in row && row.process) || acc[acc.length - 1]?.process || ''
  acc.push({
    className: row.className,
    department: row.department,
    experience: row.experience,
    inHouse: row.inHouse,
    level: row.level,
    major: row.major,
    process,
    transfer: row.transfer,
  })
  return acc
}, [])

const criteriaEntryLabels = [
  { key: 'inHouse', label: '본학원' },
  { key: 'transfer', label: '타학원' },
  { key: 'major', label: '전공자' },
  { key: 'experience', label: '경력 인정자' },
] satisfies Array<{ key: 'experience' | 'inHouse' | 'major' | 'transfer'; label: string }>

const promotionGroups = [
  {
    process: '배움\n과정',
    rows: [
      {
        condition: '초급반 4개월 이수시 자동 승급',
        criteria: '기간',
        note: '',
        target: '중급',
        targetClass: 'R Class',
        type: '초급 I Class >',
      },
      {
        condition: '교육본부 추천/강사진 추천',
        criteria: '추천',
        note: '* 이수 기간 상관없이 승급 가능',
        target: '중급',
        targetClass: 'R Class',
        type: '초급 I Class >',
      },
      {
        condition: '중급반 6-10개월 이수',
        criteria: '기간',
        note: '중급반 6개월이상 이수 시 승급대상으로 선정',
        target: '고급',
        targetClass: 'U Class',
        type: '중급 R Class >',
      },
      {
        condition: '교육본부/매니지먼트본부/강사진 추천',
        criteria: '추천',
        note: '* 이수 기간 상관없이 승급 가능',
        target: '고급',
        targetClass: 'U Class',
        type: '중급 R Class >',
      },
      {
        condition: '교육본부 심사결과',
        criteria: '오디션',
        note: '',
        target: '고급',
        targetClass: 'U Class',
        type: '중급 R Class >',
      },
    ],
  },
  {
    process: '배우\n과정',
    rows: [
      {
        condition: '고급반 6-10개월 이수',
        criteria: '기간',
        note: '고급반 6개월이상 이수 시 승급대상으로 선정',
        target: '전문',
        targetClass: 'D Class',
        type: '고급 U Class >',
      },
      {
        condition: '교육본부/매니지먼트본부/강사진 추천',
        criteria: '추천',
        note: '* 고급반 6개월이상 이수자 중 추천',
        target: '전문',
        targetClass: 'D Class',
        type: '고급 U Class >',
      },
      {
        condition: '교육/매니지먼트/드라마캐스팅 본부 심사결과',
        criteria: '오디션',
        note: '* 이수 기간 상관없이 승급 가능',
        target: '전문',
        targetClass: 'D Class',
        type: '고급 U Class >',
      },
      {
        condition: '드라마, 영화 조/단역 이상 출연',
        criteria: '활동경력',
        note: '',
        target: '전문',
        targetClass: 'D Class',
        type: '고급 U Class >',
      },
      {
        condition: '전문반 6-10개월 이수',
        criteria: '기간',
        note: '전문반 6개월이상 이수 시 승급대상으로 선정',
        target: '배우',
        targetClass: 'A Class',
        type: '전문 D Class >',
      },
      {
        condition: '대표원장/캐스팅디렉터/매니지먼트본부 추천',
        criteria: '추천',
        note: '* 전문반 6개월이상 이수자 중 추천',
        target: '배우',
        targetClass: 'A Class',
        type: '전문 D Class >',
      },
      {
        condition: '매니지먼트본부/드라마캐스팅본부/대표이사 심사결과',
        criteria: '오디션',
        note: '* 이수 기간 상관없이 승급 가능',
        target: '배우',
        targetClass: 'A Class',
        type: '전문 D Class >',
      },
      {
        condition: '드라마, 영화 조연급 이상 다수 출연',
        criteria: '활동경력',
        note: '',
        target: '배우',
        targetClass: 'A Class',
        type: '전문 D Class >',
      },
    ],
  },
]

const cohortStartYear = 2010

type CohortHalf = '상반기' | '하반기'

type CohortRow = {
  half: CohortHalf
  number: number
  period: string
  year: number
}

function cohortNumber(year: number, half: CohortHalf) {
  return (year - cohortStartYear) * 2 + (half === '상반기' ? 1 : 2)
}

function currentKoreaYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(date)

  return {
    month: Number(parts.find((part) => part.type === 'month')?.value),
    year: Number(parts.find((part) => part.type === 'year')?.value),
  }
}

function cohortPeriod(year: number, half: CohortHalf) {
  return half === '상반기'
    ? `${year}-01-01 ~ ${year}-06-30`
    : `${year}-07-01 ~ ${year}-12-31`
}

function buildCohorts(date = new Date()): CohortRow[] {
  const { month, year } = currentKoreaYearMonth(date)
  const currentHalf: CohortHalf = month <= 6 ? '상반기' : '하반기'
  const rows: CohortRow[] = []

  for (let currentYear = year; currentYear >= cohortStartYear; currentYear -= 1) {
    const halves: CohortHalf[] =
      currentYear === year && currentHalf === '상반기'
        ? ['상반기']
        : ['하반기', '상반기']

    for (const half of halves) {
      rows.push({
        half,
        number: cohortNumber(currentYear, half),
        period: cohortPeriod(currentYear, half),
        year: currentYear,
      })
    }
  }

  return rows
}

export function GradeSystemTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('steps')

  useEffect(() => {
    function syncHashTab() {
      const hashTab = window.location.hash.replace('#', '') as TabKey

      if (tabs.some((tab) => tab.key === hashTab)) {
        setActiveTab(hashTab)
      }
    }

    syncHashTab()
    window.addEventListener('hashchange', syncHashTab)

    return () => window.removeEventListener('hashchange', syncHashTab)
  }, [])

  function selectTab(tab: TabKey) {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#${tab}`)
  }

  return (
    <section className="relative overflow-hidden bg-[#111] text-white">
      {activeTab === 'steps' ? (
        <>
          <RedCornerGlyph className="left-0 top-[930px] hidden h-[360px] w-[229px] -translate-x-[42%] lg:block" />
          <RedCornerGlyph className="right-0 top-[2900px] hidden h-[360px] w-[212px] translate-x-[46%] rotate-180 lg:block" />
        </>
      ) : null}
      <div className="container relative py-14 md:py-20">
        <nav aria-label="등급제 교육관리시스템" className="mb-16 border-b border-white/10">
          <div className="flex min-w-0 gap-8 overflow-x-auto md:gap-20">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key

              return (
                <button
                  aria-selected={isActive}
                  className={cn(
                    'relative h-14 shrink-0 text-base font-bold leading-none text-white/35 transition-colors hover:text-white',
                    isActive && 'text-brand',
                  )}
                  key={tab.key}
                  onClick={() => selectTab(tab.key)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                  {isActive ? (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

        {activeTab === 'steps' ? <StepsPanel /> : null}
        {activeTab === 'criteria' ? <CriteriaPanel /> : null}
        {activeTab === 'cohorts' ? <CohortsPanel /> : null}
      </div>
    </section>
  )
}

function StepsPanel() {
  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <section>
        <h2 className="max-w-[900px] text-[34px] font-extrabold leading-[1.25] tracking-normal [word-break:keep-all] md:text-[48px]">
          IRUDA 연기트레이닝 시스템입니다.
          <br />
          아트센터의 모든 교육은 ‘나’로부터 시작됩니다.
        </h2>
        <p className="mt-12 max-w-[720px] text-base leading-[1.8] text-white/55">
          <AcronymSentence />
          <br />
          각 클래스의 세부 교육내용은 이달의 커리큘럼에서 검색하시기 바랍니다.
        </p>
      </section>

      <IrudaWordmark />

      <div className="flex flex-col gap-20 md:gap-24">
        {stepClasses.map((item) => (
          <ClassSection item={item} key={item.className} />
        ))}
      </div>
    </div>
  )
}

function ClassSection({
  item,
}: {
  item: (typeof stepClasses)[number]
}) {
  return (
    <section className="border-t border-white/10 pt-16">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex items-start gap-3 lg:col-span-1">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-black text-white">
            {item.letter}
          </span>
          <h3 className="pt-1 text-[24px] font-extrabold leading-[1.3]">{item.label}</h3>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-[22px] font-extrabold leading-[1.45]">{item.headline}</h4>
          <p className="mt-9 max-w-[760px] text-[15px] leading-[1.95] text-white/50 [word-break:keep-all]">
            {item.description}
          </p>
        </div>
      </div>
      <div
        className={cn(
          'mt-20 grid gap-5 md:grid-cols-2',
          item.cards.length === 4
            ? 'lg:grid-cols-4'
            : item.cards.length === 2
              ? 'lg:grid-cols-2'
              : 'lg:grid-cols-3',
        )}
      >
        {item.cards.map((card) => {
          const Icon = card.icon

          return (
            <article className="min-h-[220px] rounded-[8px] bg-[#202020] p-8" key={card.title}>
              <Icon
                aria-hidden="true"
                className="mb-12 text-white/25"
                size={28}
                strokeWidth={2}
              />
              <h5 className="text-base font-extrabold leading-[1.45]">{card.title}</h5>
              <ul className="mt-5 space-y-2 text-sm leading-[1.7] text-white/48">
                {card.items.map((text) => (
                  <li className="grid grid-cols-[4px_minmax(0,1fr)] gap-2 [word-break:keep-all]" key={text}>
                    <span aria-hidden="true" className="mt-[0.78em] h-0.5 w-0.5 rounded-full bg-white/48" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function AcronymSentence() {
  return (
    <>
      <span className="text-brand">I</span> am <span className="text-brand">R</span>eady to{' '}
      <span className="text-brand">U</span>ndertake the <span className="text-brand">D</span>
      edication of <span className="text-brand">A</span>cting.
    </>
  )
}

function IrudaWordmark() {
  const letters = [
    { className: 'I Class', fileName: 'iruda-i.svg' },
    { className: 'R Class', fileName: 'iruda-r.svg' },
    { className: 'U Class', fileName: 'iruda-u.svg' },
    { className: 'D Class', fileName: 'iruda-d.svg' },
    { className: 'A Class', fileName: 'iruda-a.svg' },
  ]

  return (
    <figure aria-label="IRUDA 클래스 구성" className="mt-4">
      <div className="grid grid-cols-5 gap-3">
        {letters.map((letter) => (
          <div className="flex min-w-0 flex-col items-center gap-4" key={letter.className}>
            <NextImage
              alt=""
              aria-hidden="true"
              className="h-auto w-full"
              height={216}
              src={`${gradeAssetBase}/${letter.fileName}`}
              width={216}
            />
            <span className="text-center text-sm font-extrabold uppercase leading-none text-white">
              {letter.className}
            </span>
          </div>
        ))}
      </div>
    </figure>
  )
}

function RedCornerGlyph({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute text-brand', className)}>
      <svg className="h-full w-full" fill="currentColor" viewBox="0 0 229 360" xmlns="http://www.w3.org/2000/svg">
        <rect x="-31" width="160" height="360" />
        <rect x="-131" width="360" height="160" />
      </svg>
    </div>
  )
}

function CriteriaPanel() {
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <section className="">
        <h2 className="text-[30px] font-extrabold leading-[1.35] [word-break:keep-all] md:text-[42px]">
          정기적인 오디션을 통해 단계별로 초급 I반, 중급 R반,
          <br />
          고급 U반, 전문 D반, 배우 A반으로 클래스가 편성됩니다.
        </h2>
        <p className="mt-8 text-base leading-[1.85] text-white/50">
          전체 수강생은 전공생 30%, 비전공생 40%, 엔터테인먼트교육생 30%로 이루어져 있으며, 각 클래스에 따라 수강생의 담당 관리부서가 교체됩니다.<br/> 배우앤배움 교육팀에서는 기존 단일 오디션 형태의 승급 평가 방식에서 탈피하여 두 달 과정의 커리큘럼에 대한 전반적인 이수 평가를 도입하였습니다. <br/>커리큘럼이 끝나는 마지막 주에는 각 클래스의 강사진들이 연기자 평가서를 교육팀에 제출하게 되며, 이를 통해 학생들은 본인의 승급 여부와 함께 개인의 연기성장에 대한 정확한 피드백을 전달받게 됩니다.
        </p>
      </section>

      <AdultGradeTable />
      <PromotionTable />
    </div>
  )
}

function AdultGradeTable() {
  return (
    <section>
      <h3 className="mb-5 text-base font-extrabold leading-none">성인 등급 기준</h3>

      {/* 데스크탑: 표 형태 (가독성 개선) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed border-collapse text-center text-[12px] md:text-[13px]">
          <thead>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader rowSpan={2} width="w-[7%]">
                과정
              </CriteriaHeader>
              <CriteriaHeader rowSpan={2} width="w-[10%]">
                Class
              </CriteriaHeader>
              <CriteriaHeader rowSpan={2} width="w-[8%]">
                Level
              </CriteriaHeader>
              <CriteriaHeader rowSpan={2} width="w-[15%]">
                관리부서
              </CriteriaHeader>
              <CriteriaHeader className="border-l-2 border-l-brand/70" colSpan={4}>
                승급 및 지원 기준
              </CriteriaHeader>
            </tr>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader className="border-l-2 border-l-brand/70">본학원</CriteriaHeader>
              <CriteriaHeader>타학원</CriteriaHeader>
              <CriteriaHeader>전공자</CriteriaHeader>
              <CriteriaHeader>경력 인정자</CriteriaHeader>
            </tr>
          </thead>
          <tbody>
            {adultGradeRows.map((row, index) => (
              <tr
                className="bg-[#222] text-white/55 transition-colors hover:bg-[#262626]"
                key={`${index}-${row.className}`}
              >
                {row.process ? (
                  <CriteriaCell
                    className="bg-[#333] font-medium text-white"
                    rowSpan={row.processSpan}
                  >
                    {row.process}
                  </CriteriaCell>
                ) : null}
                <CriteriaCell className="font-medium text-white/80">{row.className}</CriteriaCell>
                <CriteriaCell>{row.level}</CriteriaCell>
                <CriteriaCell className="text-left align-top text-white/45">{row.department}</CriteriaCell>
                <CriteriaCell className="border-l-2 border-l-brand/40 text-left align-top" emphasis>
                  {row.inHouse}
                </CriteriaCell>
                <CriteriaCell className="text-left align-top">{row.transfer}</CriteriaCell>
                <CriteriaCell className="text-left align-top">{row.major}</CriteriaCell>
                <CriteriaCell
                  className="text-left align-top"
                  emphasis={row.experience.includes('연기상')}
                >
                  {row.experience}
                </CriteriaCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일/태블릿: 클래스별 카드 */}
      <div className="flex flex-col gap-4 lg:hidden">
        {adultGradeCards.map((card, index) => (
          <article
            className="overflow-hidden rounded-lg border border-[#363636] bg-[#1c1c1c]"
            key={`${index}-${card.className}`}
          >
            <header className="flex flex-wrap items-center gap-2 border-b border-[#363636] bg-[#262626] px-4 py-3">
              <ClassBadge>{card.className}</ClassBadge>
              <span className="text-sm font-bold text-white">{card.level}</span>
              <span className="ml-auto whitespace-pre-line text-right text-[11px] font-medium leading-tight text-white/45">
                {card.process.replace('\n', '')}
              </span>
            </header>
            <dl className="divide-y divide-[#2c2c2c] text-[13px]">
              <div className="flex gap-3 px-4 py-3">
                <dt className="w-20 shrink-0 font-medium text-white/40">관리부서</dt>
                <dd className="whitespace-pre-line leading-[1.55] text-white/70 [word-break:keep-all]">
                  {card.department || '-'}
                </dd>
              </div>
              {criteriaEntryLabels.map((entry) => {
                const value = card[entry.key]
                const isEmphasis = entry.key === 'inHouse' || value.includes('연기상')

                return (
                  <div className="flex gap-3 px-4 py-3" key={entry.key}>
                    <dt className="w-20 shrink-0 font-medium text-white/40">{entry.label}</dt>
                    <dd
                      className={cn(
                        'whitespace-pre-line leading-[1.55] text-white/70 [word-break:keep-all]',
                        isEmphasis && value && 'font-medium text-[#f87171]',
                      )}
                    >
                      {value || '-'}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function PromotionTable() {
  return (
    <section>
      <h3 className="mb-5 text-base font-extrabold leading-none">성인 승급 기준</h3>

      {/* 데스크탑: 표 형태 */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-collapse text-center text-[12px] md:text-[13px]">
          <thead>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader width="w-[7%]">과정</CriteriaHeader>
              <CriteriaHeader width="w-[20%]">승급 단계</CriteriaHeader>
              <CriteriaHeader width="w-[12%]">승급기준</CriteriaHeader>
              <CriteriaHeader width="w-[31%]">승급 조건</CriteriaHeader>
              <CriteriaHeader>비고 사항</CriteriaHeader>
            </tr>
          </thead>
          <tbody>
            {promotionGroups.map((group) =>
              group.rows.map((row, index) => {
                const typeSpan = group.rows.filter((item) => item.type === row.type).length
                const firstOfType = group.rows.findIndex((item) => item.type === row.type) === index

                return (
                  <tr
                    className="bg-[#222] text-white/55 transition-colors hover:bg-[#262626]"
                    key={`${group.process}-${row.type}-${row.criteria}`}
                  >
                    {index === 0 ? (
                      <CriteriaCell
                        className="bg-[#333] font-medium text-white"
                        rowSpan={group.rows.length}
                      >
                        {group.process}
                      </CriteriaCell>
                    ) : null}
                    {firstOfType ? (
                      <CriteriaCell rowSpan={typeSpan}>
                        <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                          <span className="font-medium text-white/70">
                            {row.type.replace(/\s*>\s*$/, '')}
                          </span>
                          <ArrowRight aria-hidden="true" className="text-brand" size={14} />
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-white/70">{row.target}</span>
                            <ClassBadge>{row.targetClass}</ClassBadge>
                          </span>
                        </span>
                      </CriteriaCell>
                    ) : null}
                    <CriteriaCell>
                      <CriteriaTypeBadge type={row.criteria} />
                    </CriteriaCell>
                    <CriteriaCell className="text-left align-top">{row.condition}</CriteriaCell>
                    <CriteriaCell className="text-left align-top" emphasis>
                      {row.note}
                    </CriteriaCell>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      </div>

      {/* 모바일: 승급 단계별 카드 */}
      <div className="flex flex-col gap-8 md:hidden">
        {promotionGroups.map((group) => {
          const types = [...new Set(group.rows.map((row) => row.type))]

          return (
            <div className="flex flex-col gap-4" key={group.process}>
              <p className="whitespace-pre-line text-sm font-extrabold leading-tight text-white/80">
                {group.process.replace('\n', ' ')}
              </p>
              {types.map((type) => {
                const rows = group.rows.filter((row) => row.type === type)
                const head = rows[0]

                return (
                  <article
                    className="overflow-hidden rounded-lg border border-[#363636] bg-[#1c1c1c]"
                    key={type}
                  >
                    <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#363636] bg-[#262626] px-4 py-3 text-sm">
                      <span className="font-medium text-white/70">
                        {type.replace(/\s*>\s*$/, '')}
                      </span>
                      <ArrowRight aria-hidden="true" className="text-brand" size={15} />
                      <span className="font-bold text-white">{head.target}</span>
                      <ClassBadge>{head.targetClass}</ClassBadge>
                    </header>
                    <ul className="divide-y divide-[#2c2c2c]">
                      {rows.map((row) => (
                        <li className="flex flex-col gap-2 px-4 py-3" key={row.criteria}>
                          <CriteriaTypeBadge type={row.criteria} />
                          <p className="text-[13px] leading-[1.55] text-white/70 [word-break:keep-all]">
                            {row.condition}
                          </p>
                          {row.note ? (
                            <p className="text-[12px] font-medium leading-[1.5] text-[#f87171] [word-break:keep-all]">
                              {row.note}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CriteriaHeader({
  children,
  className,
  colSpan,
  rowSpan,
  width,
}: {
  children: React.ReactNode
  className?: string
  colSpan?: number
  rowSpan?: number
  width?: string
}) {
  return (
    <th
      className={cn(
        'border border-[#444] px-3 py-4 text-center font-bold leading-[1.55] [word-break:keep-all]',
        width,
        className,
      )}
      colSpan={colSpan}
      rowSpan={rowSpan}
      scope="col"
    >
      {children}
    </th>
  )
}

function CriteriaCell({
  children,
  className,
  emphasis = false,
  rowSpan,
}: {
  children: React.ReactNode
  className?: string
  emphasis?: boolean
  rowSpan?: number
}) {
  return (
    <td
      className={cn(
        'whitespace-pre-line border border-[#363636] px-3 py-4 leading-[1.55] [word-break:keep-all]',
        emphasis && 'font-medium text-[#f87171]',
        className,
      )}
      rowSpan={rowSpan}
    >
      {children || '-'}
    </td>
  )
}

function ClassBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold leading-none text-white">
      {children}
    </span>
  )
}

const criteriaTypeMeta = {
  기간: { icon: Clock },
  추천: { icon: ThumbsUp },
  오디션: { icon: ClipboardCheck },
  활동경력: { icon: Clapperboard },
} satisfies Record<string, { icon: typeof Clock }>

function CriteriaTypeBadge({ type }: { type: string }) {
  const meta = (criteriaTypeMeta as Record<string, { icon: typeof Clock } | undefined>)[type]
  const Icon = meta?.icon

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold leading-none text-white/80">
      {Icon ? <Icon aria-hidden="true" size={13} strokeWidth={2} /> : null}
      {type}
    </span>
  )
}

function CohortsPanel() {
  const cohorts = buildCohorts()
  const latestCohort = cohorts[0]

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-[760px]">
        <h2 className="text-[32px] font-extrabold leading-[1.3] md:text-[44px]">기수 안내</h2>
        <p className="mt-7 text-sm leading-[1.85] text-white/50">
          배우앤배움 아트센터에서는 매해 상반기, 하반기로 나누어 배우앤배움
          기수를 부여하고 있습니다. 최초 2010년 상반기 1기가 시작되었으며,
          현재 {latestCohort?.year}년 {latestCohort?.half} 기준 {latestCohort?.number}기까지
          진행중입니다.
        </p>
      </section>

      <CohortTable cohorts={cohorts} />
      <p className="text-xs leading-[1.7] text-white/35">
        상반기 기수는 1월부터 6월 30일까지, 하반기 기수는 7월부터 12월 31일까지
        산정됩니다.
      </p>
    </div>
  )
}

function CohortTable({ cohorts }: { cohorts: CohortRow[] }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <CalendarDays aria-hidden="true" className="text-brand" size={18} />
        <h3 className="text-base font-extrabold leading-none">기수 목록</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#343434] text-white">
              <th className="w-[18%] border border-[#444] px-5 py-4 font-bold" scope="col">
                년도
              </th>
              <th className="w-[22%] border border-[#444] px-5 py-4 font-bold" scope="col">
                입학 분류
              </th>
              <th className="border border-[#444] px-5 py-4 font-bold" scope="col">
                입학 날짜
              </th>
              <th className="w-[18%] border border-[#444] px-5 py-4 font-bold" scope="col">
                기수
              </th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort, index) => {
              const previous = cohorts[index - 1]
              const isFirstOfYear = previous?.year !== cohort.year
              const yearSpan = cohorts.filter((item) => item.year === cohort.year).length

              return (
                <tr className="bg-[#222] text-white/62" key={`${cohort.year}-${cohort.half}`}>
                  {isFirstOfYear ? (
                    <td
                      data-cohort-year="true"
                      className={cn(
                        'border border-[#363636] bg-[#262626] px-5 py-4 font-bold leading-[1.55] text-white/72 [word-break:keep-all]',
                        index % 2 === 1 && 'bg-[#222]',
                      )}
                      rowSpan={yearSpan}
                    >
                      {cohort.year}
                    </td>
                  ) : null}
                  <td className="border border-[#363636] px-5 py-4 leading-[1.55] [word-break:keep-all]">
                    {cohort.half}
                  </td>
                  <td className="border border-[#363636] px-5 py-4 leading-[1.55] [word-break:keep-all]">
                    {cohort.period}
                  </td>
                  <td className="border border-[#363636] px-5 py-4 font-bold leading-[1.55] [word-break:keep-all]">
                    {cohort.number}기
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
