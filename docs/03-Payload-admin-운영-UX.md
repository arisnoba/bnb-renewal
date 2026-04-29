# Payload Admin 운영 UX

> 목적: Payload 컬렉션 작성 UX, Lexical, media, SEO, fallback 패턴을 한 문서로 관리한다.
> 마지막 갱신: 2026-04-28

## 적용 원칙

- 공식 Payload `website` 템플릿의 좋은 작성 UX만 기존 컬렉션에 이식한다.
- `pages`, `posts`를 운영 데이터 모델로 쓰는 것은 별도 결정 전까지 보류한다.
- 기존 레거시 필드는 삭제하지 않는다.
- 신규 작성 UX 필드는 optional로 추가한다.
- 프론트는 신규 필드 우선, 레거시 필드 fallback 구조로 렌더링한다.
- 공통 helper는 실제 중복을 줄일 때만 추출한다.

## 컬렉션 작성 UX 기준

- 대표 제목(`title`, `name`)은 탭 밖 최상단에 둔다.
- 오른쪽 보조 영역에는 `slug`, `center`, `publishedAt`, `author`, `상태`처럼 보조 메타를 둔다.
- 본문 영역은 탭으로 나눈다.
- 레거시 필드는 새 작성자가 자주 건드리지 않도록 레거시/원본 탭에 둔다.
- 조회수 같은 레거시성 수치는 숨기거나 레거시 영역에 보존한다.

권장 탭:

- 콘텐츠: category, excerpt, Lexical body, 주요 본문 필드
- 미디어: 대표 이미지, 로고, 갤러리, 첨부 이미지
- SEO: `meta.title`, `meta.description`, `meta.image`
- 레거시/원본: 기존 HTML, 기존 이미지 경로, source id, legacy meta

## Lexical 본문 기준

- 신규 rich text 필드명은 우선 `body`를 사용한다.
- 기존 `bodyHtml`은 삭제하지 않는다.
- `body`가 비어 있고 `bodyHtml`이 있으면 Payload 공식 `convertHTMLToLexical`과 `jsdom`으로 변환한다.
- 프론트 fallback 순서는 `body` -> `bodyHtml`이다.

## Media/SEO 기준

이미지 fallback:

- 대표 이미지: 신규 media relation -> legacy path
- SEO 이미지: `meta.image` -> 대표 media relation -> legacy path

SEO fallback:

- 제목: `meta.title` -> 대표 제목
- 설명: `meta.description` -> excerpt/요약 가능 필드

R2 이전 정책 때문에 media 문서나 콘텐츠 본문에는 개발자 R2 완성 URL을 저장하지 않는다. 공개 URL은 `R2_PUBLIC_BASE_URL + objectKey` 조합을 기준으로 한다.

## Slug/Versions 기준

- slug는 우측 보조 영역에 둔다.
- 영문/숫자 토큰을 우선 사용한다.
- 한글만 있으면 `{collection}-{날짜}-{짧은 suffix}` 형태를 기본값으로 둔다.
- 관리자가 수동 수정할 수 있게 한다.
- 공개 콘텐츠 versions는 기본 `maxPerDoc: 15`를 사용한다.
- draft/schedule publish는 운영 절차가 정리되기 전까지 전면 도입하지 않는다.

## 현재 적용 상태

| 컬렉션 | 상태 |
| --- | --- |
| `news` | title 최상단, 콘텐츠/미디어/SEO/레거시 탭, Lexical body, thumbnailMedia, meta, versions 15, 프론트 fallback 적용 |
| `artist-press` | `news` 패턴 적용, thumbnailMedia, agencyLogoMedia, meta, bodyHtml 변환, `/artist-press` 목록/상세 fallback 적용 |
| `exam-school-logos` | `logoMedia` 업로드 관계 추가, 불필요한 legacy/admin 필드 제거, slug 영문 안내/검증, 다운로드 리포트 기반 media 연결 완료 |

## 보류 항목

- `pages`, `posts`, `categories`, `header`, `footer` 유지/제거 결정
- 모든 컬렉션 versions 일괄 적용
- 모든 HTML 본문 즉시 Lexical 변환
- legacy image path 필드 삭제
- draft/schedule publish 전면 도입

## 상세 기록

- Payload admin UX 상세 계획: [archive/payload/Payload-admin-컬렉션-UX-이식-계획.md](./archive/payload/Payload-admin-컬렉션-UX-이식-계획.md)
- 필드 인터뷰 기록: [archive/payload/Payload-admin-컬렉션-필드-작성폼.md](./archive/payload/Payload-admin-컬렉션-필드-작성폼.md)
- 페이지 플랜: [archive/payload/Payload-admin-페이지-플랜.md](./archive/payload/Payload-admin-페이지-플랜.md)
