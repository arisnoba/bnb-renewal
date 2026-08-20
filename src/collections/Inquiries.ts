import type {
  Access,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
} from 'payload'

import { isGlobalAdminUser, userCenterValue } from './shared'

type InquiryType = 'art' | 'admission' | 'kids' | 'highteen' | 'avenue' | 'partnership'
type InquiryCenter = 'art' | 'exam' | 'kids' | 'highteen' | 'avenue'
type InquiryStatus = 'new' | 'inProgress' | 'completed' | 'spam'
type ConsultationHistoryAction =
  | 'reservationConfirmed'
  | 'scheduleSet'
  | 'rescheduled'
  | 'scheduleCleared'
  | 'statusChanged'

type ConsultationHistoryEntry = {
  action: ConsultationHistoryAction
  changedAt: string
  changedBy: string
  changedById?: string
  fromScheduledAt?: string
  fromStatus?: InquiryStatus
  toScheduledAt?: string
  toStatus?: InquiryStatus
}

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
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
].map((time) => ({ label: time, value: time }))

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

const inflowSourceOptions = [
  '포털 사이트(구글, 네이버)',
  'SNS(인스타그램, 스레드 등)',
  '유튜브',
  '네이버카페',
  '지인소개',
  'AI(GPT, gemini, claude)',
  '기타',
].map((source) => ({
  label: source,
  value: source,
}))

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '예약 완료', value: 'inProgress' },
  { label: '상담 완료', value: 'completed' },
  { label: '상담 취소', value: 'spam' },
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
  consultationHistory?: ConsultationHistoryEntry[]
  contactPersonName?: string
  displayName?: string
  inquiryType?: InquiryType
  inflowSource?: string
  partnerPhone?: string
  partnershipContent?: string
  phone?: string
  privacyConsent?: boolean
  scheduledAt?: string | null
  status?: InquiryStatus
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

const statusRequiresScheduledAt: Validate<unknown, unknown, Partial<InquiryData>> = (
  value,
  { event, previousValue, siblingData },
) => {
  if (
    event !== 'submit' ||
    siblingData?.inquiryType === 'partnership' ||
    typeof value !== 'string'
  ) {
    return true
  }

  const isEnteringReservation = value === 'inProgress' && previousValue !== 'inProgress'
  const isCompletingNewInquiry = value === 'completed' && previousValue === 'new'

  if ((isEnteringReservation || isCompletingNewInquiry) && !siblingData?.scheduledAt) {
    return '예약 완료 또는 상담 완료로 변경하려면 확정 상담 일시를 입력해야 합니다.'
  }

  return true
}

const preventClearingManagedSchedule: Validate<unknown, unknown, Partial<InquiryData>> = (
  value,
  { event, previousValue, siblingData },
) => {
  if (
    event === 'submit' &&
    previousValue &&
    !value &&
    (siblingData?.status === 'inProgress' || siblingData?.status === 'completed')
  ) {
    return '예약 완료 또는 상담 완료 상태에서는 확정 상담 일시를 비울 수 없습니다.'
  }

  return true
}

function dateTimeValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function inquiryStatusValue(value: unknown): InquiryStatus | undefined {
  return ['new', 'inProgress', 'completed', 'spam'].includes(String(value))
    ? (value as InquiryStatus)
    : undefined
}

function historyAction({
  fromScheduledAt,
  fromStatus,
  toScheduledAt,
  toStatus,
}: {
  fromScheduledAt?: string
  fromStatus?: InquiryStatus
  toScheduledAt?: string
  toStatus?: InquiryStatus
}): ConsultationHistoryAction {
  if (toStatus === 'inProgress' && fromStatus !== 'inProgress') {
    return 'reservationConfirmed'
  }

  if (!fromScheduledAt && toScheduledAt) {
    return 'scheduleSet'
  }

  if (fromScheduledAt && !toScheduledAt) {
    return 'scheduleCleared'
  }

  if (fromScheduledAt !== toScheduledAt) {
    return 'rescheduled'
  }

  return 'statusChanged'
}

export const appendConsultationHistory: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data
  }

  if (operation !== 'update' || !originalDoc) {
    return {
      ...data,
      consultationHistory: [],
    }
  }

  const previousHistory = Array.isArray(originalDoc.consultationHistory)
    ? originalDoc.consultationHistory
    : []
  const inquiryType = (data.inquiryType ?? originalDoc.inquiryType) as InquiryType | undefined

  if (inquiryType === 'partnership') {
    return {
      ...data,
      consultationHistory: previousHistory,
    }
  }

  const fromScheduledAt = dateTimeValue(originalDoc.scheduledAt)
  const fromStatus = inquiryStatusValue(originalDoc.status)
  const toScheduledAt = dateTimeValue(
    Object.prototype.hasOwnProperty.call(data, 'scheduledAt')
      ? data.scheduledAt
      : originalDoc.scheduledAt,
  )
  const toStatus = inquiryStatusValue(
    Object.prototype.hasOwnProperty.call(data, 'status') ? data.status : originalDoc.status,
  )

  if (fromScheduledAt === toScheduledAt && fromStatus === toStatus) {
    return {
      ...data,
      consultationHistory: previousHistory,
    }
  }

  const user = req.user as { email?: string; id?: number | string; name?: string } | null | undefined
  const entry: ConsultationHistoryEntry = {
    action: historyAction({ fromScheduledAt, fromStatus, toScheduledAt, toStatus }),
    changedAt: new Date().toISOString(),
    changedBy: user?.name?.trim() || user?.email?.trim() || '시스템',
    changedById: user?.id === undefined ? undefined : String(user.id),
    fromScheduledAt,
    fromStatus,
    toScheduledAt,
    toStatus,
  }

  return {
    ...data,
    consultationHistory: [...previousHistory, entry],
  }
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

export const setDerivedInquiryFields: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) {
    return data
  }

  const inquiryType = (data.inquiryType ?? originalDoc?.inquiryType) as InquiryType | undefined
  const center = inquiryType === 'partnership' ? undefined : centerByInquiryType[inquiryType ?? 'art']
  const stringValue = (field: string) => {
    const value = data[field] ?? originalDoc?.[field]

    return typeof value === 'string' ? value.trim() : ''
  }
  const companyName = stringValue('companyName')
  const contactPersonName =
    stringValue('contactPersonName')
  const applicantName = stringValue('applicantName')
  const phone = stringValue('phone')
  const guardianPhone = stringValue('guardianPhone')
  const partnerPhone = stringValue('partnerPhone')
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
    components: {
      edit: {
        SaveButton: '@/components/payload/InquirySaveButton#InquirySaveButton',
      },
    },
    defaultColumns: [
      'displayName',
      'inquiryType',
      'primaryPhone',
      'preferredDate',
      'scheduledAt',
      'status',
      'createdAt',
    ],
    group: '상담',
    useAsTitle: 'displayName',
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [appendConsultationHistory],
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
      label: '고객 희망일',
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
      label: '고객 희망 시간',
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
      name: 'scheduledAt',
      type: 'date',
      label: '확정 상담 일시',
      admin: {
        condition: (_data, siblingData) => siblingData?.inquiryType !== 'partnership',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
          pickerAppearance: 'dayAndTime',
        },
        description: '고객과 조율을 마친 실제 상담 일시를 입력합니다.',
        position: 'sidebar',
      },
      index: true,
      validate: preventClearingManagedSchedule,
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
      validate: statusRequiresScheduledAt,
    },
    {
      name: 'memo',
      type: 'textarea',
      label: '관리자 메모',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'consultationHistory',
      type: 'array',
      label: '상담 관리 이력',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'action',
          type: 'text',
          label: '작업',
          required: true,
        },
        {
          name: 'fromScheduledAt',
          type: 'date',
          label: '변경 전 상담 일시',
        },
        {
          name: 'toScheduledAt',
          type: 'date',
          label: '변경 후 상담 일시',
        },
        {
          name: 'fromStatus',
          type: 'text',
          label: '변경 전 상태',
        },
        {
          name: 'toStatus',
          type: 'text',
          label: '변경 후 상태',
        },
        {
          name: 'changedAt',
          type: 'date',
          label: '변경 일시',
          required: true,
        },
        {
          name: 'changedBy',
          type: 'text',
          label: '변경 관리자',
          required: true,
        },
        {
          name: 'changedById',
          type: 'text',
          label: '변경 관리자 ID',
        },
      ],
    },
  ],
}
