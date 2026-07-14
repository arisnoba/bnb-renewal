import pg from 'pg'

import { attachmentContentDisposition, isInquiryAttachmentObjectKey } from '../../src/lib/inquiryAttachment'
import { resolvePayloadDatabaseURL } from '../../src/lib/payloadDatabaseURL'
import {
  destroyPrivateR2Client,
  getPrivateR2Object,
  hasPrivateR2Config,
  uploadPrivateR2Object,
} from '../../src/lib/privateR2'
import { deleteR2Object, destroyR2Client, getR2Object } from '../../src/lib/r2'

type AttachmentRow = {
  attachment_file_name: string | null
  attachment_object_key: string | null
  id: number
}

const write = process.argv.includes('--write')
const deletePublic = process.argv.includes('--delete-public')

async function main() {
  if (deletePublic && (!write || process.env.ALLOW_DESTRUCTIVE_C0 !== '1')) {
    throw new Error(
      '공개 R2 삭제에는 --write --delete-public과 ALLOW_DESTRUCTIVE_C0=1이 모두 필요합니다.',
    )
  }

  const pool = new pg.Pool({
    connectionString: resolvePayloadDatabaseURL(),
    max: 1,
  })

  try {
    const result = await pool.query<AttachmentRow>(`
      SELECT id, attachment_file_name, attachment_object_key
      FROM inquiries
      WHERE attachment_object_key IS NOT NULL
      ORDER BY id
    `)
    const attachments = result.rows.filter((row) =>
      isInquiryAttachmentObjectKey(row.attachment_object_key),
    )

    console.log(
      JSON.stringify({
        attachmentRows: attachments.length,
        deletePublic,
        privateConfigReady: hasPrivateR2Config(),
        write,
      }),
    )

    if (!write) {
      return
    }

    if (!hasPrivateR2Config()) {
      throw new Error('비공개 R2 환경변수를 먼저 설정해야 합니다.')
    }

    let copied = 0
    let deleted = 0
    let failed = 0

    for (const attachment of attachments) {
      const objectKey = attachment.attachment_object_key

      if (!isInquiryAttachmentObjectKey(objectKey)) {
        continue
      }

      try {
        const source = await getR2Object(objectKey)

        await uploadPrivateR2Object({
          body: source.body,
          cacheControl: 'private, max-age=0, no-store',
          contentDisposition: attachmentContentDisposition(
            attachment.attachment_file_name ?? 'attachment',
          ),
          contentType: source.contentType ?? 'application/octet-stream',
          key: objectKey,
        })

        const privateObject = await getPrivateR2Object(objectKey)

        if (privateObject.body.byteLength !== source.body.byteLength) {
          throw new Error('비공개 R2 복사 검증에서 파일 크기가 일치하지 않습니다.')
        }

        await pool.query(
          `
            UPDATE inquiries
            SET attachment_url = NULL, updated_at = NOW()
            WHERE id = $1 AND attachment_object_key = $2
          `,
          [attachment.id, objectKey],
        )
        copied += 1

        if (deletePublic) {
          await deleteR2Object(objectKey)
          deleted += 1
        }
      } catch (error) {
        failed += 1
        console.error('[inquiry-attachment-migration] item failed', {
          error,
          inquiryId: attachment.id,
        })
      }
    }

    console.log(
      JSON.stringify({
        copied,
        deleted,
        failed,
      }),
    )

    if (failed > 0) {
      process.exitCode = 1
    }
  } finally {
    await pool.end()
    destroyPrivateR2Client()
    destroyR2Client()
  }
}

await main()
