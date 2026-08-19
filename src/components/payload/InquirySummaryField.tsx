import type { UIFieldServerComponent } from 'payload'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

import {
  formatAdminDate,
  formatAdminFullDate,
  formatAdminFullDateOnly,
} from '@/lib/formatAdminDate'
import { inquiryAttachmentDownloadPath } from '@/lib/inquiryAttachment'

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

const consentLabels: Record<string, string> = {
  false: '미동의',
  true: '동의',
}

const statusLabels: Record<string, string> = {
  completed: '완료',
  inProgress: '예약 완료',
  new: '신규',
  spam: '스팸',
}

const historyActionLabels: Record<string, string> = {
  reservationConfirmed: '예약 확정',
  rescheduled: '일정 변경',
  scheduleCleared: '일정 삭제',
  scheduleSet: '일시 입력',
  statusChanged: '상태 변경',
}

const statusTone: Record<string, { background: string; border: string; color: string }> = {
  completed: { background: '#f8fafc', border: '#cbd5e1', color: '#475569' },
  inProgress: { background: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
  new: { background: '#fffbeb', border: '#fde68a', color: '#a16207' },
  spam: { background: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
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

function attachmentLinkValue({
  fileName,
  inquiryId,
  objectKey,
}: {
  fileName: unknown
  inquiryId: unknown
  objectKey: unknown
}) {
  const href = inquiryAttachmentDownloadPath(inquiryId, objectKey)

  if (!href) {
    return '-'
  }

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

function fullDateValue(value: unknown) {
  return formatAdminFullDate(value)
}

function preferredDateTimeValue(data: InquiryData) {
  const date = formatAdminFullDateOnly(data.preferredDate)
  const time = textValue(data.preferredTime)
  const parts = [date, time].filter((part) => part !== '-')

  return parts.length > 0 ? parts.join(' ') : '-'
}

function nameAndGenderValue(data: InquiryData) {
  const name = textValue(data.applicantName)
  const gender = optionValue(data.gender, genderLabels)
  const parts = [name, gender].filter((part) => part !== '-')

  return parts.length > 0 ? parts.join(' / ') : '-'
}

function experienceValue(value: unknown) {
  if (value === 'yes') {
    return (
      <span
        aria-label="있음"
        style={{ alignItems: 'center', color: 'var(--theme-success-600)', display: 'inline-flex' }}
        title="있음"
      >
        <Check aria-hidden="true" size={16} strokeWidth={2.5} />
      </span>
    )
  }

  if (value === 'no') {
    return <span aria-label="없음">-</span>
  }

  return textValue(value)
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
      value: optionValue(data.inquiryType, inquiryTypeLabels),
    },
    { label: '고객 희망일/시간', value: preferredDateTimeValue(data) },
    { label: '이름/성별', value: nameAndGenderValue(data) },
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

  rows.push({ label: '트레이닝 경험', value: experienceValue(data.hasTraining) })

  if (data.inquiryType === 'kids') {
    rows.push({ label: '작품 출연 경험', value: experienceValue(data.hasPerformance) })
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
        value: optionValue(data.inquiryType, inquiryTypeLabels),
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
          inquiryId: data.id,
          objectKey: data.attachmentObjectKey,
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

function scheduleRows(data: InquiryData): InquiryRow[] {
  return [
    {
      label: '확정 상담 일시',
      value: <strong style={{ fontWeight: 700 }}>{fullDateValue(data.scheduledAt)}</strong>,
    },
    { label: '현재 상태', value: badgeValue(data.status, statusLabels, statusTone) },
  ]
}

function historyEntries(data: InquiryData) {
  if (!Array.isArray(data.consultationHistory)) {
    return []
  }

  return [...data.consultationHistory]
    .filter((entry): entry is InquiryData => Boolean(entry && typeof entry === 'object'))
    .reverse()
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        borderBottom: '1px solid var(--theme-border-color)',
        color: 'var(--theme-elevation-800)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        padding: 'calc(var(--base) * 0.45) calc(var(--base) * 0.75)',
      }}
    >
      {children}
    </div>
  )
}

function RowsGrid({ rows }: { rows: InquiryRow[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 180px) minmax(0, 1fr)',
      }}
    >
      {rows.map((row, index) => {
        const borderBottom = index === rows.length - 1 ? 'none' : '1px solid var(--theme-border-color)'

        return (
        <div key={row.label} style={{ display: 'contents' }}>
          <div
            style={{
              background: 'var(--theme-elevation-50)',
              borderBottom,
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
              borderBottom,
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
        )
      })}
    </div>
  )
}

function InfoTable({ rows, title }: { rows: InquiryRow[]; title: string }) {
  return (
    <section
      aria-label={title}
      style={{
        border: '1px solid var(--theme-border-color)',
        borderRadius: 'var(--style-radius-s)',
        overflow: 'hidden',
      }}
    >
      <SectionHeading>{title}</SectionHeading>
      <RowsGrid rows={rows} />
    </section>
  )
}

function historySummary(entry: InquiryData) {
  const action = typeof entry.action === 'string' ? entry.action : undefined
  const fromStatus = entry.fromStatus ? optionValue(entry.fromStatus, statusLabels) : '미정'
  const toStatus = entry.toStatus ? optionValue(entry.toStatus, statusLabels) : '미정'
  const fromScheduledAt = entry.fromScheduledAt ? fullDateValue(entry.fromScheduledAt) : '미정'
  const toScheduledAt = entry.toScheduledAt ? fullDateValue(entry.toScheduledAt) : '미정'
  const statusChanged = fromStatus !== toStatus
  const scheduleChanged = fromScheduledAt !== toScheduledAt

  if (action === 'reservationConfirmed') {
    return toScheduledAt !== '미정' ? toScheduledAt : toStatus
  }

  if (action === 'scheduleSet') {
    return toScheduledAt
  }

  if (action === 'scheduleCleared') {
    return fromScheduledAt
  }

  const changes = [
    scheduleChanged ? `${fromScheduledAt} → ${toScheduledAt}` : null,
    statusChanged ? `${fromStatus} → ${toStatus}` : null,
  ].filter((change): change is string => Boolean(change))

  return changes.join(' · ') || '상담 정보 변경'
}

function ConsultationHistory({ data }: { data: InquiryData }) {
  const entries = historyEntries(data)

  if (entries.length === 0) {
    return (
      <p
        style={{
          color: 'var(--theme-elevation-400)',
          fontSize: 12,
          margin: 0,
          padding: 'calc(var(--base) * 0.35) 0',
        }}
      >
        아직 저장된 상담 관리 이력이 없습니다.
      </p>
    )
  }

  return (
    <ol
      style={{
        display: 'grid',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {entries.map((entry, index) => {
        const action =
          typeof entry.action === 'string'
            ? (historyActionLabels[entry.action] ?? entry.action)
            : '상담 정보 변경'
        const summary = historySummary(entry)
        const changedBy = textValue(entry.changedBy)
        const changedAt = fullDateValue(entry.changedAt)
        const key = typeof entry.id === 'string' || typeof entry.id === 'number' ? entry.id : index

        return (
          <li
            key={key}
            style={{
              alignItems: 'center',
              borderBottom:
                index === entries.length - 1 ? 'none' : '1px solid var(--theme-elevation-100)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'calc(var(--base) * 0.45)',
              padding: 'calc(var(--base) * 0.4) 0',
            }}
          >
            <span
              style={{
                color: 'var(--theme-elevation-500)',
                flex: '0 0 auto',
                fontSize: 12,
                fontWeight: 600,
                minWidth: 64,
              }}
            >
              {action}
            </span>
            <strong
              style={{
                flex: '1 1 220px',
                color: 'var(--theme-elevation-700)',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
                minWidth: 0,
                wordBreak: 'break-word',
              }}
            >
              {summary}
            </strong>
            <span
              style={{
                color: 'var(--theme-elevation-400)',
                flex: '0 1 auto',
                fontSize: 12,
                marginLeft: 'auto',
              }}
            >
              {changedAt} · {changedBy}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export const InquirySummaryField: UIFieldServerComponent = ({ data }) => {
  const inquiryData = data && typeof data === 'object' ? (data as InquiryData) : {}
  const rows = buildRows(inquiryData)
  const isConsultation = inquiryData.inquiryType !== 'partnership'

  return (
    <div
      style={{
        display: 'grid',
        gap: 'calc(var(--base) * 0.65)',
        marginBottom: 'calc(var(--base) * 1.25)',
      }}
    >
      <InfoTable rows={rows} title={isConsultation ? '고객 요청 정보' : '제휴 문의 정보'} />
      {isConsultation ? (
        <>
          <InfoTable rows={scheduleRows(inquiryData)} title="현재 예약 정보" />
          <section
            aria-label="상담 관리 이력"
            style={{
              marginTop: 'calc(var(--base) * 0.15)',
              padding: '0 calc(var(--base) * 0.15)',
            }}
          >
            <div
              style={{
                color: 'var(--theme-elevation-500)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.02em',
                marginBottom: 'calc(var(--base) * 0.15)',
              }}
            >
              상담 관리 이력
            </div>
            <ConsultationHistory data={inquiryData} />
          </section>
        </>
      ) : null}
    </div>
  )
}
