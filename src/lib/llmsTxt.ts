import { getHeaderMenu } from '@/Header/Nav/menu'

import type { CenterSlug } from './centers'
import { centerLocationList, centerLocations } from './centerLocations'

type LlmsTxtEntry = {
  description: string
  path: string
  title: string
}

type LlmsTxtSection = {
  entries: LlmsTxtEntry[]
  title: string
}

const introduction =
  '배우앤배움은 배우 교육, 연극영화과 입시, 아역·청소년 연기, 캐스팅 연계를 운영하는 연기 교육 브랜드입니다.'

const educationEntries: LlmsTxtEntry[] = [
  {
    description:
      '아트센터 IRUDA 등급제 연기 트레이닝의 단계별 목표, 훈련 영역, 교육 관리 방식을 안내합니다.',
    path: '/art/grade-system',
    title: '아트센터 등급제 교육관리시스템',
  },
  {
    description:
      '아트센터 클래스별 커리큘럼과 교육 기간, 수업 구성, 배우 훈련 방향을 확인할 수 있습니다.',
    path: '/art/curriculum',
    title: '아트센터 커리큘럼',
  },
  {
    description:
      '배우앤배움 교육진의 담당 영역, 경력, 수업 정보를 센터별로 탐색할 수 있는 목록입니다.',
    path: '/art/teachers',
    title: '교육진 소개',
  },
  {
    description:
      '입시센터의 개인별 입시 설계, 이미지 컨설팅, 전략 매핑, 합격 이후 관리 시스템을 설명합니다.',
    path: '/exam/management',
    title: '입시 매니지먼트',
  },
  {
    description:
      '입시반, 예비 입시반, 예고 입시반 등 연극영화과 입시 과정별 커리큘럼을 안내합니다.',
    path: '/exam/curriculum',
    title: '입시센터 커리큘럼',
  },
  {
    description:
      '키즈센터 영재, 아역배우, 아티스트 과정의 연령별 수업 구성과 성장 목표를 정리합니다.',
    path: '/kids/curriculum',
    title: '키즈센터 커리큘럼',
  },
  {
    description:
      '하이틴센터의 청소년 방송연기 특강 영상과 프로그램 기록을 확인할 수 있습니다.',
    path: '/highteen/special-lecture',
    title: '하이틴센터 특강',
  },
]

const castingAndArtistEntries: LlmsTxtEntry[] = [
  {
    description:
      '배우앤배움 수강생과 출신 배우의 드라마, 영화, 광고 출연 장면을 모아 보여주는 갤러리입니다.',
    path: '/art/screen-appearances',
    title: 'BNB 출연장면',
  },
  {
    description:
      '캐스팅 출연 현황을 연도별로 확인하고 작품별 참여 기록을 탐색할 수 있습니다.',
    path: '/art/casting-status',
    title: '캐스팅 출연현황',
  },
  {
    description:
      '캐스팅 센터의 운영 방향, 프로필 관리, 오디션 연계, 현장 지원 흐름을 안내합니다.',
    path: '/art/casting',
    title: '캐스팅 센터',
  },
  {
    description:
      '프로필 제작, 영상 제작, 작품 선별, 오디션, 현장 케어까지 이어지는 배우 케어 시스템입니다.',
    path: '/art/casting-system',
    title: '배우 케어 시스템',
  },
  {
    description:
      '배우앤배움 출신 아티스트의 활동 소식과 언론 보도, 소속사 정보를 확인할 수 있습니다.',
    path: '/art/artist-press',
    title: 'BNB 출신 아티스트',
  },
  {
    description:
      'BNB 루키 프로필과 활동 이력을 소개하며 신인 배우 후보군을 탐색할 수 있습니다.',
    path: '/art/rookies',
    title: 'BNB 루키',
  },
  {
    description:
      '입시센터 수강생의 대학교 합격 결과를 학교와 연도 중심으로 확인할 수 있습니다.',
    path: '/exam/university-results',
    title: '대학교 합격현황',
  },
  {
    description:
      '입시센터 수강생의 예술고등학교 합격 결과와 학교별 합격 기록을 제공합니다.',
    path: '/exam/arts-high-results',
    title: '예술고등학교 합격현황',
  },
]

const supportEntries: LlmsTxtEntry[] = [
  {
    description:
      '센터별 공지, 교육 소식, 캐스팅 소식, 운영 안내를 확인할 수 있는 뉴스 목록입니다.',
    path: '/art/news',
    title: 'NEWS&NOTICE',
  },
  {
    description:
      '입학 절차, 수강료, 장학제도, 휴학과 복학, 환불정책 등 등록 전 확인 사항을 안내합니다.',
    path: '/art/admission',
    title: '입학안내',
  },
  {
    description:
      '스타카드, 스튜디오, 프로필 제작, 오디션 정보, 연습실 등 수강생 이용 서비스를 정리합니다.',
    path: '/art/how-to-use',
    title: '학원100%이용법',
  },
  {
    description:
      '입학, 수업, 수강료, 캐스팅, 시설 이용과 관련된 자주 묻는 질문과 답변입니다.',
    path: '/art/faq',
    title: '자주하는 질문',
  },
  {
    description:
      '센터 주소, 대표 전화번호, 지도 위치, 교통 정보를 확인할 수 있는 오시는 길 페이지입니다.',
    path: '/art/map',
    title: '오시는 길',
  },
]

const optionalEntries: LlmsTxtEntry[] = [
  {
    description: '개인정보 수집, 이용, 보관, 파기, 이용자 권리와 관련된 공식 개인정보처리방침입니다.',
    path: '/privacy',
    title: '개인정보처리방침',
  },
  {
    description: '배우앤배움 웹사이트와 서비스 이용 조건, 회원 책임, 제한 사항을 안내하는 약관입니다.',
    path: '/terms',
    title: '이용약관',
  },
]

export function generateLlmsTxt({ baseUrl }: { baseUrl: string }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const sections: LlmsTxtSection[] = [
    {
      entries: [
        {
          description:
            '배우앤배움 다섯 개 센터의 성격과 주요 교육 영역을 비교하고 각 센터 홈으로 이동하는 대표 게이트입니다.',
          path: '/',
          title: '배우앤배움 센터 선택',
        },
        ...centerLocationList.map((location) => ({
          description: centerDescription(location.slug),
          path: `/${location.slug}`,
          title: location.name,
        })),
      ],
      title: 'Primary Pages',
    },
    {
      entries: educationEntries,
      title: 'Education',
    },
    {
      entries: castingAndArtistEntries,
      title: 'Casting and Artists',
    },
    {
      entries: supportEntries,
      title: 'Admissions and Support',
    },
    {
      entries: optionalEntries,
      title: 'Optional',
    },
  ]

  return [
    '# 배우앤배움',
    '',
    `> ${introduction}`,
    '',
    '이 파일은 AI 시스템이 배우앤배움 웹사이트의 공개 정보 구조를 빠르게 이해하도록 만든 선별 목록입니다. 전체 색인 목록이 아니라 핵심 페이지와 센터별 탐색 시작점을 우선 제공합니다.',
    '',
    ...sections.flatMap((section) => formatSection(section, normalizedBaseUrl)),
    '## Key Facts',
    '',
    '- 공식 브랜드: 배우앤배움(BNB)',
    '- 운영 센터: 아트센터, 입시센터, 키즈센터, 하이틴센터, 애비뉴센터',
    '- 주요 영역: 매체 연기 교육, 연극영화과 입시, 아역·청소년 연기 교육, 캐스팅 및 배우 케어',
    '- 공개 URL 구조: 센터별 주요 페이지는 `/{center}/...` 경로를 사용합니다.',
    '- 대표 문의 전화: 1577-9929',
    '- 주요 위치: 서울 서초구 반포동·잠원동 일대 센터별 운영',
    '',
    '## Contact',
    '',
    `- Website: ${absoluteUrl(normalizedBaseUrl, '/')}`,
    '- Phone: 1577-9929',
    `- Consultation: ${absoluteUrl(normalizedBaseUrl, '/art/consult')}`,
    '',
  ].join('\n')
}

function formatSection(section: LlmsTxtSection, baseUrl: string) {
  return [
    `## ${section.title}`,
    '',
    ...section.entries.map(
      (entry) => `- [${entry.title}](${absoluteUrl(baseUrl, entry.path)}): ${entry.description}`,
    ),
    '',
  ]
}

function centerDescription(center: CenterSlug) {
  const location = centerLocations[center]
  const menuGroups = getHeaderMenu(center)
    .map((group) => group.label)
    .join(', ')

  return `${location.summary} 주요 탐색 영역은 ${menuGroups}입니다.`
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  return trimmedBaseUrl || 'http://localhost:3000'
}

function absoluteUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString()
}
