import type { UIFieldServerComponent } from 'payload'
import type { ReactNode } from 'react'

import { formatAdminDate } from '@/lib/formatAdminDate'

type InquiryRow = {
  label: string
  value: ReactNode
}

type InquiryData = Record<string, unknown>

const inquiryTypeLabels: Record<string, string> = {
  admission: '입시센터',
  art: '아트센터',
  avenue: '애비뉴센터',
  highteen: '하이틴센터',
  kids: '키즈센터',
  partnership: '제휴',
}

const genderLabels: Record<string, string> = {
  female: '여',
  male: '남',
}

const occupationLabels: Record<string, string> = {
  other: '기타',
  student: '학생',
  worker: '직장인',
}

const schoolLevelLabels: Record<string, string> = {
  high: '고등학생',
  middle: '중학생',
  other: '기타',
}

const actingMajorLabels: Record<string, string> = {
  major: '전공',
  nonMajor: '비전공',
}

const yesNoLabels: Record<string, string> = {
  no: '없음',
  yes: '있음',
}

const consentLabels: Record<string, string> = {
  false: '미동의',
  true: '동의',
}

const inquiryTypeTone: Record<string, { background: string; border: string; color: string }> = {
  admission: { background: '#fff7ed', border: '#fed7aa', color: '#9a3412' },
  art: { background: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  avenue: { background: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' },
  highteen: { background: '#ecfdf5', border: '#bbf7d0', color: '#047857' },
  kids: { background: '#fdf2f8', border: '#fbcfe8', color: '#be185d' },
  partnership: { background: '#f8fafc', border: '#cbd5e1', color: '#334155' },
}

const genderTone: Record<string, { background: string; border: string; color: string }> = {
  female: { background: '#fdf2f8', border: '#fbcfe8', color: '#be185d' },
  male: { background: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
}

function textValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return consentLabels[String(value)]
  }

  return String(value)
}

function optionValue(value: unknown, labels: Record<string, string>) {
  if (typeof value !== 'string') {
    return '-'
  }

  return labels[value] ?? value
}

function badgeValue(
  value: unknown,
  labels: Record<string, string>,
  tones: Record<string, { background: string; border: string; color: string }>,
) {
  if (typeof value !== 'string') {
    return '-'
  }

  const tone = tones[value] ?? { background: '#f8fafc', border: '#cbd5e1', color: '#334155' }

  return (
    <span
      style={{
        alignItems: 'center',
        background: tone.background,
        border: `1px solid ${tone.border}`,
        borderRadius: 999,
        color: tone.color,
        display: 'inline-flex',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        padding: '5px 9px',
      }}
    >
      {labels[value] ?? value}
    </span>
  )
}

function attachmentLinkValue({ fileName, url }: { fileName: unknown; url: unknown }) {
  if (typeof url !== 'string' || !url.trim()) {
    return '-'
  }

  const href = url.trim()
  const label = typeof fileName === 'string' && fileName.trim() ? fileName.trim() : '첨부파일 다운로드'

  return (
    <a
      download
      href={href}
      rel="noreferrer"
      style={{ color: 'var(--theme-success-600)', fontWeight: 600 }}
    >
      {label}
    </a>
  )
}

function dateValue(value: unknown) {
  return formatAdminDate(value)
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/[^0-9]/g, '')

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }

  if (digits.startsWith('02')) {
    if (digits.length === 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    }

    if (digits.length === 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return value
}

function phoneLinkValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return '-'
  }

  const digits = value.replace(/[^0-9]/g, '')
  const label = formatPhoneNumber(value.trim())

  return (
    <a href={`tel:${digits}`} style={{ color: 'var(--theme-success-600)', fontWeight: 600 }}>
      {label}
    </a>
  )
}

function emailLinkValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return '-'
  }

  const email = value.trim()

  return (
    <a href={`mailto:${email}`} style={{ color: 'var(--theme-success-600)', fontWeight: 600 }}>
      {email}
    </a>
  )
}

function birthDateValue(value: unknown) {
  if (typeof value !== 'string') {
    return '-'
  }

  const compact = value.replace(/[^0-9]/g, '')

  if (!/^[0-9]{8}$/.test(compact)) {
    return value
  }

  const year = Number(compact.slice(0, 4))
  const month = compact.slice(4, 6)
  const day = compact.slice(6, 8)
  const koreanAge = new Date().getFullYear() - year + 1

  return `${compact.slice(0, 4)}-${month}-${day} (한국나이 ${koreanAge}세)`
}

function compactRows(rows: InquiryRow[]) {
  return rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== '' && row.value !== '-',
  )
}

function commonConsultRows(data: InquiryData): InquiryRow[] {
  return [
    {
      label: '문의/센터',
      value: badgeValue(data.inquiryType, inquiryTypeLabels, inquiryTypeTone),
    },
    { label: '희망일', value: dateValue(data.preferredDate) },
    { label: '희망 시간', value: textValue(data.preferredTime) },
    { label: '이름', value: textValue(data.applicantName) },
    { label: '성별', value: badgeValue(data.gender, genderLabels, genderTone) },
    { label: '생년월일', value: birthDateValue(data.birthDate) },
    {
      label: data.inquiryType === 'kids' ? '보호자 연락처' : '연락처',
      value: data.inquiryType === 'kids' ? phoneLinkValue(data.guardianPhone) : phoneLinkValue(data.phone),
    },
    { label: '사는 지역', value: textValue(data.region) },
  ]
}

function experienceRows(data: InquiryData): InquiryRow[] {
  const rows: InquiryRow[] = []

  if (['art', 'admission', 'highteen'].includes(String(data.inquiryType ?? ''))) {
    rows.push({
      label: '연기 전공/비전공',
      value: optionValue(data.actingMajor, actingMajorLabels),
    })
  }

  rows.push({ label: '트레이닝 경험', value: optionValue(data.hasTraining, yesNoLabels) })

  if (data.inquiryType === 'kids') {
    rows.push({ label: '작품 출연 경험', value: optionValue(data.hasPerformance, yesNoLabels) })
  }

  return rows
}

function sourceRows(data: InquiryData): InquiryRow[] {
  return [
    { label: '유입경로', value: textValue(data.inflowSource) },
    ...(data.inflowSource === '기타'
      ? [{ label: '기타 유입경로', value: textValue(data.inflowSourceOther) }]
      : []),
  ]
}

function consentRows(data: InquiryData): InquiryRow[] {
  return [
    {
      label: '개인정보 동의일시',
      value: dateValue(data.privacyConsentAt ?? data.createdAt),
    },
  ]
}

function buildRows(data: InquiryData): InquiryRow[] {
  if (data.inquiryType === 'partnership') {
    return compactRows([
      {
        label: '문의/센터',
        value: badgeValue(data.inquiryType, inquiryTypeLabels, inquiryTypeTone),
      },
      { label: '회사명', value: textValue(data.companyName) },
      { label: '홈페이지', value: textValue(data.companyWebsite) },
      { label: '직책/지위', value: textValue(data.jobTitle) },
      { label: '담당자 성명', value: textValue(data.contactPersonName) },
      { label: '연락처', value: phoneLinkValue(data.partnerPhone) },
      { label: '이메일', value: emailLinkValue(data.partnerEmail) },
      {
        label: '첨부파일',
        value: attachmentLinkValue({
          fileName: data.attachmentFileName,
          url: data.attachmentUrl,
        }),
      },
      { label: '제휴 내용', value: textValue(data.partnershipContent) },
      ...consentRows(data),
    ])
  }

  const typeSpecificRows: InquiryRow[] = []

  if (data.inquiryType === 'admission') {
    typeSpecificRows.push({ label: '직업 구분', value: optionValue(data.occupation, occupationLabels) })
  }

  if (data.inquiryType === 'highteen') {
    typeSpecificRows.push({ label: '학교 구분', value: optionValue(data.schoolLevel, schoolLevelLabels) })
  }

  return compactRows([
    ...commonConsultRows(data),
    ...typeSpecificRows,
    ...experienceRows(data),
    ...sourceRows(data),
    ...consentRows(data),
  ])
}

export const InquirySummaryField: UIFieldServerComponent = ({ data }) => {
  const rows = buildRows(data && typeof data === 'object' ? (data as InquiryData) : {})

  return (
    <section
      style={{
        border: '1px solid var(--theme-border-color)',
        borderRadius: 'var(--style-radius-s)',
        marginBottom: 'calc(var(--base) * 1.25)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          borderBottom: '1px solid var(--theme-border-color)',
          fontSize: 13,
          fontWeight: 600,
          padding: 'calc(var(--base) * 0.5) calc(var(--base) * 0.75)',
        }}
      >
        접수 정보
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(120px, 180px) minmax(0, 1fr)',
        }}
      >
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'contents',
            }}
          >
            <div
              style={{
                background: 'var(--theme-elevation-50)',
                borderBottom: '1px solid var(--theme-border-color)',
                borderRight: '1px solid var(--theme-border-color)',
                color: 'var(--theme-elevation-700)',
                fontSize: 13,
                fontWeight: 600,
                padding: 'calc(var(--base) * 0.45) calc(var(--base) * 0.6)',
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                borderBottom: '1px solid var(--theme-border-color)',
                fontSize: 13,
                lineHeight: 1.5,
                padding: 'calc(var(--base) * 0.45) calc(var(--base) * 0.6)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
