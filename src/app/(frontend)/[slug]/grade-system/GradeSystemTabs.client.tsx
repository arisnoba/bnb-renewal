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
import type { LucideIcon } from 'lucide-react'
import NextImage from 'next/image'
import { useEffect, useState } from 'react'

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import type { CenterSlug } from '@/lib/centers'
import { cn } from '@/utilities/ui'

type TabKey = 'steps' | 'criteria' | 'cohorts'
type GradeSystemCenter = Extract<CenterSlug, 'art' | 'highteen' | 'kids'>
type CriteriaEntryKey = 'experience' | 'inHouse' | 'major' | 'transfer'

type StepCard = {
  icon: LucideIcon
  items: string[]
  title: string
}

type StepClass = {
  cards: StepCard[]
  className: string
  description: string
  details?: Array<{ label: string; value: string }>
  headline: string
  label: string
  letter: string
}

type GradeRow = {
  classCode: string
  className: string
  department: string
  experience: string
  inHouse: string
  level: string
  major: string
  process: string
  transfer: string
}

type PromotionGroup = {
  from: PromotionClass
  rows: PromotionRow[]
  to: PromotionClass
}

type PromotionClass = {
  classCode: string
  label: string
}

type PromotionRow = {
  condition: string
  method: '기간' | '오디션' | '추천' | '활동경력'
  note: string
}

type IrudaLetter = {
  className: string
  fileNames: string[]
}

type GradeSystemContent = {
  centerName: string
  cohortStartYear: number
  criteriaDescription: string
  criteriaEntryLabels: Array<{ key: CriteriaEntryKey; label: string }>
  criteriaTitle: string
  extraPromotionCriteria?: string[]
  gradeRows: GradeRow[]
  gradeTableDescription: string
  gradeTableTitle: string
  promotionGroups?: PromotionGroup[]
  promotionTitle?: string
  stepClasses: StepClass[]
  stepsDescriptionLines?: string[]
  stepsCenterName: string
  stepsTitleLines?: string[]
  wordmarkLetters: IrudaLetter[]
}

const tabs = [
  { key: 'steps', label: '단계별 교육' },
  { key: 'criteria', label: '등급 · 심사 기준' },
  { key: 'cohorts', label: '기수 안내' },
] satisfies Array<{ key: TabKey; label: string }>

const gradeAssetBase = '/assets/art/grade-system'
const gradeSystemDecoIcons = getPageDecoIcons(4, 'grade-system')
const kidsOverviewDecoIcons = [
  'icon-b.svg',
  'icon-ae.svg',
  'icon-ng.svg',
  'icon-u.svg',
  'icon-m.svg',
] as const

const artStepClasses = [
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

const highteenStepClasses = [
  {
    className: 'I Class',
    cards: [
      {
        icon: Speech,
        items: ['호흡/발성/딕션/템포&리듬/억양/성량 훈련', '글에 감정을 넣는 훈련', '대본을 분석하고 단락을 나눠 띄어읽기 훈련'],
        title: '화술 훈련',
      },
      {
        icon: Heart,
        items: ['정서적 경험과 체험을 표현하기', '대본에서 감정의 디테일 찾기', '대본을 분석하고 단락을 나눠 띄어읽기 훈련'],
        title: '감정 훈련',
      },
      {
        icon: ScanFace,
        items: ['자세와 몸 컨트롤 훈련', '올바른 자세에서 카메라 앞에 서는 훈련', '액션/리액션 및 제스처 훈련'],
        title: '신체 훈련',
      },
    ],
    description: '관찰력, 상상력, 집중력, 표현력의 기초를 다지며 배우로 성장하기 위한 출발점을 만듭니다.',
    details: [
      { label: '인원', value: '정원 8명' },
      { label: '수업시간', value: '주 1회 3시간, 주 2회 총 4시간' },
      { label: '과정', value: '관찰력/상상력/집중력/표현력 훈련' },
    ],
    headline: '배우를 꿈꾸다 Dream Of Actor',
    label: '입문 I Class',
    letter: 'I',
  },
  {
    className: 'R Class',
    cards: [
      {
        icon: Brain,
        items: ['정서에 연관된 텍스트를 가지고 독백연기 진행', '상황극을 통해 경험하지 못한 새로운 감정과 표현 도출', '2인극 및 상황극을 통해 서로 부딪치는 감정훈련'],
        title: '심화 감정 훈련',
      },
      {
        icon: FileText,
        items: ['대본 전체 파악 방법 및 분석 방법 배우기', '대본에서의 상황 및 인물 분석 방법 알아보기'],
        title: '대본 이해와 분석',
      },
      {
        icon: Drama,
        items: ['자신의 이미지에 맞는 상황별 독백 준비', '모의 오디션 및 오디션 과정 시뮬레이션 훈련', '지정 대본 훈련'],
        title: '오디션 독백',
      },
    ],
    description: '장면을 이해하고 에쭈드와 이미지 트레이닝을 통해 자기 표현의 폭을 넓히는 중급 과정입니다.',
    details: [
      { label: '인원', value: '정원 8명' },
      { label: '수업시간', value: '주 1회 3시간, 주 2회 4시간' },
      { label: '과정', value: '장면 이해/에쭈드/이미지 트레이닝' },
    ],
    headline: '배우를 그리다 Sketch The Actor',
    label: '중급 R Class',
    letter: 'R',
  },
  {
    className: 'U Class',
    cards: [
      {
        icon: FileText,
        items: ['대사의 감정선 파악과 연기의 기승전결 구성하기', '캐릭터의 이해와 성격구축'],
        title: '대본 & 대사 집중 훈련',
      },
      {
        icon: Monitor,
        items: ['카메라, 대본, 현장 용어 이해하기', '모니터링을 통해 연기의 디테일을 잡는 방법과 표현 구체화하기', '시선, 제스처, 더블액션 훈련'],
        title: '카메라 연기',
      },
      {
        icon: Sparkles,
        items: ['자신만의 매력을 찾아서 캐릭터 구축하기', '대본 안에 캐릭터를 매력있게 표현하기'],
        title: '매력 개발',
      },
    ],
    description: '카메라와 현장을 이해하고, 이미지 메이킹을 통해 캐릭터 표현의 완성도를 높이는 심화 과정입니다.',
    details: [
      { label: '인원', value: '정원 8명' },
      { label: '수업시간', value: '주 1회 3시간, 주 2회 4시간' },
      { label: '과정', value: '카메라 이해/현장 이해/이미지 메이킹' },
    ],
    headline: '배우를 만들다 Make An Actor',
    label: '심화 U Class',
    letter: 'U',
  },
  {
    className: 'DA Class',
    cards: [
      {
        icon: ClipboardCheck,
        items: ['상황별(드라마/영화/광고) 테크닉 훈련', '오디션을 통한 개인별 연기스타일 특징 분석', '현재 연기 트렌드 분석 및 적용'],
        title: '오디션 훈련',
      },
      {
        icon: Drama,
        items: ['완성된 연기에 캐릭터 및 테크닉 교정', '단일감정이 아닌 복합적 감정 테크닉 훈련'],
        title: '심화 연기 교정',
      },
      {
        icon: Clapperboard,
        items: ['자유연기 및 출연 장면 모니터링 후 연기의 디테일 교정', '시선, 제스처, 디테일 표정 분석 및 호흡 교정', '배역들에 맞게 디테일한 이미지 메이킹'],
        title: '심화 카메라 & 모니터링 훈련',
      },
    ],
    description: '오디션 테크닉, 다양한 감정 표현, 카메라 심화 훈련을 통해 배우의 이미지를 디자인하는 전문 과정입니다.',
    details: [
      { label: '인원', value: '정원 8명' },
      { label: '수업시간', value: '주 1회 3시간, 주 2회 4시간' },
      { label: '과정', value: '오디션 테크닉/다양한 감정 표현/카메라 심화 훈련' },
    ],
    headline: '배우를 디자인하다 Design An Actor',
    label: '전문 DA Class',
    letter: 'DA',
  },
] satisfies StepClass[]

const kidsStepClasses = [
  {
    className: '영재교육 Class',
    cards: [
      {
        icon: Sparkles,
        items: ['역할놀이를 통한 흥미 유발', '상황극을 통한 창의력, 상상력, 관찰력 훈련'],
        title: '놀이 훈련',
      },
      {
        icon: Speech,
        items: ['개인별 화술적 습관 분석 및 교정', '화술 훈련 [소리, 발음교정]'],
        title: '화술 훈련',
      },
      {
        icon: ScanFace,
        items: ['신체적으로 몸을 활용하는 방법 및 훈련', '기초 신체훈련을 통해 경직된 몸을 이완시키는 훈련'],
        title: '신체 훈련',
      },
    ],
    description:
      '아이들이 상상하고 이해한 것을 자신의 색깔로 표현할 수 있도록 이해하기, 말하기, 움직이기, 표현하기의 기초를 다지는 과정입니다. 모든 수업이 종료된 후에는 학부모님께 수업 관련 피드백을 드립니다.',
    details: [
      { label: '인원', value: '정원 6명' },
      { label: '수업시간', value: '주 1회 2-3시간' },
      { label: '과정', value: '이해하기/말하기/움직이기/표현하기' },
    ],
    headline: '영재교육 Class',
    label: '초급',
    letter: '1',
  },
  {
    className: '아역배우 Class',
    cards: [
      {
        icon: Drama,
        items: ['다양한 상황극을 통해 경험하지 못한 새로운 감정과 표현 도출', '반복적인 상황극 훈련을 통해 정형화되지 않은 유연한 연기 유도', "2인극을 통해 주고받는 '액션'과 '리액션' 훈련"],
        title: '심화 연기훈련',
      },
      {
        icon: Video,
        items: ['카메라를 이용한 연기수업', '모니터링을 통해 연기의 디테일을 잡는 방법과 표현 구체화'],
        title: '카메라연기',
      },
      {
        icon: FileText,
        items: ['대본 전체 파악하는 방법 배우기', '대본의 상황과 인물 분석 방법 알아보기'],
        title: '대본 이해와 분석',
      },
      {
        icon: ClipboardCheck,
        items: ['자신에게 맞는 상황별 독백을 통해 오디션 준비', '오디션에서 이루어지는 과정 시뮬레이션 훈련'],
        title: '오디션 독백 준비',
      },
    ],
    description:
      '감정훈련, 반응하기, 대본분석, 독백연기를 통해 아이가 장면 안에서 상대와 반응하며 표현의 폭을 넓히는 중급 과정입니다. 모든 수업이 종료된 후에는 학부모님께 수업 관련 피드백을 드립니다.',
    details: [
      { label: '인원', value: '정원 6명' },
      { label: '수업시간', value: '주 1회 2-3시간' },
      { label: '과정', value: '감정훈련/반응하기/대본분석/독백연기' },
    ],
    headline: '아역배우 Class',
    label: '중급',
    letter: '2',
  },
  {
    className: '아티스트 Class',
    cards: [
      {
        icon: Users,
        items: ['완성된 연기에 캐릭터의 색깔과 매력 입히기', '1차원적인 표현이 아닌 복합적인 감정을 통해 표현하기'],
        title: '심화 연기 디테일 교정',
      },
      {
        icon: ClipboardCheck,
        items: ['오디션을 통한 개인별 연기 스타일, 특징 분석', '오디션 장르별 맞춤 전략'],
        title: '오디션 훈련',
      },
      {
        icon: Monitor,
        items: ['모니터링을 통해 연기의 디테일을 잡는 방법과 액팅 리뷰', '시선, 제스처, 비즈니스, 디테일 표정 분석 및 교정'],
        title: '카메라 훈련/모니터링 훈련',
      },
    ],
    description:
      '인물창조, 디테일 작업, 심화 카메라연기, 현장 피드백을 통해 현장 투입을 염두에 둔 고급 표현력을 완성하는 과정입니다. 모든 수업이 종료된 후에는 학부모님께 수업 관련 피드백을 드립니다.',
    details: [
      { label: '인원', value: '정원 6명' },
      { label: '수업시간', value: '주 1회 2-3시간' },
      { label: '과정', value: '인물창조/디테일작업/심화 카메라연기/현장 피드백' },
    ],
    headline: '아티스트 교육과정',
    label: '고급',
    letter: '3',
  },
] satisfies StepClass[]

const artGradeRows = [
  {
    classCode: 'I',
    className: 'I Class',
    department: '교육본부',
    experience: '',
    inHouse: '연기 처음인 자',
    level: '초급',
    major: '',
    process: '배움',
    transfer: '1~4개월 이수자',
  },
  {
    classCode: 'R',
    className: 'R Class',
    department: '교육본부',
    experience: '',
    inHouse: 'I Class 승급자\n* 외부작품 오디션은 R Class부터 응시 가능합니다.',
    level: '중급',
    major: '- 2~4년제 전공자 중 1학년 이상 재학/휴학자\n- 레벨 테스트',
    process: '배움',
    transfer: '5개월 이상 이수자 중 레벨 테스트',
  },
  {
    classCode: 'U',
    className: 'U Class',
    department: '교육본부\n매니지먼트본부\n광고에이전시본부',
    experience: '',
    inHouse: '- R Class 승급자\n- 매니지먼트 위탁배우',
    level: '고급',
    major: '- 2~4년제 전공자 중 2학년 이상 재학/휴학자\n- 레벨 테스트',
    process: '배움',
    transfer: '12개월 이상 이수자 중 레벨 테스트',
  },
  {
    classCode: 'D',
    className: 'D Class',
    department: '매니지먼트본부\n광고에이전시본부\n드라마캐스팅본부',
    experience: '- 드라마, 영화 조/단역 이상\n- 뮤지컬/연극 출연\n* 학교 작품 제외',
    inHouse: 'U Class 승급자',
    level: '전문',
    major: '- 4년제 전공자 (서울예대포함) 중 3학년 이상 이수자/졸업자\n- 레벨 테스트\n- 매니지먼트본부 추천',
    process: '배우',
    transfer: '- 18개월 이상 이수자 중 경력 인정자\n- 레벨 테스트\n- 매니지먼트본부 추천',
  },
  {
    classCode: 'A',
    className: 'A Class',
    department: '매니지먼트본부\n광고에이전시본부\n드라마캐스팅본부\n대표이사 특별관리',
    experience:
      '- 드라마, 영화 조/단역 이상\n- 뮤지컬/연극 다수 출연\n- 독립영화제 및 연극제 연기상 수상자',
    inHouse: 'D Class 승급자',
    level: '배우',
    major: '- 4년제 전공자 (서울예대포함)졸업자 중 경력인정자\n- 레벨 테스트\n- 매니지먼트본부 추천',
    process: '배우',
    transfer: '- 24개월 이상 이수자 중 경력인정자\n- 레벨 테스트\n- 드라마캐스팅본부 추천',
  },
] satisfies GradeRow[]

const artCriteriaEntryLabels = [
  { key: 'inHouse', label: '본학원' },
  { key: 'transfer', label: '타학원' },
  { key: 'major', label: '전공자' },
  { key: 'experience', label: '경력 인정자' },
] satisfies GradeSystemContent['criteriaEntryLabels']

const highteenCriteriaEntryLabels = [
  { key: 'inHouse', label: '지원 기준' },
  { key: 'transfer', label: '추가 기준' },
  { key: 'major', label: '레벨 테스트' },
] satisfies GradeSystemContent['criteriaEntryLabels']

const highteenGradeRows = [
  {
    classCode: 'I',
    className: 'I Class',
    department: '교육 본부\n매니지먼트 본부\n드라마 캐스팅 본부',
    experience: '',
    inHouse: '연기 처음인 자',
    level: '입문',
    major: '',
    process: '배우 과정',
    transfer: '',
  },
  {
    classCode: 'R',
    className: 'R Class',
    department: '교육 본부\n매니지먼트 본부\n드라마 캐스팅 본부',
    experience: '',
    inHouse: 'I Class 승급자\n* 외부작품 오디션은 R Class부터 응시 가능합니다.',
    level: '중급',
    major: '레벨 테스트',
    process: '심화 과정',
    transfer: '타학원 8개월 이상 이수자',
  },
  {
    classCode: 'U',
    className: 'U Class',
    department: '교육 본부\n매니지먼트 본부\n드라마 캐스팅 본부',
    experience: '',
    inHouse: 'R Class 승급자',
    level: '심화',
    major: '레벨 테스트',
    process: '심화 과정',
    transfer: '- 매니지먼트 위탁 아역배우\n- 드라마/영화/연극 경력자',
  },
  {
    classCode: 'DA',
    className: 'DA Class',
    department: '교육 본부\n매니지먼트 본부\n드라마 캐스팅 본부',
    experience: '',
    inHouse: 'U Class 승급자',
    level: '전문',
    major: '레벨 테스트',
    process: '전문 과정',
    transfer: '- 매니지먼트 위탁 아역배우\n- 드라마/영화/연극 경력자',
  },
] satisfies GradeRow[]

const kidsCriteriaEntryLabels = [
  { key: 'inHouse', label: '지원 기준' },
  { key: 'transfer', label: '추가 기준' },
  { key: 'major', label: '테스트 기준' },
] satisfies GradeSystemContent['criteriaEntryLabels']

const kidsGradeRows = [
  {
    classCode: '영재 교육',
    className: '영재 교육과정',
    department: '교육 본부',
    experience: '',
    inHouse: '- 연기 처음인 아이\n- 짧게 연기를 접한 아이',
    level: '초급',
    major: '',
    process: '배움과정',
    transfer: '',
  },
  {
    classCode: '아역 배우',
    className: '아역배우 교육과정',
    department: '교육 본부\n매니지먼트 본부\n드라마 캐스팅 본부',
    experience: '',
    inHouse: '영재 교육과정 이수자',
    level: '중급',
    major: '카메라 테스트',
    process: '배우과정',
    transfer: '- 타학원에서 1년 이상 이수자\n- 드라마, 영화 등 현장촬영 경험자',
  },
  {
    classCode: '아티스트',
    className: '아티스트 교육과정',
    department: '교육 본부\n매니지먼트 본부\n드라마 캐스팅 본부',
    experience: '',
    inHouse: '- 드라마, 영화 주·조연 이상 경력 인정자\n- 즉시 현장 투입 가능한 아이',
    level: '고급',
    major: '카메라 테스트',
    process: '배우과정',
    transfer: '',
  },
] satisfies GradeRow[]

const artPromotionGroups = [
  {
    from: { classCode: 'I', label: 'I 초급' },
    rows: [
      {
        condition: '초급반 4개월 이수 시 승급',
        method: '기간',
        note: '',
      },
      {
        condition: '교육본부 추천/강사진 추천',
        method: '추천',
        note: '이수 기간 상관없이 승급',
      },
    ],
    to: { classCode: 'R', label: 'R 중급' },
  },
  {
    from: { classCode: 'R', label: 'R 중급' },
    rows: [
      {
        condition: '중급반 6-10개월 이수',
        method: '기간',
        note: '승급대상 선정',
      },
      {
        condition: '교육본부, 매니지먼트본부, 강사진 추천',
        method: '추천',
        note: '이수 기간 상관없이 승급',
      },
      {
        condition: '교육본부 심사결과',
        method: '오디션',
        note: '이수 기간 상관없이 승급',
      },
    ],
    to: { classCode: 'U', label: 'U 고급' },
  },
  {
    from: { classCode: 'U', label: 'U 고급' },
    rows: [
      {
        condition: '고급반 6-10개월 이수',
        method: '기간',
        note: '승급대상 선정',
      },
      {
        condition: '교육본부, 매니지먼트본부, 강사진 추천',
        method: '추천',
        note: '6개월이상 이수자 중 추천',
      },
      {
        condition: '교육, 매니지먼트, 드라마캐스팅 본부 심사결과',
        method: '오디션',
        note: '이수 기간 상관없이 승급',
      },
      {
        condition: '드라마, 영화 조/단역 이상 출연',
        method: '활동경력',
        note: '이수 기간 상관없이 승급',
      },
    ],
    to: { classCode: 'D', label: 'D 전문' },
  },
  {
    from: { classCode: 'D', label: 'D 전문' },
    rows: [
      {
        condition: '전문반 6-10개월 이수',
        method: '기간',
        note: '승급대상 선정',
      },
      {
        condition: '대표원장, 캐스팅디렉터, 매니지먼트본부 추천',
        method: '추천',
        note: '6개월이상 이수자 중 추천',
      },
      {
        condition: '매니지먼트본부, 드라마캐스팅본부, 대표이사 심사결과',
        method: '오디션',
        note: '이수 기간 상관없이 승급',
      },
      {
        condition: '드라마, 영화 조연급 이상 다수 출연',
        method: '활동경력',
        note: '이수 기간 상관없이 승급',
      },
    ],
    to: { classCode: 'A', label: 'A 배우' },
  },
] satisfies PromotionGroup[]

const highteenPromotionGroups = [
  {
    from: { classCode: 'I', label: 'I 입문' },
    rows: [
      {
        condition: '입문반 8개월 이상 이수',
        method: '기간',
        note: '입문반 8개월 이수 시 승급 대상',
      },
      {
        condition: '교육본부 추천',
        method: '추천',
        note: '이수 기간 상관없이 승급 가능',
      },
    ],
    to: { classCode: 'R', label: 'R 중급' },
  },
  {
    from: { classCode: 'R', label: 'R 중급' },
    rows: [
      {
        condition: '중급반 8개월 이상 이수',
        method: '기간',
        note: '중급반 8개월 이상 이수 시 승급 대상',
      },
      {
        condition: '교육 본부/매니지먼트 본부 추천',
        method: '추천',
        note: '이수 기간 상관없이 승급 가능',
      },
      {
        condition: '교육/매니지먼트/드라마캐스팅 본부 심사결과',
        method: '오디션',
        note: '',
      },
    ],
    to: { classCode: 'U', label: 'U 심화' },
  },
  {
    from: { classCode: 'U', label: 'U 심화' },
    rows: [
      {
        condition: '심화반 8개월 이상 이수',
        method: '기간',
        note: '심화반 8개월 이상 이수 시 승급 대상',
      },
      {
        condition: '교육 본부/매니지먼트 본부 추천',
        method: '추천',
        note: '이수 기간 상관없이 승급 가능',
      },
      {
        condition: '교육/매니지먼트/드라마캐스팅 본부 심사결과',
        method: '오디션',
        note: '',
      },
    ],
    to: { classCode: 'DA', label: 'DA 전문' },
  },
] satisfies PromotionGroup[]

const gradeSystemContent = {
  art: {
    centerName: '아트센터',
    cohortStartYear: 2010,
    criteriaDescription:
      '전체 수강생은 전공생 30%, 비전공생 40%, 엔터테인먼트교육생 30%로 이루어져 있으며, 각 클래스에 따라 수강생의 담당 관리부서가 교체됩니다.\n배우앤배움 교육팀에서는 기존 단일 오디션 형태의 승급 평가 방식에서 탈피하여 두 달 과정의 커리큘럼에 대한 전반적인 이수 평가를 도입하였습니다.\n커리큘럼이 끝나는 마지막 주에는 각 클래스의 강사진들이 연기자 평가서를 교육팀에 제출하게 되며, 이를 통해 학생들은 본인의 승급 여부와 함께 개인의 연기성장에 대한 정확한 피드백을 전달받게 됩니다.',
    criteriaEntryLabels: artCriteriaEntryLabels,
    criteriaTitle:
      '정기적인 오디션을 통해 단계별로 초급 I반, 중급 R반, 고급 U반, 전문 D반, 배우 A반으로 클래스가 편성됩니다.',
    gradeRows: artGradeRows,
    gradeTableDescription:
      '배정 Class는 아래 항목 중 충족되는 조건을 기준으로 진행되며, R Class부터 레벨테스트가 진행됩니다.',
    gradeTableTitle: '성인 등급 기준',
    promotionGroups: artPromotionGroups,
    promotionTitle: '성인 승급 기준',
    stepClasses: artStepClasses,
    stepsDescriptionLines: [
      'I am Ready to Undertake the Dedication of Acting.',
      '각 클래스의 세부 교육내용은 이달의 커리큘럼에서 검색하시기 바랍니다.',
    ],
    stepsCenterName: '아트센터',
    stepsTitleLines: [
      'IRUDA 연기트레이닝 시스템입니다.',
      '아트센터의 모든 교육은 ‘나’로부터 시작됩니다.',
    ],
    wordmarkLetters: [
      { className: 'I Class', fileNames: ['iruda-i.svg'] },
      { className: 'R Class', fileNames: ['iruda-r.svg'] },
      { className: 'U Class', fileNames: ['iruda-u.svg'] },
      { className: 'D Class', fileNames: ['iruda-d.svg'] },
      { className: 'A Class', fileNames: ['iruda-a.svg'] },
    ],
  },
  highteen: {
    centerName: '하이틴센터',
    cohortStartYear: 2020,
    criteriaDescription:
      '클래스 편성 기준은 연기교육 경력과 촬영 현장 경험, 오디션 및 테스트의 전반적인 평가를 통해 정해집니다.\n승급 기준은 담당 선생님과 캐스팅 디렉터의 실시간 피드백을 종합평가하여 결정됩니다.',
    criteriaEntryLabels: highteenCriteriaEntryLabels,
    criteriaTitle:
      '청소년 과정은 입문 I반, 중급 R반, 심화 U반, 전문 DA반으로 클래스가 편성됩니다.',
    extraPromotionCriteria: [
      '담당 선생님과 하이틴 캐스팅팀의 실시간 레벨 체크',
      '상, 하반기에 진행되는 레벨 테스트 우수자',
      '자체적으로 진행되는 캐스팅 오디션 우수자',
    ],
    gradeRows: highteenGradeRows,
    gradeTableDescription:
      '연기자들의 배정 Class는 아래 항목 중 충족되는 조건으로 진행되며, R Class부터 레벨 테스트가 진행됩니다.',
    gradeTableTitle: '청소년 등급 기준',
    promotionGroups: highteenPromotionGroups,
    promotionTitle: '청소년 승급 기준',
    stepClasses: highteenStepClasses,
    stepsDescriptionLines: [
      'I am Ready to Undertake the Dedication of Acting.',
      '각 클래스의 세부 교육내용은 이달의 커리큘럼에서 검색하시기 바랍니다.',
    ],
    stepsCenterName: '하이틴센터',
    stepsTitleLines: [
      'IRUDA 연기트레이닝 시스템입니다.',
      '하이틴센터의 모든 교육은 ‘나’로부터 시작됩니다.',
    ],
    wordmarkLetters: [
      { className: 'I Class', fileNames: ['iruda-i.svg'] },
      { className: 'R Class', fileNames: ['iruda-r.svg'] },
      { className: 'U Class', fileNames: ['iruda-u.svg'] },
      { className: 'DA Class', fileNames: ['iruda-d.svg', 'iruda-a.svg'] },
    ],
  },
  kids: {
    centerName: '키즈센터',
    cohortStartYear: 2018,
    criteriaDescription:
      '클래스 편성 기준은 연기교육 경력과 촬영 현장 경험, 오디션 및 테스트의 전반적인 평가를 통해 정해집니다.\n승급 기준은 담당 선생님과 캐스팅 디렉터의 실시간 피드백을 종합평가하여 결정됩니다.',
    criteriaEntryLabels: kidsCriteriaEntryLabels,
    criteriaTitle:
      '키즈 과정은 초급 영재 교육과정, 중급 아역배우 교육과정, 고급 아티스트 교육과정으로 클래스가 편성됩니다.',
    extraPromotionCriteria: [
      '담당 선생님과 캐스팅 디렉터의 실시간 레벨 체크',
      '상·하반기에 진행되는 캐스팅 디렉터 레벨 테스트 우수자',
      '자체적으로 진행되는 캐스팅 오디션 우수자',
    ],
    gradeRows: kidsGradeRows,
    gradeTableDescription:
      '아이들의 배정 Class는 아래 항목 중 충족되는 조건으로 진행되며, 중급 Class부터 카메라 테스트가 진행됩니다.',
    gradeTableTitle: '키즈 등급 기준',
    stepClasses: kidsStepClasses,
    stepsDescriptionLines: [
      '틀에 박힌 주입식 교육이 아닌, 아이들이 상상하고 이해한 것을 자신의 색깔로 표현할 수 있도록 구성된 전문적이고 체계적인 커리큘럼을 경험해보세요.',
    ],
    stepsCenterName: '키즈센터',
    stepsTitleLines: [
      '아이들의 잠재된 빛을 깨웁니다.',
      '모든 성장은 ‘나를 표현하는 힘’에서 시작됩니다.',
    ],
    wordmarkLetters: [],
  },
} satisfies Record<GradeSystemCenter, GradeSystemContent>

type CohortHalf = '상반기' | '하반기'

type CohortRow = {
  half: CohortHalf
  number: number
  period: string
  year: number
}

function cohortNumber(year: number, half: CohortHalf, startYear: number) {
  return (year - startYear) * 2 + (half === '상반기' ? 1 : 2)
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

function buildCohorts(startYear: number, date = new Date()): CohortRow[] {
  const { month, year } = currentKoreaYearMonth(date)
  const currentHalf: CohortHalf = month <= 6 ? '상반기' : '하반기'
  const rows: CohortRow[] = []

  for (let currentYear = year; currentYear >= startYear; currentYear -= 1) {
    const halves: CohortHalf[] =
      currentYear === year && currentHalf === '상반기'
        ? ['상반기']
        : ['하반기', '상반기']

    for (const half of halves) {
      rows.push({
        half,
        number: cohortNumber(currentYear, half, startYear),
        period: cohortPeriod(currentYear, half),
        year: currentYear,
      })
    }
  }

  return rows
}

export function GradeSystemTabs({ center }: { center: GradeSystemCenter }) {
  const data = gradeSystemContent[center]
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
    <section className="section-p-block-xs relative overflow-hidden bg-[#111] text-white">
      {activeTab === 'steps' ? (
        <>
          <PageDeco
            className="left-0 top-[930px] hidden -translate-x-[42%] lg:block"
            icon={gradeSystemDecoIcons[2]}
          />
          <PageDeco
            className="right-0 top-[2900px] hidden translate-x-[46%] lg:block"
            icon={gradeSystemDecoIcons[3]}
          />
        </>
      ) : null}
      <div className="container relative">
        <nav aria-label="등급제 교육관리시스템" className="mb-16 border-b border-white/10">
          <div className="flex min-w-0 gap-8 overflow-x-auto md:gap-20">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key

              return (
                <button
                  aria-selected={isActive}
                  className={cn(
                    'relative h-14 shrink-0 type-label-l font-bold leading-none text-white/35 transition-colors hover:text-white',
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

        {activeTab === 'steps' ? <StepsPanel center={center} data={data} /> : null}
        {activeTab === 'criteria' ? <CriteriaPanel data={data} /> : null}
        {activeTab === 'cohorts' ? <CohortsPanel data={data} /> : null}
      </div>
    </section>
  )
}

function StepsPanel({ center, data }: { center: GradeSystemCenter; data: GradeSystemContent }) {
  const titleLines = data.stepsTitleLines ?? [
    'IRUDA 연기트레이닝 시스템입니다.',
    `${data.stepsCenterName}의 모든 교육은 ‘나’로부터 시작됩니다.`,
  ]
  const descriptionLines = data.stepsDescriptionLines ?? [
    'I am Ready to Undertake the Dedication of Acting.',
    '각 클래스의 세부 교육내용은 이달의 커리큘럼에서 검색하시기 바랍니다.',
  ]

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <section>
        <h2 className="max-w-[900px] type-display-l font-bold leading-tight tracking-normal">
          {titleLines.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h2>
        <p className="mt-12 max-w-[720px] type-body-m leading-[1.8] text-white/55">
          {descriptionLines.map((line) => (
            <span className="block" key={line}>
              {line === 'I am Ready to Undertake the Dedication of Acting.' ? (
                <AcronymSentence />
              ) : (
                line
              )}
            </span>
          ))}
        </p>
      </section>

      {center === 'kids' ? (
        <KidsIrudaOverview classes={data.stepClasses} />
      ) : data.wordmarkLetters.length > 0 ? (
        <IrudaWordmark letters={data.wordmarkLetters} />
      ) : (
        <ClassOverview classes={data.stepClasses} />
      )}

      <div className="flex flex-col gap-20 md:gap-24">
        {data.stepClasses.map((item) => (
          <ClassSection item={item} key={item.className} />
        ))}
      </div>
    </div>
  )
}

function ClassSection({
  item,
}: {
  item: StepClass
}) {
  return (
    <section className="border-t border-white/10 pt-16">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex items-start gap-3 lg:col-span-1">
          <span className="grid h-9 min-w-9 shrink-0 place-items-center rounded-full bg-brand px-2 type-label-m font-black text-white">
            {item.letter}
          </span>
          <h3 className="pt-1 type-headline-s font-semibold leading-[1.3]">{item.label}</h3>
        </div>
        <div className="lg:col-span-2">
          <h4 className="type-headline-s font-semibold leading-[1.45]">{item.headline}</h4>
          {item.details ? (
            <dl className="mt-8 grid gap-y-1 type-title-m font-normal leading-normal text-white/55">
              {item.details.map((detail) => (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-1.5" key={detail.label}>
                  <dt className="whitespace-nowrap">{detail.label} :</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="mt-4 type-body-m leading-[1.95] text-white/50">
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
              <h5 className="type-title-s font-extrabold leading-[1.45]">{card.title}</h5>
              <ul className="mt-5 space-y-2 type-body-s leading-[1.7] text-white/48">
                {card.items.map((text) => (
                  <li className="grid grid-cols-[4px_minmax(0,1fr)] gap-2" key={text}>
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

function ClassOverview({ classes }: { classes: StepClass[] }) {
  return (
    <div
      className={cn(
        'grid gap-5',
        classes.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-5',
      )}
    >
      {classes.map((item) => (
        <article
          className="flex min-h-[190px] flex-col items-center justify-center rounded-full bg-white/[0.12] p-6 text-center md:min-h-[220px]"
          key={item.className}
        >
          <p className="type-title-s font-extrabold leading-none text-brand">{item.label}</p>
          <h3 className="mt-6 whitespace-pre-line type-headline-s font-extrabold leading-tight text-white">
            {item.className.replace(' Class', '\nClass')}
          </h3>
        </article>
      ))}
    </div>
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

function IrudaWordmark({ letters }: { letters: IrudaLetter[] }) {
  const columnCount = letters.reduce((total, letter) => total + letter.fileNames.length, 0)

  return (
    <figure aria-label="IRUDA 클래스 구성" className="mt-4">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {letters.map((letter) => (
          <div
            className="flex min-w-0 flex-col items-center gap-4"
            key={letter.className}
            style={{ gridColumn: `span ${letter.fileNames.length}` }}
          >
            <div className="grid w-full grid-flow-col gap-3">
              {letter.fileNames.map((fileName) => (
                <NextImage
                  alt=""
                  aria-hidden="true"
                  className="h-auto w-full opacity-10"
                  height={216}
                  key={fileName}
                  src={`${gradeAssetBase}/${fileName}`}
                  width={216}
                />
              ))}
            </div>
            <span className="text-center type-label-m font-extrabold uppercase leading-none text-white">
              {letter.className}
            </span>
          </div>
        ))}
      </div>
    </figure>
  )
}

function KidsIrudaOverview({ classes }: { classes: StepClass[] }) {
  return (
    <figure aria-label="키즈 클래스 구성" className="mt-4">
      <div className="grid grid-cols-5 gap-1 md:gap-3">
        {kidsOverviewDecoIcons.map((icon, index) => (
          <NextImage
            alt=""
            aria-hidden="true"
            className="h-auto w-full brightness-0 invert opacity-10"
            height={360}
            key={`${icon}-${index}`}
            src={`/assets/common/deco/${icon}`}
            width={360}
          />
        ))}
      </div>
      <figcaption className="mt-5 grid grid-cols-3 gap-x-2 gap-y-4 text-center">
        {classes.map((item) => (
          <span className="type-title-s font-semibold uppercase leading-normal text-white" key={item.className}>
            <span className="text-brand">{item.label}</span> {item.className}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

function CriteriaPanel({ data }: { data: GradeSystemContent }) {
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <section className="">
        <h2 className="type-headline-xl font-bold leading-[1.35]">
          {data.criteriaTitle}
        </h2>
        <p className="mt-8 whitespace-pre-line type-body-m leading-[1.85] text-white/50">
          {data.criteriaDescription}
        </p>
      </section>

      <GradeCriteriaTable data={data} />
      {data.promotionGroups && data.promotionTitle ? <PromotionTable data={data} /> : null}
      {data.extraPromotionCriteria ? (
        <section className="other-classes">
          <h3 className="type-title-s font-extrabold leading-none">그 외 승급 기준</h3>
          <ul className="mt-5 space-y-2 type-body-s leading-[1.7] text-white/60">
            {data.extraPromotionCriteria.map((item) => (
              <li className="grid grid-cols-[4px_minmax(0,1fr)] gap-2" key={item}>
                <span aria-hidden="true" className="mt-[0.78em] h-0.5 w-0.5 rounded-full bg-white/48" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function GradeCriteriaTable({ data }: { data: GradeSystemContent }) {
  return (
    <section>
      <h3 className="mb-5 type-title-l font-extrabold leading-none">{data.gradeTableTitle}</h3>
      <p className="mb-4 type-caption-l leading-[1.65] text-white/45">
        {data.gradeTableDescription}
      </p>

      {/* 데스크탑: 표 형태 (가독성 개선) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed border-collapse text-left type-body-s">
          <thead>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader width="w-[8%]">
                Class
              </CriteriaHeader>
              <CriteriaHeader width="w-[8%]">
                과정
              </CriteriaHeader>
              <CriteriaHeader width="w-[18%]">
                관리부서
              </CriteriaHeader>
              {data.criteriaEntryLabels.map((entry) => (
                <CriteriaHeader key={entry.key}>{entry.label}</CriteriaHeader>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.gradeRows.map((row, index) => (
              <tr
                className="bg-[#222] text-white/55 transition-colors hover:bg-[#262626]"
                key={`${index}-${row.className}`}
              >
                <CriteriaCell
                  className={cn(
                    'text-center align-top',
                    getGradeLevelCellClassName(index),
                  )}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="font-extrabold">{row.classCode}</span>
                    <span className="type-caption-m font-medium opacity-70">{row.level}</span>
                  </div>
                </CriteriaCell>
                <CriteriaCell
                  className={cn(
                    'text-center align-top font-extrabold text-[#0d4f94]',
                    getProcessCellClassName(row.process),
                  )}
                >
                  {row.process}
                </CriteriaCell>
                <CriteriaCell className="align-top text-white/55">{row.department}</CriteriaCell>
                {data.criteriaEntryLabels.map((entry) => (
                  <CriteriaCell className="text-left align-top" key={entry.key}>
                    <CriteriaText
                      highlightTerms={[
                        '외부작품',
                        '매니지먼트',
                        '경력 인정자',
                        '경력인정자',
                        '조/단역',
                        '다수 출연',
                        '연기상',
                      ]}
                      value={row[entry.key]}
                    />
                  </CriteriaCell>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일/태블릿: 클래스별 카드 */}
      <div className="flex flex-col gap-4 lg:hidden">
        {data.gradeRows.map((card, index) => (
          <article
            className="overflow-hidden rounded-lg border border-[#363636] bg-[#1c1c1c]"
            key={`${index}-${card.className}`}
          >
            <header
              className={cn(
                'flex flex-wrap items-center gap-2 border-b border-[#363636] px-4 py-3',
                getGradeLevelCellClassName(index),
              )}
            >
              <span className="type-label-m font-extrabold">{card.classCode}</span>
              <span className="type-label-m font-bold opacity-75">{card.level}</span>
              <ProcessBadge className="ml-auto" process={card.process} />
            </header>
            <dl className="divide-y divide-[#2c2c2c] type-body-s">
              <div className="flex gap-3 px-4 py-3">
                <dt className="w-20 shrink-0 font-medium text-white/40">관리부서</dt>
                <dd className="whitespace-pre-line leading-[1.55] text-white/70">
                  {card.department || '-'}
                </dd>
              </div>
              {data.criteriaEntryLabels.map((entry) => {
                const value = card[entry.key]

                return (
                  <div className="flex gap-3 px-4 py-3" key={entry.key}>
                    <dt className="w-20 shrink-0 font-medium text-white/40">{entry.label}</dt>
                    <dd className="leading-[1.55] text-white/70">
                      <CriteriaText
                        highlightTerms={[
                          '외부작품',
                          '매니지먼트',
                          '경력 인정자',
                          '경력인정자',
                          '조/단역',
                          '다수 출연',
                          '연기상',
                        ]}
                        value={value}
                      />
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

function PromotionTable({ data }: { data: GradeSystemContent }) {
  if (!data.promotionGroups || !data.promotionTitle) {
    return null
  }

  const promotionGroups = data.promotionGroups
  const promotionTitle = data.promotionTitle

  return (
    <section>
      <h3 className="mb-5 type-title-l font-extrabold leading-none">{promotionTitle}</h3>

      {/* 데스크탑: 표 형태 */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-collapse text-left type-body-s">
          <thead>
            <tr className="bg-[#343434] text-white">
              <CriteriaHeader width="w-[22%]">승급 경로</CriteriaHeader>
              <CriteriaHeader width="w-[12%]">방법</CriteriaHeader>
              <CriteriaHeader>조건</CriteriaHeader>
              <CriteriaHeader width="w-[28%]">비고</CriteriaHeader>
            </tr>
          </thead>
          <tbody>
            {promotionGroups.map((group) =>
              group.rows.map((row, index) => {
                return (
                  <tr
                    className={cn(
                      'bg-[#222] text-white/55 transition-colors hover:bg-[#262626]',
                      index === 0 && 'border-t border-[#444]',
                    )}
                    key={`${group.from.classCode}-${group.to.classCode}-${row.method}`}
                  >
                    {index === 0 ? (
                      <CriteriaCell className="align-middle" rowSpan={group.rows.length}>
                        <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                          <GradeBadge code={group.from.classCode}>{group.from.label}</GradeBadge>
                          <ArrowRight aria-hidden="true" className="text-white/70" size={14} />
                          <GradeBadge code={group.to.classCode}>{group.to.label}</GradeBadge>
                        </span>
                      </CriteriaCell>
                    ) : null}
                    <CriteriaCell>
                      <CriteriaTypeBadge type={row.method} />
                    </CriteriaCell>
                    <CriteriaCell className="text-left align-top">{row.condition}</CriteriaCell>
                    <CriteriaCell className="text-left align-top">
                      <CriteriaText
                        highlightTerms={[
                          '이수 기간 상관없이',
                        ]}
                        value={row.note}
                      />
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
          return (
            <article
              className="overflow-hidden rounded-lg border border-[#363636] bg-[#1c1c1c]"
              key={`${group.from.classCode}-${group.to.classCode}`}
            >
              <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#363636] bg-[#262626] px-4 py-3 type-label-m">
                <GradeBadge code={group.from.classCode}>{group.from.label}</GradeBadge>
                <ArrowRight aria-hidden="true" className="text-brand" size={15} />
                <GradeBadge code={group.to.classCode}>{group.to.label}</GradeBadge>
              </header>
              <ul className="divide-y divide-[#2c2c2c]">
                {group.rows.map((row) => (
                  <li className="flex flex-col gap-2 px-4 py-3" key={row.method}>
                    <CriteriaTypeBadge type={row.method} />
                    <p className="type-body-s leading-[1.55] text-white/70">
                      {row.condition}
                    </p>
                    {row.note ? (
                      <p className="type-caption-s leading-normal text-white/70">
                        <CriteriaText
                          highlightTerms={[
                            '이수 기간 상관없이',
                            '6개월이상 이수자 중 추천',
                          ]}
                          value={row.note}
                        />
                      </p>
                    ) : null}
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
        'border border-[#444] px-3 py-4 text-center type-caption-m font-bold leading-[1.55]',
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
        'border border-[#363636] px-3 py-4 type-body-s leading-normal text-left',
        emphasis && 'font-medium text-white',
        className,
      )}
      rowSpan={rowSpan}
    >
      {children || '-'}
    </td>
  )
}

function CriteriaText({
  emphasizeLine,
  highlightTerms = [],
  value,
}: {
  emphasizeLine?: (line: string, lineIndex: number) => boolean
  highlightTerms?: string[]
  value: string
}) {
  if (!value) {
    return <span className="text-white/35">-</span>
  }

  const lines = value.split('\n')
  const hasBulletLines = lines.some((line) => line.startsWith('- '))

  return (
    <span className="flex flex-col gap-0.5">
      {lines.map((line, lineIndex) => {
        const isBulletLine = line.startsWith('- ')
        const isSubNote = line.startsWith('<') || line.startsWith('*')
        const text = isBulletLine ? line.slice(2) : line
        const isHighlighted = highlightTerms.some((term) => line.includes(term))

        return (
          <span
            className={cn(
              hasBulletLines && !isBulletLine && !isSubNote && 'pl-3.5',
          isSubNote && 'mt-1 type-caption-s text-white/45',
              (isHighlighted || emphasizeLine?.(line, lineIndex)) && 'font-medium text-white',
            )}
            key={`${line}-${lineIndex}`}
          >
            {isBulletLine ? (
              <span className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-[0.62em] h-1 w-1 shrink-0 rounded-full bg-white/55',
                    isHighlighted && 'bg-white',
                  )}
                />
                <span>{text}</span>
              </span>
            ) : (
              text
            )}
          </span>
        )
      })}
    </span>
  )
}

const gradeBadgeClassNames: Record<string, string> = {
  A: 'bg-[#eeedfe] text-[#534ab7]',
  D: 'bg-[#faeeda] text-[#854f0b]',
  DA: 'bg-[#faeeda] text-[#854f0b]',
  I: 'bg-[#f1efe8] text-[#5f5e5a]',
  '영재 교육': 'bg-[#f1efe8] text-[#5f5e5a]',
  '아역 배우': 'bg-[#e1f5ee] text-[#0f6e56]',
  '아티스트': 'bg-[#e6f1fb] text-[#185fa5]',
  R: 'bg-[#e1f5ee] text-[#0f6e56]',
  U: 'bg-[#e6f1fb] text-[#185fa5]',
}

const gradeLevelCellClassNames = [
  'bg-brand/20 text-white',
  'bg-brand/40 text-white',
  'bg-brand/60 text-white',
  'bg-brand/70 text-white',
  'bg-brand/90 text-white',
] as const

function GradeBadge({ children, code }: { children: React.ReactNode; code: string }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded px-2 py-1 type-label-s font-bold leading-none',
        gradeBadgeClassNames[code] || 'bg-white/10 text-white/70',
      )}
    >
      {children}
    </span>
  )
}

function getGradeLevelCellClassName(index: number) {
  return gradeLevelCellClassNames[index] ?? gradeLevelCellClassNames[gradeLevelCellClassNames.length - 1]
}

function ProcessBadge({ className, process }: { className?: string; process: string }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded px-2 py-1 type-label-s font-bold leading-none',
        getProcessCellClassName(process),
        className,
      )}
    >
      {process}
    </span>
  )
}

function getProcessCellClassName(process: string) {
  if (process === '배움' || process === '배움과정') {
    return 'bg-orange-200/50 text-white'
  }

  if (process === '심화 과정' || process === '심화과정') {
    return 'bg-teal-200/50 text-white'
  }

  if (process === '전문 과정' || process === '전문과정') {
    return 'bg-sky-200/50 text-white'
  }

  return 'bg-red-300/50 text-white'
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
    <span className="inline-flex gap-1.5 type-label-m font-bold leading-none text-white/80">
      {Icon ? <Icon aria-hidden="true" size={13} strokeWidth={2} /> : null}
      {type}
    </span>
  )
}

function CohortsPanel({ data }: { data: GradeSystemContent }) {
  const cohorts = buildCohorts(data.cohortStartYear)
  const latestCohort = cohorts[0]

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-190">
        <h2 className="type-headline-xl font-extrabold leading-[1.3]">기수 안내</h2>
        <p className="mt-7 type-body-m leading-[1.85] text-white/50">
          배우앤배움 {data.centerName}에서는 매해 상반기, 하반기로 나누어 배우앤배움 기수를 부여하고 있습니다. 최초 {data.cohortStartYear}년 상반기 1기가 시작되었으며, 현재 {latestCohort?.year}년 {latestCohort?.half} 기준 {latestCohort?.number}기까지 진행중입니다.
        </p>
      </section>

      <CohortTable cohorts={cohorts} />
      <p className="type-caption-m leading-[1.7] text-white/35">
        상반기 기수는 1월부터 6월 30일까지, 하반기 기수는 7월부터 12월 31일까지 산정됩니다.
      </p>
    </div>
  )
}

function CohortTable({ cohorts }: { cohorts: CohortRow[] }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <CalendarDays aria-hidden="true" className="text-brand" size={18} />
        <h3 className="type-title-s font-extrabold leading-none">기수 목록</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left type-body-s">
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
                        'border border-[#363636] bg-[#262626] px-5 py-4 font-bold leading-[1.55] text-white/72',
                        index % 2 === 1 && 'bg-[#222]',
                      )}
                      rowSpan={yearSpan}
                    >
                      {cohort.year}
                    </td>
                  ) : null}
                  <td className="border border-[#363636] px-5 py-4 leading-[1.55]">
                    {cohort.half}
                  </td>
                  <td className="border border-[#363636] px-5 py-4 leading-[1.55]">
                    {cohort.period}
                  </td>
                  <td className="border border-[#363636] px-5 py-4 font-bold leading-[1.55]">
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
