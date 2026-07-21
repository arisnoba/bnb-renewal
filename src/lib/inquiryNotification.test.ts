import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload } from 'payload'

import type { Inquiry } from '@/payload-types'

import {
  buildInquiryNotificationEmail,
  resolveInquiryNotificationRecipient,
  sendInquiryNotification,
} from './inquiryNotification'

const inquiry: Inquiry = {
  applicantName: '홍길동',
  center: 'exam',
  createdAt: '2026-07-21T03:00:00.000Z',
  displayName: '홍길동',
  id: 42,
  inquiryType: 'admission',
  preferredDate: '2026-07-25T00:00:00.000Z',
  preferredTime: '14:00',
  primaryPhone: '01012345678',
  privacyConsent: true,
  status: 'new',
  updatedAt: '2026-07-21T03:00:00.000Z',
}

test('센터별 수신 주소가 있으면 기본 주소보다 우선한다', () => {
  assert.deepEqual(
    resolveInquiryNotificationRecipient('admission', {
      INQUIRY_NOTIFICATION_EMAIL: 'default@example.com',
      INQUIRY_NOTIFICATION_EMAIL_EXAM: 'exam@example.com',
    }),
    ['exam@example.com'],
  )
})

test('센터별 수신 주소가 없으면 테스트용 기본 주소를 사용한다', () => {
  assert.deepEqual(
    resolveInquiryNotificationRecipient('kids', {
      INQUIRY_NOTIFICATION_EMAIL: 'default@example.com',
    }),
    ['default@example.com'],
  )
})

test('콤마로 구분한 수신 주소의 공백과 중복을 정리한다', () => {
  assert.deepEqual(
    resolveInquiryNotificationRecipient('art', {
      INQUIRY_NOTIFICATION_EMAIL_ART:
        'first@example.com, second@example.com, first@example.com',
    }),
    ['first@example.com', 'second@example.com'],
  )
})

test('알림 메일에 문의 요약과 관리자 상세 링크를 포함한다', () => {
  const message = buildInquiryNotificationEmail(inquiry, {
    NEXT_PUBLIC_SITE_URL: 'https://www.baewooenm.com',
  })

  assert.match(message.subject, /입시센터 새 문의/)
  assert.match(message.text, /신청자: 홍길동/)
  assert.match(message.text, /연락처: 01012345678/)
  assert.match(message.text, /2026-07-25 14:00/)
  assert.match(message.html, /NEW INQUIRY/)
  assert.match(message.html, /background:#B8835A/)
  assert.match(message.html, /관리자에서 문의 확인/)
  assert.match(
    message.html,
    /https:\/\/www\.baewooenm\.com\/admin\/collections\/inquiries\/42/,
  )
})

test('문의자 입력값을 HTML에 안전하게 표시한다', () => {
  const message = buildInquiryNotificationEmail({
    ...inquiry,
    displayName: '<script>alert("xss")</script>',
  })

  assert.doesNotMatch(message.html, /<script>/)
  assert.match(message.html, /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/)
})

test('수신 주소가 설정되면 Payload 메일 어댑터로 전송한다', async () => {
  const sentMessages: unknown[] = []
  const payload = {
    sendEmail: async (message: unknown) => {
      sentMessages.push(message)
      return { id: 'email-id' }
    },
  } as unknown as Pick<Payload, 'sendEmail'>

  const sent = await sendInquiryNotification({
    env: { INQUIRY_NOTIFICATION_EMAIL: 'test@example.com' },
    inquiry,
    payload,
  })

  assert.equal(sent, true)
  assert.equal(sentMessages.length, 1)
  const sentMessage = sentMessages[0] as {
    html: string
    subject: string
    text: string
    to: string[]
  }

  assert.equal(sentMessage.subject, '[배우앤배움] 입시센터 새 문의가 등록되었습니다.')
  assert.match(sentMessage.text, /신청자: 홍길동/)
  assert.match(sentMessage.html, /새 상담 문의가/)
  assert.deepEqual(sentMessage.to, ['test@example.com'])
})

test('수신 주소가 없으면 메일을 전송하지 않는다', async () => {
  let sendCount = 0
  const payload = {
    sendEmail: async () => {
      sendCount += 1
    },
  } as unknown as Pick<Payload, 'sendEmail'>

  const sent = await sendInquiryNotification({ env: {}, inquiry, payload })

  assert.equal(sent, false)
  assert.equal(sendCount, 0)
})
