import { NextResponse } from 'next/server'

import {
  attachmentContentDisposition,
  isInquiryAttachmentObjectKey,
} from '@/lib/inquiryAttachment'
import { getPayloadClient } from '@/lib/payload'
import { getPrivateR2Object, hasPrivateR2Config } from '@/lib/privateR2'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: RouteContext) {
  const { id: rawID } = await params
  const id = Number(rawID)

  if (!Number.isSafeInteger(id) || id <= 0) {
    return jsonError('첨부파일을 찾을 수 없습니다.', 404)
  }

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('로그인이 필요합니다.', 401)
  }

  let inquiry: {
    attachmentFileName?: string | null
    attachmentObjectKey?: string | null
  }

  try {
    inquiry = await payload.findByID({
      collection: 'inquiries',
      depth: 0,
      id,
      overrideAccess: false,
      select: {
        attachmentFileName: true,
        attachmentObjectKey: true,
      },
      user,
    })
  } catch {
    return jsonError('첨부파일을 찾을 수 없습니다.', 404)
  }

  if (!isInquiryAttachmentObjectKey(inquiry.attachmentObjectKey)) {
    return jsonError('첨부파일을 찾을 수 없습니다.', 404)
  }

  if (!hasPrivateR2Config()) {
    return jsonError('첨부파일 저장소가 설정되지 않았습니다.', 503)
  }

  try {
    const object = await getPrivateR2Object(inquiry.attachmentObjectKey)
    const headers = new Headers({
      'Cache-Control': 'private, max-age=0, no-store',
      'Content-Disposition': attachmentContentDisposition(
        inquiry.attachmentFileName ?? 'attachment',
      ),
      'Content-Type': object.contentType ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    })

    if (typeof object.contentLength === 'number') {
      headers.set('Content-Length', String(object.contentLength))
    }

    const body = new ArrayBuffer(object.body.byteLength)

    new Uint8Array(body).set(object.body)

    return new Response(body, {
      headers,
      status: 200,
    })
  } catch (error) {
    const status = storageErrorStatus(error)

    if (status >= 500) {
      console.error('[inquiry-attachment] failed to read private object', {
        error,
        inquiryId: id,
      })
    }

    return jsonError(
      status === 404 ? '첨부파일을 찾을 수 없습니다.' : '첨부파일을 불러오지 못했습니다.',
      status,
    )
  }
}

function storageErrorStatus(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    ('name' in error || '$metadata' in error)
  ) {
    const name = 'name' in error ? error.name : undefined
    const metadata = '$metadata' in error ? error.$metadata : undefined
    const status =
      metadata && typeof metadata === 'object' && 'httpStatusCode' in metadata
        ? metadata.httpStatusCode
        : undefined

    if (name === 'NoSuchKey' || status === 404) {
      return 404
    }
  }

  return 500
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
