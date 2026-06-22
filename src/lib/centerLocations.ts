import type { CenterSlug } from './centers'

export type CenterLocation = {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  fax?: string
  label: string
  logoSrc?: string
  name: string
  phone: string
  slug: CenterSlug
  summary: string
  tabLabel: string
}

export const centerLocationOrder: CenterSlug[] = ['art', 'exam', 'kids', 'highteen', 'avenue']

export const centerLocations: Record<CenterSlug, CenterLocation> = {
  art: {
    address: '서울 서초구 사평대로55길 126',
    coordinates: {
      lat: 37.5094542308936,
      lng: 127.020560589267,
    },
    fax: '02-540-3987',
    label: '아트센터',
    logoSrc: '/assets/common/logo/logo-art.svg',
    name: '배우앤배움 아트센터',
    phone: '1577-9929',
    slug: 'art',
    summary:
      '배우를 새로운 시각에서 바라보고 브랜딩하는 매체 연기 교육 기관입니다. 교육, 캐스팅, 배우관리 시스템을 연결해 배우가 산업과 대중이 원하는 새로운 배우로 자리 잡을 수 있도록 지원합니다.',
    tabLabel: 'Art Center',
  },
  exam: {
    address: '서울 서초구 사평대로53길 107 삼호빌딩',
    coordinates: {
      lat: 37.508864669094,
      lng: 127.019705255841,
    },
    label: '입시센터',
    logoSrc: '/assets/common/logo/logo-exam.svg',
    name: '배우앤배움 입시센터',
    phone: '1577-9929',
    slug: 'exam',
    summary:
      '체계적인 커리큘럼과 관리 시스템을 바탕으로 연극영화과 입시에 필요한 방향성을 제시합니다. 학생별 수업 진도와 보완점을 분석해 하나의 작품을 완성하듯 입시 과정을 관리합니다.',
    tabLabel: 'Exam Center',
  },
  highteen: {
    address: '서울 서초구 강남대로89길 19',
    coordinates: {
      lat: 37.5091652265931,
      lng: 127.020857745851,
    },
    label: '하이틴센터',
    logoSrc: '/assets/common/logo/logo-highteen.svg',
    name: '배우앤배움 하이틴센터',
    phone: '1577-9929',
    slug: 'highteen',
    summary:
      '청소년 방송연기 트레이닝에 맞춘 커리큘럼과 이미지 메이킹, 캐스팅 연계를 제공합니다. 드라마, 영화, 광고 촬영 현장으로 이어질 수 있도록 교육과 매니지먼트를 연결합니다.',
    tabLabel: 'High Teen Center',
  },
  kids: {
    address: '서울 서초구 사평대로57길 135 진빌딩',
    coordinates: {
      lat: 37.5098475066178,
      lng: 127.020633988838,
    },
    label: '키즈센터',
    logoSrc: '/assets/common/logo/logo-kids.svg',
    name: '배우앤배움 키즈센터',
    phone: '1577-9929',
    slug: 'kids',
    summary:
      '아이가 상황을 이해하고 스스로 표현을 찾을 수 있도록 연기 감각과 시선을 깨우는 교육을 진행합니다. 아역 배우에게 필요한 교육과 진로 설계를 전문가와 함께 구성합니다.',
    tabLabel: 'Kids Center',
  },
  avenue: {
    address: '서울 서초구 사평대로55길 126',
   coordinates: {
      lat: 37.5094542308936,
      lng: 127.020560589267,
    },
    label: '애비뉴센터',
    name: '배우앤배움 애비뉴센터',
    phone: '1577-9929',
    slug: 'avenue',
    summary:
      '배우의 개성과 목표에 맞춰 교육, 콘텐츠, 현장 경험을 연결하는 확장형 트레이닝 환경입니다. 기초 훈련부터 실전 준비까지 단계적으로 설계해 더 넓은 무대로 나아갈 수 있도록 돕습니다.',
    tabLabel: 'Avenue Center',
  },
}

export const centerLocationList = centerLocationOrder.map((slug) => centerLocations[slug])
