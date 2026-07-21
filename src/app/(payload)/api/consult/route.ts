import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

import {
  INQUIRY_ATTACHMENT_MAX_BYTES,
} from '@/lib/inquiryAttachment'
import { sendInquiryNotification } from '@/lib/inquiryNotification'
import { consumeRateLimit, rateLimitHeaders } from '@/lib/apiRateLimit'
import { getPayloadClient } from '@/lib/payload'
import {
  deletePrivateR2Object,
  hasPrivateR2Config,
  uploadPrivateR2Object,
} from '@/lib/privateR2'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
  CONSULT_ATTACHMENT_UPLOAD_TYPES,
  validateUploadedFile,
} from '@/lib/uploadFileValidation'
import type { Inquiry } from '@/payload-types'

type InquiryType = Inquiry['inquiryType']

const inquiryTypes = new Set<InquiryType>([
  'admission',
  'art',
  'avenue',
  'highteen',
  'kids',
  'partnership',
])
const singleValueFields = [
  'actingMajor',
  'applicantName',
  'birthDate',
  'companyName',
  'companyWebsite',
  'contactPersonName',
  'gender',
  'guardianPhone',
  'hasPerformance',
  'hasTraining',
  'inflowSource',
  'inflowSourceOther',
  'jobTitle',
  'occupation',
  'partnerEmail',
  'partnerPhone',
  'partnershipContent',
  'phone',
  'preferredDate',
  'preferredTime',
  'region',
  'schoolLevel',
] as const
const phoneFields = new Set(['guardianPhone', 'partnerPhone', 'phone'])
const maxAttachmentCount = 1

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    limit: 5,
    scope: 'consult',
    windowMs: 10 * 60 * 1_000,
  }).catch((error) => {
    console.error('[consult] failed to check rate limit', error)
    return null
  })

  if (!rateLimit) {
    return jsonError('rate-limit-unavailable', 503)
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'too-many-requests', success: false },
      { headers: rateLimitHeaders(rateLimit), status: 429 },
    )
  }

  const formData = await request.formData().catch(() => null)

  if (!formData) {
    return jsonError('invalid-form-data', 400)
  }

  const token = stringValue(formData, 'cf-turnstile-response')

  if (!token) {
    return jsonError('missing-turnstile-token', 400)
  }

  const remoteIp =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const verification = await verifyTurnstileToken(token, remoteIp)

  if (!verification.success) {
    return NextResponse.json(
      {
        error: 'turnstile-verification-failed',
        errorCodes: verification.errorCodes,
        success: false,
      },
      { status: 400 },
    )
  }

  const inquiryType = stringValue(formData, 'inquiryType')

  if (!isInquiryType(inquiryType)) {
    return jsonError('invalid-inquiry-type', 400)
  }

  const privacyConsent = stringValue(formData, 'privacyConsent') === 'true'

  if (!privacyConsent) {
    return jsonError('privacy-consent-required', 400)
  }

  if (inquiryType === 'partnership') {
    if (!isValidKoreanPhoneNumber(stringValue(formData, 'partnerPhone'))) {
      return jsonError('invalid-phone-number', 400)
    }
  } else {
    if (!isValidBirthDate(stringValue(formData, 'birthDate'))) {
      return jsonError('invalid-birth-date', 400)
    }

    if (!isValidPreferredDate(stringValue(formData, 'preferredDate'))) {
      return jsonError('invalid-preferred-date', 400)
    }

    const phoneField = inquiryType === 'kids' ? 'guardianPhone' : 'phone'

    if (!isValidKoreanPhoneNumber(stringValue(formData, phoneField))) {
      return jsonError('invalid-phone-number', 400)
    }
  }

  if (!(await hasValidAttachments(formData))) {
    return jsonError('invalid-attachment', 400)
  }

  if (hasAttachment(formData) && !hasPrivateR2Config()) {
    return jsonError('attachment-storage-unavailable', 500)
  }

  let uploadedAttachment: UploadedAttachment | null = null

  try {
    const payload = await getPayloadClient()
    uploadedAttachment = await uploadAttachment(formData, inquiryType)
    const data: Record<string, unknown> = {
      inquiryType,
      privacyConsent,
      privacyConsentAt: new Date().toISOString(),
      status: 'new',
    }

    for (const field of singleValueFields) {
      const value = stringValue(formData, field)

      if (value) {
        data[field] = phoneFields.has(field) ? normalizePhoneNumber(value) : value
      }
    }

    if (uploadedAttachment) {
      data.attachmentFileName = uploadedAttachment.fileName
      data.attachmentObjectKey = uploadedAttachment.objectKey
    }

    const inquiry = await payload.create({
      collection: 'inquiries',
      data: data as never,
      overrideAccess: true,
    })

    await sendInquiryNotification({ inquiry, payload }).catch((error) => {
      console.error('[consult] failed to send inquiry notification', {
        error,
        inquiryId: inquiry.id,
      })
    })

    return NextResponse.json({
      id: inquiry.id,
      success: true,
    })
  } catch (error) {
    if (uploadedAttachment) {
      await deletePrivateR2Object(uploadedAttachment.objectKey).catch(() => undefined)
    }

    console.error('[consult] failed to create inquiry', error)

    return jsonError('inquiry-create-failed', 500)
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status })
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === 'string' ? value.trim() : ''
}

function isInquiryType(value: string): value is InquiryType {
  return inquiryTypes.has(value as InquiryType)
}

function isValidBirthDate(value: string) {
  if (!/^[0-9]{8}$/.test(value)) {
    return false
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))

  if (year < 1900) {
    return false
  }

  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false
  }

  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return date <= todayDate
}

function isValidPreferredDate(value: string) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
    return false
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false
  }

  return value >= getEarliestPreferredDateValue()
}

function getEarliestPreferredDateValue(date = new Date()) {
  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)

  koreaDate.setUTCDate(koreaDate.getUTCDate() + 1)

  const year = koreaDate.getUTCFullYear()
  const month = String(koreaDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(koreaDate.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, '')
}

function isValidKoreanPhoneNumber(value: string) {
  const trimmedValue = value.trim()

  if (!/^[0-9\s-]+$/.test(trimmedValue)) {
    return false
  }

  const digits = normalizePhoneNumber(trimmedValue)

  return (
    /^01[016789][0-9]{7,8}$/.test(digits) ||
    /^02[0-9]{7,8}$/.test(digits) ||
    /^0(?:3[1-3]|4[1-4]|5[1-5]|6[1-4])[0-9]{7,8}$/.test(digits) ||
    /^0(?:50[0-9]|70|80)[0-9]{7,8}$/.test(digits) ||
    /^1[568][0-9]{6}$/.test(digits)
  )
}

async function hasValidAttachments(formData: FormData) {
  const files = formData
    .getAll('attachment')
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (files.length > maxAttachmentCount) {
    return false
  }

  const validations = await Promise.all(
    files.map(async (file) => {
      if (file.size > INQUIRY_ATTACHMENT_MAX_BYTES) {
        return false
      }

      return validateUploadedFile({
        allowedTypes: CONSULT_ATTACHMENT_UPLOAD_TYPES,
        bytes: new Uint8Array(await file.arrayBuffer()),
        fileName: safeFileName(file.name || 'attachment'),
        mimeType: file.type,
      }).valid
    }),
  )

  return validations.every(Boolean)
}

function hasAttachment(formData: FormData) {
  return formData
    .getAll('attachment')
    .some((value): value is File => value instanceof File && value.size > 0)
}

type UploadedAttachment = {
  fileName: string
  objectKey: string
}

async function uploadAttachment(
  formData: FormData,
  inquiryType: InquiryType,
): Promise<UploadedAttachment | null> {
  const file = formData
    .getAll('attachment')
    .find((value): value is File => value instanceof File && value.size > 0)

  if (!file) {
    return null
  }

  const safeName = safeFileName(file.name || 'attachment')
  const uploaded = await uploadPrivateR2Object({
    body: Buffer.from(await file.arrayBuffer()),
    cacheControl: 'private, max-age=0, no-store',
    contentDisposition: `attachment; filename="${safeName}"`,
    contentType: file.type || 'application/octet-stream',
    key: buildAttachmentObjectKey(inquiryType, safeName),
  })

  return {
    fileName: safeName,
    objectKey: uploaded.objectKey,
  }
}

function buildAttachmentObjectKey(inquiryType: InquiryType, fileName: string) {
  const now = new Date()
  const koreaDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const year = koreaDate.getUTCFullYear()
  const month = String(koreaDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(koreaDate.getUTCDate()).padStart(2, '0')

  return path.posix.join(
    'inquiries',
    'attachments',
    inquiryType,
    String(year),
    month,
    day,
    `${randomUUID()}-${fileName}`,
  )
}

function safeFileName(value: string) {
  const basename = path.basename(value).replace(/[^a-zA-Z0-9._-]+/g, '-')

  return basename || 'attachment'
}
