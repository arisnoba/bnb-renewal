'use client'

import { BarChart3, BookOpenCheck, CalendarDays, ClipboardCheck, Medal, Target } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utilities/ui'

type TabKey = 'steps' | 'criteria' | 'cohorts'

const tabs = [
  { key: 'steps', label: '단계별 교육' },
  { key: 'criteria', label: '등급·심사 기준' },
  { key: 'cohorts', label: '기수 안내' },
] satisfies Array<{ key: TabKey; label: string }>

const classes = [
  {
    className: 'I Class',
    description: '기초 연기와 감각 훈련을 통해 카메라 앞에서 자신을 인식하는 단계입니다.',
    goals: ['기본 호흡과 발성', '대본 읽기와 상황 이해', '카메라 적응'],
    icon: BookOpenCheck,
    title: '기초를 세우는 입문 과정',
  },
  {
    className: 'R Class',
    description: '개인별 강점과 약점을 분석하고 장면 훈련으로 표현 범위를 넓히는 단계입니다.',
    goals: ['캐릭터 분석', '장면 연기', '피드백 반영'],
    icon: Target,
    title: '반복 훈련으로 완성도를 높이는 과정',
  },
  {
    className: 'U Class',
    description: '오디션과 촬영 현장에 필요한 선택, 집중, 대응 능력을 체계적으로 다듬습니다.',
    goals: ['오디션 독백', '상대 연기', '즉흥 대응'],
    icon: ClipboardCheck,
    title: '실전 감각을 만드는 심화 과정',
  },
  {
    className: 'D Class',
    description: '프로필, 오디션, 캐스팅을 연결해 현장 진입을 준비하는 고급 단계입니다.',
    goals: ['캐스팅 대응', '촬영 매너', '현장형 연기'],
    icon: Medal,
    title: '현장 진입을 준비하는 실전 과정',
  },
  {
    className: 'A Class',
    description: '아티스트로서 필요한 자기관리와 작품 선택 역량까지 함께 점검합니다.',
    goals: ['작품 분석', '오디션 전략', '커리어 관리'],
    icon: BarChart3,
    title: '데뷔와 활동을 바라보는 최종 과정',
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

  function selectTab(tab: TabKey) {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#${tab}`)
  }

  return (
    <section className="bg-[#111] text-white">
      <div className="container py-14 md:py-20">
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
    <div className="flex flex-col gap-16 md:gap-20">
      <section className="max-w-[860px]">
        <p className="mb-6 text-sm font-semibold leading-none text-brand">IRUDA</p>
        <h2 className="max-w-[1080px] text-[34px] font-extrabold leading-[1.25] tracking-normal [word-break:keep-all] md:text-[44px]">
          IRUDA 연기트레이닝 시스템입니다.
          <br />
          아트센터의 모든 교육은 ‘나’로부터 시작됩니다.
        </h2>
        <p className="mt-8 max-w-[720px] text-base leading-[1.8] text-white/55">
          I am Ready to Undertake the Dedication of Acting. 배우앤배움 아트센터는
          기초부터 실전까지 단계별 수업과 평가를 통해 배우의 가능성을 구체적인
          성장으로 이어갑니다.
        </p>
      </section>

      <div aria-hidden="true" className="grid grid-cols-5 gap-2 opacity-20 md:gap-4">
        {['I', 'R', 'U', 'D', 'A'].map((letter) => (
          <span className="text-[24vw] font-black leading-[0.75] md:text-[170px]" key={letter}>
            {letter}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-12">
        {classes.map((item, index) => (
          <ClassSection index={index + 1} item={item} key={item.className} />
        ))}
      </div>
    </div>
  )
}

function ClassSection({
  index,
  item,
}: {
  index: number
  item: (typeof classes)[number]
}) {
  const Icon = item.icon

  return (
    <section className="border-t border-white/10 pt-10">
      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex items-start gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-xs font-black text-white">
            {index}
          </span>
          <h3 className="text-base font-extrabold leading-[1.4]">{item.className}</h3>
        </div>
        <div>
          <h4 className="text-xl font-extrabold leading-[1.45]">{item.title}</h4>
          <p className="mt-5 max-w-[780px] text-sm leading-[1.8] text-white/50">{item.description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {item.goals.map((goal) => (
              <div className="min-h-[132px] bg-[#202020] p-6" key={goal}>
                <Icon aria-hidden="true" className="mb-8 text-white/25" size={22} strokeWidth={1.8} />
                <p className="text-base font-bold leading-[1.45]">{goal}</p>
                <p className="mt-3 text-xs leading-[1.6] text-white/38">
                  개별 피드백과 반복 훈련을 통해 다음 단계로 연결합니다.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
      <div className="overflow-x-auto">
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
              <CriteriaHeader colSpan={4}>승급 및 지원 기준</CriteriaHeader>
            </tr>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader>본학원</CriteriaHeader>
              <CriteriaHeader>타학원</CriteriaHeader>
              <CriteriaHeader>전공자</CriteriaHeader>
              <CriteriaHeader>경력 인정자</CriteriaHeader>
            </tr>
          </thead>
          <tbody>
            {adultGradeRows.map((row, index) => (
              <tr className="bg-[#222] text-white/55" key={`${index}-${row.className}`}>
                {row.process ? (
                  <CriteriaCell
                    className="bg-[#333] font-medium text-white"
                    rowSpan={row.processSpan}
                  >
                    {row.process}
                  </CriteriaCell>
                ) : null}
                <CriteriaCell>{row.className}</CriteriaCell>
                <CriteriaCell>{row.level}</CriteriaCell>
                <CriteriaCell>{row.department}</CriteriaCell>
                <CriteriaCell emphasis>{row.inHouse}</CriteriaCell>
                <CriteriaCell>{row.transfer}</CriteriaCell>
                <CriteriaCell>{row.major}</CriteriaCell>
                <CriteriaCell emphasis={row.experience.includes('연기상')}>{row.experience}</CriteriaCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PromotionTable() {
  return (
    <section>
      <h3 className="mb-5 text-base font-extrabold leading-none">성인 승급 기준</h3>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-center text-[12px] md:text-[13px]">
          <thead>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader width="w-[7%]">과정</CriteriaHeader>
              <CriteriaHeader width="w-[13%]">구분</CriteriaHeader>
              <CriteriaHeader width="w-[14%]">승급 Class</CriteriaHeader>
              <CriteriaHeader width="w-[12%]">승급기준</CriteriaHeader>
              <CriteriaHeader width="w-[30%]">승급 조건</CriteriaHeader>
              <CriteriaHeader>비고 사항</CriteriaHeader>
            </tr>
          </thead>
          <tbody>
            {promotionGroups.map((group) =>
              group.rows.map((row, index) => {
                const typeSpan = group.rows.filter((item) => item.type === row.type).length
                const firstOfType = group.rows.findIndex((item) => item.type === row.type) === index

                return (
                  <tr className="bg-[#222] text-white/55" key={`${group.process}-${row.type}-${row.criteria}`}>
                    {index === 0 ? (
                      <CriteriaCell
                        className="bg-[#333] font-medium text-white"
                        rowSpan={group.rows.length}
                      >
                        {group.process}
                      </CriteriaCell>
                    ) : null}
                    {firstOfType ? (
                      <>
                        <CriteriaCell rowSpan={typeSpan}>{row.type}</CriteriaCell>
                        <CriteriaCell rowSpan={typeSpan}>
                          <span className="mr-2">{row.target}</span>
                          <ClassBadge>{row.targetClass}</ClassBadge>
                        </CriteriaCell>
                      </>
                    ) : null}
                    <CriteriaCell className={row.criteria === '활동경력' ? 'bg-[#333]' : undefined}>
                      {row.criteria}
                    </CriteriaCell>
                    <CriteriaCell>{row.condition}</CriteriaCell>
                    <CriteriaCell emphasis>{row.note}</CriteriaCell>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
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
