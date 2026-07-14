import assert from 'node:assert/strict'
import test from 'node:test'

import {
  attachmentContentDisposition,
  inquiryAttachmentDownloadPath,
  isInquiryAttachmentObjectKey,
} from './inquiryAttachment'

test('문의 첨부 R2 key는 전용 prefix 내부만 허용한다', () => {
  assert.equal(
    isInquiryAttachmentObjectKey('inquiries/attachments/partnership/2026/07/file.pdf'),
    true,
  )
  assert.equal(isInquiryAttachmentObjectKey('media/file.pdf'), false)
  assert.equal(isInquiryAttachmentObjectKey('inquiries/attachments/../private.pdf'), false)
  assert.equal(isInquiryAttachmentObjectKey('inquiries/attachments\\private.pdf'), false)
})

test('관리자 첨부 링크는 문의 id와 유효한 object key가 있을 때만 만든다', () => {
  assert.equal(
    inquiryAttachmentDownloadPath(
      12,
      'inquiries/attachments/partnership/2026/07/file.pdf',
    ),
    '/api/inquiries/12/attachment',
  )
  assert.equal(inquiryAttachmentDownloadPath(12, 'media/file.pdf'), '')
  assert.equal(inquiryAttachmentDownloadPath(undefined, 'inquiries/attachments/file.pdf'), '')
})

test('다운로드 파일명은 헤더 삽입 문자를 제거하고 UTF-8 이름을 보존한다', () => {
  const disposition = attachmentContentDisposition('제안"서.pdf')

  assert.match(disposition, /^attachment; filename="____\.pdf";/)
  assert.match(disposition, /filename\*=UTF-8''/)
  assert.doesNotMatch(disposition, /\r|\n/)
})
