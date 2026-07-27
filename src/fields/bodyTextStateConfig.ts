export type TextStateStyleConfig = Record<
  string,
  Record<
    string,
    {
      css: Record<string, string>
      label: string
    }
  >
>

export const bodyTextStateConfig: TextStateStyleConfig = {
  fontSize: {
    'font-size-small': {
      css: { 'font-size': '14px' },
      label: '작게 (14px)',
    },
    'font-size-base': {
      css: { 'font-size': '16px' },
      label: '기본 (16px)',
    },
    'font-size-large': {
      css: { 'font-size': '18px' },
      label: '크게 (18px)',
    },
    'font-size-title': {
      css: { 'font-size': '20px' },
      label: '작은 제목 (20px)',
    },
    'font-size-emphasis': {
      css: { 'font-size': '24px' },
      label: '강조 (24px)',
    },
  },
  color: {
    'text-default': {
      css: { color: 'inherit' },
      label: '기본',
    },
    'text-gray': {
      css: { color: '#4D4D4D' },
      label: '회색',
    },
    'text-red': {
      css: { color: '#B91C1C' },
      label: '빨강',
    },
    'text-orange': {
      css: { color: '#C2410C' },
      label: '주황',
    },
    'text-yellow': {
      css: { color: '#A16207' },
      label: '노랑',
    },
    'text-green': {
      css: { color: '#15803D' },
      label: '초록',
    },
    'text-blue': {
      css: { color: '#1D4ED8' },
      label: '파랑',
    },
    'text-purple': {
      css: { color: '#7E22CE' },
      label: '보라',
    },
    'brand-art': {
      css: { color: '#C80000' },
      label: '브랜드 · 아트',
    },
    'brand-exam': {
      css: { color: '#B8835A' },
      label: '브랜드 · 입시 (밝은 배경 주의)',
    },
    'brand-highteen': {
      css: { color: '#8A4FFF' },
      label: '브랜드 · 하이틴',
    },
    'brand-kids': {
      css: { color: '#26C6DD' },
      label: '브랜드 · 키즈 (밝은 배경 주의)',
    },
    'brand-avenue': {
      css: { color: '#DC7037' },
      label: '브랜드 · 애비뉴 (밝은 배경 주의)',
    },
  },
}
