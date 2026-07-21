import type { Payload } from 'payload'

import type { Inquiry } from '@/payload-types'

type Env = Record<string, string | undefined>
type InquiryType = Inquiry['inquiryType']

const recipientEnvByInquiryType: Record<InquiryType, string> = {
  admission: 'INQUIRY_NOTIFICATION_EMAIL_EXAM',
  art: 'INQUIRY_NOTIFICATION_EMAIL_ART',
  avenue: 'INQUIRY_NOTIFICATION_EMAIL_AVENUE',
  highteen: 'INQUIRY_NOTIFICATION_EMAIL_HIGHTEEN',
  kids: 'INQUIRY_NOTIFICATION_EMAIL_KIDS',
  partnership: 'INQUIRY_NOTIFICATION_EMAIL_PARTNERSHIP',
}

const inquiryTypeLabels: Record<InquiryType, string> = {
  admission: '입시센터',
  art: '아트센터',
  avenue: '애비뉴센터',
  highteen: '하이틴센터',
  kids: '키즈센터',
  partnership: '제휴',
}

const inquiryTypeThemes: Record<
  InquiryType,
  { accent: string; buttonText: string; soft: string }
> = {
  admission: { accent: '#B8835A', buttonText: '#FFFFFF', soft: '#F8F2ED' },
  art: { accent: '#C80000', buttonText: '#FFFFFF', soft: '#FFF1F2' },
  avenue: { accent: '#369982', buttonText: '#FFFFFF', soft: '#ECFDF5' },
  highteen: { accent: '#8A4FFF', buttonText: '#FFFFFF', soft: '#F5F0FF' },
  kids: { accent: '#26C6DD', buttonText: '#102A30', soft: '#ECFEFF' },
  partnership: { accent: '#1F2937', buttonText: '#FFFFFF', soft: '#F3F4F6' },
}

type InquiryNotificationPayload = Pick<Payload, 'sendEmail'>

export function resolveInquiryNotificationRecipient(
  inquiryType: InquiryType,
  env: Env = process.env,
) {
  const centerRecipient = env[recipientEnvByInquiryType[inquiryType]]?.trim()
  const fallbackRecipient = env.INQUIRY_NOTIFICATION_EMAIL?.trim()
  const configuredRecipients = centerRecipient || fallbackRecipient

  if (!configuredRecipients) {
    return null
  }

  const recipients = [...new Set(configuredRecipients.split(',').map((value) => value.trim()))].filter(
    Boolean,
  )

  return recipients.length > 0 ? recipients : null
}

export function buildInquiryNotificationEmail(inquiry: Inquiry, env: Env = process.env) {
  const inquiryLabel = inquiryTypeLabels[inquiry.inquiryType]
  const detailURL = buildInquiryDetailURL(inquiry.id, env.NEXT_PUBLIC_SITE_URL)
  const theme = inquiryTypeThemes[inquiry.inquiryType]
  const preferredSchedule = formatPreferredSchedule(inquiry)
  const createdAt = formatCreatedAt(inquiry.createdAt)
  const lines = [
    '새 상담 문의가 등록되었습니다.',
    '',
    `문의 구분: ${inquiryLabel}`,
    `신청자: ${inquiry.displayName || '-'}`,
    `연락처: ${inquiry.primaryPhone || '-'}`,
    `희망 일시: ${preferredSchedule}`,
    `등록 시각: ${createdAt}`,
  ]

  if (detailURL) {
    lines.push('', `관리자에서 확인: ${detailURL}`)
  }

  return {
    html: buildInquiryNotificationHTML({
      createdAt,
      detailURL,
      inquiry,
      inquiryLabel,
      preferredSchedule,
      theme,
    }),
    subject: `[배우앤배움] ${inquiryLabel} 새 문의가 등록되었습니다.`,
    text: lines.join('\n'),
  }
}

export async function sendInquiryNotification({
  env = process.env,
  inquiry,
  payload,
}: {
  env?: Env
  inquiry: Inquiry
  payload: InquiryNotificationPayload
}) {
  const to = resolveInquiryNotificationRecipient(inquiry.inquiryType, env)

  if (!to) {
    return false
  }

  const message = buildInquiryNotificationEmail(inquiry, env)

  await payload.sendEmail({
    ...message,
    to,
  })

  return true
}

function buildInquiryDetailURL(id: Inquiry['id'], siteURL?: string) {
  if (!siteURL) {
    return null
  }

  try {
    return new URL(`/admin/collections/inquiries/${id}`, siteURL).toString()
  } catch {
    return null
  }
}

function buildInquiryNotificationHTML({
  createdAt,
  detailURL,
  inquiry,
  inquiryLabel,
  preferredSchedule,
  theme,
}: {
  createdAt: string
  detailURL: null | string
  inquiry: Inquiry
  inquiryLabel: string
  preferredSchedule: string
  theme: (typeof inquiryTypeThemes)[InquiryType]
}) {
  const rows = [
    ['문의 구분', inquiryLabel],
    ['신청자', inquiry.displayName || '-'],
    ['연락처', inquiry.primaryPhone || '-'],
    ['희망 일시', preferredSchedule],
    ['등록 시각', createdAt],
  ]
    .map(([label, value]) => buildInfoRow(label, value))
    .join('')
  const action = detailURL
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:32px">
        <tr>
          <td align="center">
            <a href="${escapeHTML(detailURL)}" style="background:${theme.accent};border-radius:10px;color:${theme.buttonText};display:inline-block;font-size:15px;font-weight:700;line-height:52px;padding:0 28px;text-decoration:none">관리자에서 문의 확인</a>
          </td>
        </tr>
      </table>`
    : ''

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>새 상담 문의 알림</title>
  </head>
  <body style="background:#F3F4F6;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',Arial,sans-serif;margin:0;padding:0;word-break:keep-all">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHTML(inquiryLabel)} 새 문의가 등록되었습니다.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F3F4F6">
      <tr>
        <td align="center" style="padding:40px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;max-width:600px;overflow:hidden">
            <tr>
              <td style="background:${theme.accent};font-size:0;height:6px;line-height:6px">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:30px 36px 22px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="color:#111827;font-size:21px;font-weight:800;letter-spacing:-0.5px">배우앤배움</td>
                    <td align="right">
                      <span style="background:${theme.soft};border-radius:999px;color:${theme.accent};display:inline-block;font-size:12px;font-weight:700;line-height:28px;padding:0 12px">${escapeHTML(inquiryLabel)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 38px">
                <p style="color:${theme.accent};font-size:13px;font-weight:700;letter-spacing:0.04em;margin:0 0 10px">NEW INQUIRY</p>
                <h1 style="color:#111827;font-size:28px;font-weight:800;letter-spacing:-0.8px;line-height:1.35;margin:0">새 상담 문의가<br>등록되었습니다.</h1>
                <p style="color:#6B7280;font-size:15px;line-height:1.7;margin:14px 0 0">아래 내용을 확인하고 신청자에게 상담 안내를 진행해 주세요.</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;margin-top:28px;padding:8px 20px">
                  ${rows}
                </table>
                ${action}
              </td>
            </tr>
            <tr>
              <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;color:#9CA3AF;font-size:12px;line-height:1.6;padding:20px 36px">
                이 메일은 상담 문의 등록 시 자동으로 발송되었습니다.<br>
                문의 번호 #${escapeHTML(String(inquiry.id))}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildInfoRow(label: string, value: string) {
  return `<tr>
    <td style="border-bottom:1px solid #E5E7EB;color:#6B7280;font-size:13px;font-weight:600;padding:14px 8px 14px 0;vertical-align:top;width:92px">${escapeHTML(label)}</td>
    <td style="border-bottom:1px solid #E5E7EB;color:#111827;font-size:15px;font-weight:700;line-height:1.5;padding:14px 0;vertical-align:top">${escapeHTML(value)}</td>
  </tr>`
}

function escapeHTML(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '"': '&quot;',
        '&': '&amp;',
        "'": '&#39;',
        '<': '&lt;',
        '>': '&gt;',
      })[character] ?? character,
  )
}

function formatPreferredSchedule(inquiry: Inquiry) {
  const values = [inquiry.preferredDate?.slice(0, 10), inquiry.preferredTime].filter(Boolean)

  return values.length > 0 ? values.join(' ') : '-'
}

function formatCreatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(date)
}
