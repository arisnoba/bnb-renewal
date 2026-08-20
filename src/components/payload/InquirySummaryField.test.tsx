import { strict as assert } from 'node:assert'
import test from 'node:test'

import { renderToStaticMarkup } from 'react-dom/server'
import type { ComponentType } from 'react'

import { InquirySummaryField } from './InquirySummaryField'

const TestInquirySummaryField = InquirySummaryField as unknown as ComponentType<{
  clientField: { admin: Record<string, never>; name: string }
  data: Record<string, unknown>
  field: { admin: Record<string, never>; name: string; type: 'ui' }
  path: string
}>

test('partnership attachment link uses the authenticated download route', () => {
  const html = renderToStaticMarkup(
    <TestInquirySummaryField
      clientField={{ admin: {}, name: 'summary' }}
      data={{
        attachmentFileName: 'proposal.pdf',
        attachmentObjectKey: 'inquiries/attachments/partnership/2026/07/proposal.pdf',
        companyName: '배우앤배움',
        id: 12,
        inquiryType: 'partnership',
      }}
      field={{ admin: {}, name: 'summary', type: 'ui' }}
      path="summary"
    />,
  )

  assert.match(html, /href="\/api\/inquiries\/12\/attachment"/)
  assert.match(html, /download=""/)
  assert.doesNotMatch(html, /target="_blank"/)
})

test('consultation summary separates customer request, current reservation, and history', () => {
  const html = renderToStaticMarkup(
    <TestInquirySummaryField
      clientField={{ admin: {}, name: 'summary' }}
      data={{
        applicantName: '홍길동',
        consultationHistory: [
          {
            action: 'reservationConfirmed',
            changedAt: '2026-08-19T05:32:00.000Z',
            changedBy: '로컬 관리자',
            fromStatus: 'new',
            toScheduledAt: '2026-08-21T06:00:00.000Z',
            toStatus: 'inProgress',
          },
          {
            action: 'rescheduled',
            changedAt: '2026-08-20T01:10:00.000Z',
            changedBy: '로컬 관리자',
            fromScheduledAt: '2026-08-21T06:00:00.000Z',
            fromStatus: 'inProgress',
            toScheduledAt: '2026-08-22T07:00:00.000Z',
            toStatus: 'inProgress',
          },
        ],
        gender: 'male',
        hasPerformance: 'no',
        hasTraining: 'yes',
        inquiryType: 'kids',
        preferredDate: '2026-08-19T00:00:00.000Z',
        preferredTime: '14:00',
        scheduledAt: '2026-08-22T07:00:00.000Z',
        status: 'completed',
      }}
      field={{ admin: {}, name: 'summary', type: 'ui' }}
      path="summary"
    />,
  )

  assert.doesNotMatch(html, />접수 정보</)
  assert.match(html, /고객 요청 정보/)
  assert.match(html, /고객 희망일\/시간/)
  assert.match(html, /2026-08-19 14:00/)
  assert.doesNotMatch(html, /고객 희망 시간/)
  assert.match(html, /이름\/성별/)
  assert.match(html, /홍길동 \/ 남/)
  assert.doesNotMatch(html, />성별</)
  assert.match(html, /트레이닝 경험/)
  assert.match(html, /aria-label="있음"/)
  assert.match(html, /작품 출연 경험/)
  assert.match(html, /aria-label="없음">-<\/span>/)
  assert.match(html, /현재 예약 정보/)
  assert.match(html, /확정 상담 일시/)
  assert.match(html, /<strong[^>]*>2026-08-22 16:00<\/strong>/)
  assert.match(html, /상담 완료/)
  assert.match(html, /상담 관리 이력/)
  assert.match(html, /일정 변경/)
  assert.match(html, /예약 확정/)
  assert.doesNotMatch(html, /border-radius:999px[^>]*>일정 변경/)
  assert.match(html, /2026-08-21 15:00 → 2026-08-22 16:00/)
  assert.doesNotMatch(html, /미정 → 2026-08-21 15:00/)
  assert.match(html, /2026-08-20 10:10 · 로컬 관리자/)
  assert.match(html, /로컬 관리자/)
  assert.ok(html.indexOf('일정 변경') < html.indexOf('예약 확정'))
})
