export const inquiryTypeValues = [
  'art',
  'admission',
  'highteen',
  'kids',
  'avenue',
  'partnership',
] as const

export type InquiryType = (typeof inquiryTypeValues)[number]

export type ConsultationSearchParams = Record<string, string | string[] | undefined>

const inquiryTypeAliases: Record<string, InquiryType> = {
  admission: 'admission',
  art: 'art',
  avenue: 'avenue',
  exam: 'admission',
  highteen: 'highteen',
  kids: 'kids',
  partnership: 'partnership',
  '아트': 'art',
  '아트센터': 'art',
  '애비뉴': 'avenue',
  '애비뉴센터': 'avenue',
  '입시': 'admission',
  '입시센터': 'admission',
  '제휴': 'partnership',
  '제휴문의': 'partnership',
  '키즈': 'kids',
  '키즈센터': 'kids',
  '하이틴': 'highteen',
  '하이틴센터': 'highteen',
}

const paramNames = ['inquiryType', 'type', 'center']

const centerInquiryTypes: Record<string, InquiryType> = {
  art: 'art',
  avenue: 'avenue',
  exam: 'admission',
  highteen: 'highteen',
  kids: 'kids',
}

export function inquiryTypeFromCenter(center: string): InquiryType {
  return centerInquiryTypes[center] ?? 'art'
}

export function resolveInitialInquiryType(
  searchParams?: ConsultationSearchParams,
  fallback: InquiryType = 'art',
): InquiryType {
  if (!searchParams) {
    return fallback
  }

  for (const paramName of paramNames) {
    const value = firstParamValue(searchParams[paramName])
    const inquiryType = value ? inquiryTypeAliases[value] : undefined

    if (inquiryType) {
      return inquiryType
    }
  }

  return fallback
}

function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
