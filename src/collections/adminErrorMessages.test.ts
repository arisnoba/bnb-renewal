import assert from 'node:assert/strict'
import test from 'node:test'

import { friendlyAdminErrorResponse } from './adminErrorMessages'

const request = {
  i18n: { language: 'ko' },
  t: (key: string) => (key === 'error:valueMustBeUnique' ? '이미 등록된 값입니다.' : key),
}

test('미디어 중복 파일명은 내부 필드명 대신 해결 방법을 안내한다', () => {
  const response = friendlyAdminErrorResponse({
    collection: { slug: 'media' },
    request,
    response: {
      errors: [
        {
          data: {
            errors: [
              { message: '이미 등록된 값입니다.', path: 'prefix' },
              { message: '이미 등록된 값입니다.', path: 'filename' },
            ],
          },
          message: '다음 입력란이 유효하지 않습니다: prefix, filename',
        },
      ],
    },
  })

  assert.equal(
    response.errors[0]?.message,
    '같은 이름의 파일이 이미 등록되어 있습니다. 파일명을 변경한 뒤 다시 업로드해 주세요.',
  )
  assert.deepEqual(
    response.errors[0]?.data?.errors?.map((error) => error.message),
    ['이미 등록된 값입니다. 다른 값을 입력해 주세요.', '이미 등록된 값입니다. 다른 값을 입력해 주세요.'],
  )
})

test('다른 중복값 오류는 관리자 필드 라벨로 안내한다', () => {
  const response = friendlyAdminErrorResponse({
    collection: {
      flattenedFields: [{ label: '학교 슬러그', name: 'schoolSlug' }],
      slug: 'exam-school-logos',
    },
    request,
    response: {
      errors: [
        {
          data: {
            errors: [{ message: '이미 등록된 값입니다.', path: 'schoolSlug' }],
          },
          message: '다음 입력란이 유효하지 않습니다: schoolSlug',
        },
      ],
    },
  })

  assert.equal(
    response.errors[0]?.message,
    '학교 슬러그 항목에 이미 등록된 값이 있습니다. 다른 값을 입력해 주세요.',
  )
})

test('중복값이 아닌 검증 오류 응답은 변경하지 않는다', () => {
  const original = {
    errors: [
      {
        data: {
          errors: [{ message: '이 입력란은 필수입니다.', path: 'title' }],
        },
        message: '입력 내용을 확인해 주세요: 제목',
      },
    ],
  }

  const response = friendlyAdminErrorResponse({
    collection: { slug: 'news' },
    request,
    response: original,
  })

  assert.equal(response, original)
})
