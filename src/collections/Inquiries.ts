import type { Access, CollectionBeforeValidateHook, CollectionConfig, Validate } from 'payload'

import { isGlobalAdminUser, userCenterValue } from './shared'

type InquiryType = 'art' | 'admission' | 'kids' | 'highteen' | 'avenue' | 'partnership'
type InquiryCenter = 'art' | 'exam' | 'kids' | 'highteen' | 'avenue'

const inquiryTypeOptions = [
  { label: '아트', value: 'art' },
  { label: '입시', value: 'admission' },
  { label: '키즈', value: 'kids' },
  { label: '하이틴', value: 'highteen' },
  { label: '애비뉴', value: 'avenue' },
  { label: '제휴', value: 'partnership' },
]

const inquiryCenterOptions = [
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'exam' },
  { label: '키즈센터', value: 'kids' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '애비뉴센터', value: 'avenue' },
]

const genderOptions = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

const occupationOptions = [
  { label: '학생', value: 'student' },
  { label: '직장인', value: 'worker' },
  { label: '기타', value: 'other' },
]

const schoolLevelOptions = [
  { label: '중학생', value: 'middle' },
  { label: '고등학생', value: 'high' },
  { label: '기타', value: 'other' },
]

const actingMajorOptions = [
  { label: '전공', value: 'major' },
  { label: '비전공', value: 'nonMajor' },
]

const yesNoOptions = [
  { label: '있음', value: 'yes' },
  { label: '없음', value: 'no' },
]

const preferredTimeOptions = [
  { label: '오전', value: '오전' },
  { label: '오후', value: '오후' },
  { label: '저녁', value: '저녁' },
  { label: '상담 후 조율', value: '상담 후 조율' },
]

const regionOptions = [
  '서울',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '인천',
  '경기',
  '경남',
  '경북',
  '강원',
  '전남',
  '전북',
  '제주',
  '충남',
  '충북',
  '세종',
].map((region) => ({ label: region, value: region }))

const inflowSourceOptions = ['랜딩', '포털', 'SNS', '네이버카페', '지인소개', 'AI', '기타'].map(
  (source) => ({
    label: source,
    value: source,
  }),
)

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '상담중', value: 'inProgress' },
  { label: '완료', value: 'completed' },
  { label: '스팸', value: 'spam' },
]

const centerByInquiryType: Partial<Record<InquiryType, InquiryCenter>> = {
  admission: 'exam',
  art: 'art',
  avenue: 'avenue',
  highteen: 'highteen',
  kids: 'kids',
}

type InquiryData = {
  applicantName?: string
  center?: InquiryCenter
  companyName?: string
  contactPersonName?: string
  displayName?: string
  inquiryType?: InquiryType
  inflowSource?: string
  partnerPhone?: string
  partnershipContent?: string
  phone?: string
  privacyConsent?: boolean
}

const requiredWhen =
  (
    predicate: (siblingData?: Partial<InquiryData>) => boolean,
    message: string,
  ): Validate<unknown, unknown, Partial<InquiryData>> =>
  (value, { siblingData }) => {
    if (!predicate(siblingData)) {
      return true
    }

    if (typeof value === 'string') {
      return value.trim() ? true : message
    }

    return value ? true : message
  }

const requiredForNonPartnership = (message: string) =>
  requiredWhen((siblingData) => siblingData?.inquiryType !== 'partnership', message)

const requiredForPartnership = (message: string) =>
  requiredWhen((siblingData) => siblingData?.inquiryType === 'partnership', message)

const validateBirthDate: Validate<unknown, unknown, Partial<InquiryData>> = (value, options) => {
  const requiredResult = requiredForNonPartnership('생년월일을 입력해야 합니다.')(value, options)

  if (requiredResult !== true) {
    return requiredResult
  }

  if (options.siblingData?.inquiryType === 'partnership') {
    return true
  }

  return typeof value === 'string' && /^[0-9]{8}$/.test(value.trim())
    ? true
    : '생년월일은 예: 19870725 형식의 숫자 8자로 입력해야 합니다.'
}

const inquiryAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  if (!center) {
    return false
  }

  return {
    center: {
      equals: center,
    },
  }
}

const setDerivedInquiryFields: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  const inquiryType = data.inquiryType as InquiryType | undefined
  const center = inquiryType === 'partnership' ? undefined : centerByInquiryType[inquiryType ?? 'art']
  const companyName = typeof data.companyName === 'string' ? data.companyName.trim() : ''
  const contactPersonName =
    typeof data.contactPersonName === 'string' ? data.contactPersonName.trim() : ''
  const applicantName = typeof data.applicantName === 'string' ? data.applicantName.trim() : ''
  const phone = typeof data.phone === 'string' ? data.phone.trim() : ''
  const guardianPhone = typeof data.guardianPhone === 'string' ? data.guardianPhone.trim() : ''
  const partnerPhone = typeof data.partnerPhone === 'string' ? data.partnerPhone.trim() : ''
  const displayName =
    inquiryType === 'partnership'
      ? [companyName, contactPersonName].filter(Boolean).join(' / ') || '제휴 문의'
      : applicantName || phone || '상담 문의'
  const primaryPhone =
    inquiryType === 'partnership' ? partnerPhone : inquiryType === 'kids' ? guardianPhone : phone

  return {
    ...data,
    center,
    displayName,
    primaryPhone,
  }
}

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: {
    plural: '상담 문의',
    singular: '상담 문의',
  },
  access: {
    create: () => false,
    delete: inquiryAccess,
    read: inquiryAccess,
    update: inquiryAccess,
  },
  admin: {
    defaultColumns: [
      'displayName',
      'inquiryType',
      'primaryPhone',
      'preferredDate',
      'status',
      'createdAt',
    ],
    group: '상담',
    useAsTitle: 'displayName',
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeValidate: [setDerivedInquiryFields],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      label: '목록 표시명',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'inquiryType',
      type: 'select',
      label: '문의 유형',
      admin: {
        hidden: true,
        readOnly: true,
      },
      options: inquiryTypeOptions,
      required: true,
    },
    {
      name: 'center',
      type: 'select',
      label: '상담 센터',
      admin: {
        hidden: true,
        readOnly: true,
      },
      options: inquiryCenterOptions,
    },
    {
      name: 'inquirySummary',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/InquirySummaryField#InquirySummaryField',
        },
        disableListColumn: true,
      },
    },
    {
      name: 'preferredDate',
      type: 'date',
      label: '희망일',
      defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      admin: {
        date: {
          displayFormat: 'yyyy-MM-dd',
          pickerAppearance: 'dayOnly',
        },
        hidden: true,
      },
      validate: requiredForNonPartnership('희망일을 입력해야 합니다.'),
    },
    {
      name: 'preferredTime',
      type: 'select',
      label: '희망 시간',
      admin: {
        hidden: true,
      },
      options: preferredTimeOptions,
      validate: requiredForNonPartnership('희망 시간을 선택해야 합니다.'),
    },
    {
      name: 'applicantName',
      type: 'text',
      label: '이름',
      admin: {
        hidden: true,
      },
      validate: requiredForNonPartnership('이름을 입력해야 합니다.'),
    },
    {
      name: 'gender',
      type: 'radio',
      label: '성별',
      admin: {
        hidden: true,
      },
      options: genderOptions,
      validate: requiredForNonPartnership('성별을 선택해야 합니다.'),
    },
    {
      name: 'birthDate',
      type: 'text',
      label: '생년월일',
      admin: {
        hidden: true,
        placeholder: '예: 19870725',
      },
      validate: validateBirthDate,
    },
    {
      name: 'phone',
      type: 'text',
      label: '연락처',
      admin: {
        hidden: true,
      },
      validate: requiredWhen(
        (siblingData) =>
          siblingData?.inquiryType !== 'partnership' && siblingData?.inquiryType !== 'kids',
        '연락처를 입력해야 합니다.',
      ),
    },
    {
      name: 'guardianPhone',
      type: 'text',
      label: '보호자 연락처',
      admin: {
        hidden: true,
      },
      validate: requiredWhen(
        (siblingData) => siblingData?.inquiryType === 'kids',
        '보호자 연락처를 입력해야 합니다.',
      ),
    },
    {
      name: 'primaryPhone',
      type: 'text',
      label: '대표 연락처',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'region',
      type: 'select',
      label: '사는 지역',
      admin: {
        hidden: true,
      },
      options: regionOptions,
      validate: requiredForNonPartnership('사는 지역을 선택해야 합니다.'),
    },
    {
      name: 'occupation',
      type: 'radio',
      label: '직업 구분',
      admin: {
        hidden: true,
      },
      options: occupationOptions,
      validate: requiredWhen(
        (siblingData) => siblingData?.inquiryType === 'admission',
        '직업 구분을 선택해야 합니다.',
      ),
    },
    {
      name: 'schoolLevel',
      type: 'radio',
      label: '학교 구분',
      admin: {
        hidden: true,
      },
      options: schoolLevelOptions,
      validate: requiredWhen(
        (siblingData) => siblingData?.inquiryType === 'highteen',
        '학교 구분을 선택해야 합니다.',
      ),
    },
    {
      name: 'actingMajor',
      type: 'radio',
      label: '연기 전공/비전공',
      admin: {
        hidden: true,
      },
      options: actingMajorOptions,
      validate: requiredWhen(
        (siblingData) =>
          ['art', 'admission', 'highteen'].includes(String(siblingData?.inquiryType ?? '')),
        '연기 전공 여부를 선택해야 합니다.',
      ),
    },
    {
      name: 'hasTraining',
      type: 'radio',
      label: '트레이닝 경험',
      admin: {
        hidden: true,
      },
      options: yesNoOptions,
      validate: requiredForNonPartnership('트레이닝 경험 여부를 선택해야 합니다.'),
    },
    {
      name: 'hasPerformance',
      type: 'radio',
      label: '작품 출연 경험',
      admin: {
        hidden: true,
      },
      options: yesNoOptions,
      validate: requiredWhen(
        (siblingData) => siblingData?.inquiryType === 'kids',
        '작품 출연 경험 여부를 선택해야 합니다.',
      ),
    },
    {
      name: 'inflowSource',
      type: 'select',
      label: '유입경로',
      admin: {
        hidden: true,
      },
      options: inflowSourceOptions,
      validate: requiredForNonPartnership('유입경로를 선택해야 합니다.'),
    },
    {
      name: 'inflowSourceOther',
      type: 'text',
      label: '기타 유입경로',
      admin: {
        hidden: true,
      },
      validate: requiredWhen(
        (siblingData) => siblingData?.inflowSource === '기타',
        '기타 유입경로를 입력해야 합니다.',
      ),
    },
    {
      name: 'companyName',
      type: 'text',
      label: '회사명',
      admin: {
        hidden: true,
      },
      validate: requiredForPartnership('회사명을 입력해야 합니다.'),
    },
    {
      name: 'companyWebsite',
      type: 'text',
      label: '홈페이지',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'jobTitle',
      type: 'text',
      label: '직책/지위',
      admin: {
        hidden: true,
      },
      validate: requiredForPartnership('직책/지위를 입력해야 합니다.'),
    },
    {
      name: 'contactPersonName',
      type: 'text',
      label: '담당자 성명',
      admin: {
        hidden: true,
      },
      validate: requiredForPartnership('담당자 성명을 입력해야 합니다.'),
    },
    {
      name: 'partnerPhone',
      type: 'text',
      label: '연락처',
      admin: {
        hidden: true,
      },
      validate: requiredForPartnership('연락처를 입력해야 합니다.'),
    },
    {
      name: 'partnerEmail',
      type: 'text',
      label: '이메일',
      admin: {
        hidden: true,
      },
      validate: requiredForPartnership('이메일을 입력해야 합니다.'),
    },
    {
      name: 'attachmentFileName',
      type: 'text',
      label: '첨부파일명',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'attachmentUrl',
      type: 'text',
      label: '첨부파일 URL',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'attachmentObjectKey',
      type: 'text',
      label: '첨부파일 R2 키',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'partnershipContent',
      type: 'textarea',
      label: '제휴 내용',
      admin: {
        hidden: true,
      },
      validate: requiredForPartnership('제휴 내용을 입력해야 합니다.'),
    },
    {
      name: 'privacyConsent',
      type: 'checkbox',
      label: '개인정보 수집 및 이용 동의',
      admin: {
        hidden: true,
      },
      required: true,
    },
    {
      name: 'privacyConsentAt',
      type: 'date',
      label: '개인정보 동의일시',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      label: '상태',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'new',
      options: statusOptions,
      required: true,
    },
    {
      name: 'memo',
      type: 'textarea',
      label: '관리자 메모',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
