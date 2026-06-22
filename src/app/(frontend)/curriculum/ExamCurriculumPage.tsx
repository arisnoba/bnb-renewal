import Link from 'next/link'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'

type ExamCurriculumPageProps = {
  tab?: string
}

type ExamCurriculumTab = {
  id: string
  intro: string
  label: string
  processItems: ExamCurriculumProcessItem[]
  roadmap: ExamCurriculumRoadmapItem[]
  tracks: ExamCurriculumTrack[]
}

type ExamCurriculumTrack = {
  badge: string
  bullets: string[]
  capacity: string
  lessons: ExamCurriculumLesson[]
  price: string
  title: string
}

type ExamCurriculumLesson = {
  duration: string
  name: string
}

type ExamCurriculumRoadmapItem = {
  period: string
  step: string
  title: string
}

type ExamCurriculumProcessItem = {
  description: string[]
  title: string
}

const commonProcessItems: ExamCurriculumProcessItem[] = [
  {
    description: [
      '담임선생님 수업으로 입시 전반(메인작품/지정작품/서브작품/영화, 드라마)을 책임지며, 학생의 장점을 극대화 시켜 연기 작품을 완성시킵니다.',
      '또한 즉흥연기, 제시대사, 구술면접 등 대학에서 요구하는 모든 것을 준비합니다. 또한 매 월 평가회를 통해 현장경험 할 수 있는 것들을 미리 대비하여 준비합니다.',
    ],
    title: '연기',
  },
  {
    description: [
      '학생의 음역대를 체크한 후, 파트를 정확하게 구별합니다.',
      '개인별 자세교정 및 호흡교정을 통해 1:1 VOICE MASTER 수업을 진행합니다. 기본(호흡, 발성, 음정, 박자)을 극대화 시키고, 뮤지컬 노래에 말을 할 수 있도록 스토리텔링을 공부하고 하나의 뮤지컬장면을 구성하도록 진행합니다.',
    ],
    title: '뮤지컬 연기',
  },
  {
    description: [
      '배우로서 필요한 몸의 기능 및 몸의 밸런스 강화 수업이 진행됩니다.',
      '작품비가 없는 차별화된 1인 맞춤 작품으로 구성하며, 다양한 전공(현대무용, 한국무용, 발레, 재즈댄스, 스트릿댄스, 마임)의 움직임 수업으로 개개인의 다양한 모습이 보여 질 수 있게 완성시킵니다.',
    ],
    title: '무용 연기',
  },
]

const evaluationProcess: ExamCurriculumProcessItem = {
  description: [
    '매 월 중간점검을 위한 평가회를 실시합니다.',
    '학교별 특성을 기반으로 입시에 대한 대응력 강화훈련을 하며, 자신의 장·단점을 파악하여 점검하고 개선하도록 합니다. 또한 평가회를 통해 멘토들과 지원대학 선정 및 대학유형에 따른 집중 개인상담도 진행합니다.',
  ],
  title: '월말평가',
}

const preparatoryTrainingDescriptions = [
  '호흡과 발성 (링클레이터 시스템-알렉산더 테크닉)',
  '마이즈너 테크닉 (충동적으로 연기하는 심리신체에 관한 탐구과정\u2192실현과정\u2192심화과정)',
  '1인/2인 텍스트 창작하기 및 실현 (나-인물에 대한 이해와 확장)',
  '1인/2인 에쮸드 (상상력 창의력 훈련) / 빼빼데(물체없이 행동하기-주의집중)',
]

const examCurriculumTabs: ExamCurriculumTab[] = [
  {
    id: 'exam',
    intro: '평일을 꽉 채운 주특기 특화 수업으로 입시를 처음 하는 입시생을 위한 차별화된 커리큘럼',
    label: '입시반',
    processItems: [
      ...commonProcessItems,
      {
        description: [
          '학생들을 위한 특강을 준비하여 진행합니다.',
          '수업시간 이외의 시간에 입시를 위해 필요한 특강을 진행합니다. 한예종 지정희곡을 포함한 희곡분석특강이 예정되어 있습니다.',
        ],
        title: '특강',
      },
      evaluationProcess,
    ],
    roadmap: [
      { period: '2월~4월', step: '1단계', title: '스파르타 훈련' },
      { period: '5월~10월', step: '2단계', title: '수시 준비' },
      { period: '11월~다음해 1월', step: '3단계', title: '정시 준비' },
    ],
    tracks: [
      {
        badge: '평일 입시반',
        bullets: [
          '주 5회 · 월 60시간',
          '매월 모의고사',
          '저녁 6시 이후 진행',
          '평일 특화 집중 커리큘럼',
          '매월 평가회 실시',
        ],
        capacity: '최대 정원 8명',
        lessons: [
          { duration: '3시간', name: '연기 I' },
          { duration: '3시간', name: '연기 II' },
          { duration: '3시간', name: '연기 III' },
          { duration: '3시간', name: '뮤지컬 연기' },
          { duration: '3시간', name: '무용 연기' },
        ],
        price: '850,000원',
        title: 'Weekday',
      },
      {
        badge: '주말 입시반',
        bullets: [
          '주 4회 · 월 12시간',
          '매월 모의고사',
          '오후 12시 이후 진행',
          '평일 내신관리 병행 학생 대상',
          '지방 거주 / 고3 / 20세 이상',
          '수도권도 신청 가능',
        ],
        capacity: '최대 정원 8명',
        lessons: [
          { duration: '3시간', name: '연기 I' },
          { duration: '3시간', name: '연기 II' },
          { duration: '3시간', name: '뮤지컬 연기' },
          { duration: '3시간', name: '무용 연기' },
        ],
        price: '700,000원',
        title: 'Weekend',
      },
    ],
  },
  {
    id: 'preparatory',
    intro: '미래를 보다 구체적으로 설계하며, 그 실현을 위해 조기에 선행하여 준비를 할 수 있게 하는 커리큘럼',
    label: '예비 입시반',
    processItems: [
      ...commonProcessItems,
      {
        description: preparatoryTrainingDescriptions,
        title: '훈련',
      },
      evaluationProcess,
    ],
    roadmap: [
      { period: '2월~4월', step: '1단계', title: '기초 연기 훈련' },
      { period: '5월~10월', step: '2단계', title: '중급 연기 훈련' },
      { period: '11월~12월', step: '3단계', title: '고급 연기(입시 체험)' },
      { period: '다음해 1월~2월', step: '최종 입시반', title: '승급 모의 테스트' },
    ],
    tracks: [
      {
        badge: '예비 입시반',
        bullets: [
          '주 3회 · 월 24시간',
          '매월 모의고사',
          '주말반 운영',
          '오후 12시~저녁 6시 진행',
          '1~2월: 고3 입시반 출강 평가 선행',
        ],
        capacity: '최대 정원 8-10명',
        lessons: [
          { duration: '2시간', name: '연기 I' },
          { duration: '2시간', name: '뮤지컬 연기' },
          { duration: '2시간', name: '무용 연기' },
        ],
        price: '450,000원',
        title: 'Preparatory',
      },
    ],
  },
  {
    id: 'arts-high',
    intro: '배우의 꿈을 갖고, 예술고등학교 진학을 희망하는 학생들을 위한 기초부터 착실히 준비하는 커리큘럼',
    label: '예고 입시반',
    processItems: [
      ...commonProcessItems,
      {
        description: preparatoryTrainingDescriptions,
        title: '훈련',
      },
      {
        description: [
          '매 월 중간점검을 위한 평가회를 실시합니다.',
          '학교별 특성을 기반으로 입시에 대한 대응력 강화훈련을 하며, 자신의 장·단점을 파악하여 점검하고 개선하도록 합니다.',
        ],
        title: '모의평가 및 특강',
      },
    ],
    roadmap: [
      { period: '3월~5월', step: '1단계 기초트레이닝', title: '즉흥 상황 및 감각 훈련' },
      { period: '5월~7월', step: '2단계 업그레이드', title: '독백 연기 훈련' },
      { period: '7월~10월', step: '3단계 지원 학교별 심화준비', title: '독백 구성' },
    ],
    tracks: [
      {
        badge: '예고 입시반',
        bullets: [
          '주 4회 · 월 48시간',
          '모의평가 및 특강',
          '중등부 1,2,3학년 대상',
          '예술고등학교 진학 희망자',
          '주말집중 수업 구성',
        ],
        capacity: '최대 정원 8명',
        lessons: [
          { duration: '3시간', name: '연기 I, 기초 트레이닝' },
          { duration: '3시간', name: '연기 II, 즉흥 및 독백훈련' },
          { duration: '3시간', name: '뮤지컬, 보컬 연기' },
          { duration: '3시간', name: '무용, 움직임 연기' },
        ],
        price: '700,000원',
        title: 'Preparatory',
      },
    ],
  },
]

const heroDecoIcons = getPageDecoIcons(2, 'exam-curriculum-hero')

export function ExamCurriculumPage({ tab }: ExamCurriculumPageProps) {
  const activeTab = resolveActiveTab(tab)

  return (
    <main className="page page-dark page-curriculum page-curriculum--exam bg-[#0C0C0C]" data-center="exam">
      <section
        aria-labelledby="exam-curriculum-hero-title"
        className="section-exam-curriculum-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70 grayscale"
          style={{ backgroundImage: "url('/assets/curriculum/hero.png')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/72" />
        <PageDeco
          className="-left-56 top-[48%] max-md:hidden! lg:-left-72"
          icon={heroDecoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:hidden! md:right-[-104px]"
          icon={heroDecoIcons[1]}
        />

        <div className="container relative z-10 flex min-h-140 items-end pb-20 md:min-h-200 md:pb-35">
          <h1
            className="section-exam-curriculum-hero__title type-display-l font-bold leading-[1.2] text-white md:type-display-xl"
            id="exam-curriculum-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">커리큘럼</span>
          </h1>
        </div>
      </section>

      <section className="section-exam-curriculum-body section-p-block-base text-white">
        <div className="container">
          <nav
            aria-label="입시 커리큘럼 탭"
            className="section-exam-curriculum-tabs flex gap-12 overflow-x-auto border-b border-white/10"
          >
            {examCurriculumTabs.map((item) => {
              const isActive = item.id === activeTab.id

              return (
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'section-exam-curriculum-tabs__item shrink-0 border-b-2 px-1 pb-5 type-label-m font-bold transition-colors',
                    isActive
                      ? 'border-brand text-brand'
                      : 'border-transparent text-white/35 hover:text-white',
                  ].join(' ')}
                  href={item.id === 'exam' ? '/exam/curriculum' : `/exam/curriculum?tab=${item.id}`}
                  key={item.id}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <h2 className="section-exam-curriculum-body__intro mt-16 max-w-3xl type-headline-m font-bold leading-[1.35] text-white md:mt-20 md:type-headline-l">
            {activeTab.intro}
          </h2>

          <div className="section-exam-curriculum-tracks mt-14 flex flex-col gap-16 md:mt-18">
            {activeTab.tracks.map((track) => (
              <ExamCurriculumTrackCard key={track.badge} track={track} />
            ))}
          </div>

          <ExamCurriculumRoadmap items={activeTab.roadmap} />
          <ExamCurriculumProcess items={activeTab.processItems} />
        </div>
      </section>
    </main>
  )
}

function ExamCurriculumTrackCard({ track }: { track: ExamCurriculumTrack }) {
  return (
    <article className="section-exam-curriculum-track grid bg-white/6 grid-cols-1 md:grid-cols-3">
      <aside className="section-exam-curriculum-track__summary flex flex-col p-8 md:col-span-1 md:p-12">
        <span className="section-exam-curriculum-track__badge w-fit rounded-full border border-brand/70 px-3 py-1 type-caption-s font-bold text-brand">
          {track.badge}
        </span>
        <h3 className="mt-6 type-headline-m font-medium leading-[1.15] text-white">
          {track.title}
        </h3>
        <p className="mt-3 type-body-m font-medium text-white/40">{track.capacity}</p>

        <ul className="mt-12 space-y-3 border-t border-white/10 pt-8 type-body-m font-medium leading-[1.6] text-white/45">
          {track.bullets.map((bullet) => (
            <li key={bullet}>· {bullet}</li>
          ))}
        </ul>

        <p className="mt-12 border-t border-white/10 pt-8">
          <span className="type-headline-m font-medium leading-none text-white">{track.price}</span>
          <span className="ml-2 type-caption-m font-bold text-white/70">원/월</span>
        </p>
      </aside>

      <div className="section-exam-curriculum-track__lessons flex flex-col border-t border-white/10 md:border-l md:border-t-0 md:col-span-2">
        {track.lessons.map((lesson, index) => (
          <div
            className="section-exam-curriculum-lesson flex min-h-20 flex-1 items-center justify-between gap-6 border-b border-white/8 px-8 last:border-b-0 md:min-h-0 md:px-12"
            key={`${lesson.name}-${index}`}
          >
            <div className="flex min-w-0 items-center gap-6">
              <span className="section-exam-curriculum-lesson__index inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-brand/70 type-caption-s font-bold text-brand">
                {index + 1}회
              </span>
              <p className="type-title-s font-bold leading-[1.35] text-white">
                {lesson.name}
              </p>
            </div>
            <p className="shrink-0 type-caption-m font-semibold text-white/45">{lesson.duration}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

function ExamCurriculumRoadmap({ items }: { items: ExamCurriculumRoadmapItem[] }) {
  return (
    <section
      aria-labelledby="exam-curriculum-roadmap-title"
      className="section-exam-curriculum-roadmap mt-20 md:mt-24"
    >
      <h2
        className="section-exam-curriculum-roadmap__title type-title-s font-bold text-white"
        id="exam-curriculum-roadmap-title"
      >
        단계별 로드맵
      </h2>
      <ol className="section-exam-curriculum-roadmap__list mt-8 flex flex-col gap-1 md:flex-row md:flex-nowrap">
        {items.map((item) => (
          <li
            className="section-exam-curriculum-roadmap__item bg-white/6 px-6 py-8 text-center md:min-w-0 md:flex-1 md:basis-0"
            key={`${item.step}-${item.title}`}
          >
            <p className="type-body-m font-bold text-brand">{item.step}</p>
            <h3 className="mt-2 type-title-s font-bold leading-[1.35] text-white">
              {item.title}
            </h3>
            <p className="mt-2 type-caption-m font-semibold text-white/35">{item.period}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ExamCurriculumProcess({ items }: { items: ExamCurriculumProcessItem[] }) {
  return (
    <section
      aria-labelledby="exam-curriculum-process-title"
      className="section-exam-curriculum-process mt-20 md:mt-24"
    >
      <h2
        className="section-exam-curriculum-process__title type-title-s font-bold text-white"
        id="exam-curriculum-process-title"
      >
        교육과정
      </h2>
      <div className="section-exam-curriculum-process__list mt-8 border-t border-white/10">
        {items.map((item) => (
          <section
            className="section-exam-curriculum-process-item grid gap-6 border-b border-white/10 py-10 md:grid-cols-[200px_minmax(0,1fr)] md:py-14"
            key={item.title}
          >
            <h3 className="section-exam-curriculum-process-item__title type-title-s font-bold text-brand">
              {item.title}
            </h3>
            <div className="section-exam-curriculum-process-item__description flex flex-col space-y-2 type-body-s font-medium leading-[1.7] text-white/45">
              {item.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function resolveActiveTab(tab: string | undefined) {
  return examCurriculumTabs.find((item) => item.id === tab) ?? examCurriculumTabs[0]
}
