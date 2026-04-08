# 배우앤배움 DB P0 매핑표

> 작성일: 2026-04-08
> 목적: `P0` 이관 대상인 `g5_content`, `g5_content2`, `g5_teacher`, `g5_teacher2`, `g5_write_new_notice`를 새 프로젝트 기준 모델로 어떻게 옮길지 정리한다.
> 선행 문서: `docs/DB-마이그레이션-우선순위-계획.md`

---

## 1. 범위

이 문서는 아래 테이블만 다룬다.

- `g5_content`
- `g5_content2`
- `g5_teacher`
- `g5_teacher2`
- `g5_write_new_notice`

이번 단계의 목표는 아래 3가지다.

1. 공개 사이트를 구성하는 핵심 읽기 전용 데이터를 먼저 옮긴다.
2. 새 프로젝트의 정보구조에 맞는 최소 타깃 모델을 확정한다.
3. 소량 샘플 import와 화면 렌더링 테스트가 가능하도록 매핑 규칙을 명확히 한다.

---

## 2. P0 타깃 모델

P0에서는 타깃 모델을 아래 3개로 단순화한다.

### `pages`

용도:

- 고정 페이지
- 센터 소개
- 시설안내
- 오시는 길
- FAQ
- 이용안내
- 정책 페이지

핵심 필드:

- `id`
- `source_table`
- `source_key`
- `slug`
- `title`
- `center`
- `page_type`
- `html`
- `mobile_html`
- `excerpt`
- `is_html`
- `status`
- `legacy_meta`
- `created_at`
- `updated_at`

### `faculty`

용도:

- 강사진 목록
- 강사 상세

핵심 필드:

- `id`
- `source_table`
- `source_id`
- `slug`
- `name`
- `role`
- `center`
- `summary`
- `bio_html`
- `profile_image_path`
- `gallery`
- `display_order`
- `status`
- `legacy_meta`
- `created_at`
- `updated_at`

### `news`

용도:

- 공지사항
- 뉴스
- 운영 소식

핵심 필드:

- `id`
- `source_id`
- `slug`
- `title`
- `category`
- `center`
- `body_html`
- `excerpt`
- `author_name`
- `published_at`
- `display_status`
- `is_public`
- `view_count`
- `legacy_meta`
- `created_at`
- `updated_at`

---

## 3. 공통 변환 원칙

### 3-1. 원본 구조 복제 금지

- MySQL/그누보드 컬럼을 그대로 새 DB에 복제하지 않는다.
- 새 프로젝트에서 실제로 쓰는 필드만 남긴다.
- 버려도 되는 운영 메타는 `legacy_meta` JSON으로만 보관한다.

### 3-2. HTML 보존 우선

- `co_content`, `message`, `wr_content`는 1차 이관 시 원본 HTML을 우선 보존한다.
- 1차 이관에서는 과도한 정제보다 `렌더링 안정성`을 우선한다.
- 단, 아래 항목은 후처리 대상으로 표시한다.
  - 인라인 스타일 과다 사용
  - 절대경로 이미지
  - 구 스크립트 삽입
  - 카카오맵 embed
  - 오래된 링크 구조

### 3-3. 날짜 변환

- `0000-00-00`, `0000-00-00 00:00:00`은 `NULL`로 변환한다.
- 실제 게시일이 있으면 `published_at`에 넣는다.
- 확실한 생성일이 없으면 `created_at`은 import 시각 또는 별도 `NULL` 정책을 쓴다.

### 3-4. slug 생성

- slug는 원본 URL 구조를 복제하지 않는다.
- 기본 규칙:
  - `pages`: 명시적 라우트 우선, 없으면 `co_id`
  - `faculty`: 이름 기반 slug + 중복 시 source id suffix
  - `news`: 제목 기반 slug + 중복 시 source id suffix

예시:

- `co_id=privacy` -> `/privacy`
- `임채홍` -> `im-chae-hong-1` 또는 한글 slug 정책 확정 전 임시 `faculty-1`
- `추석연휴 휴원 안내` -> `news-346` 또는 제목 기반 slug

### 3-5. center 매핑

P0 단계에서는 center를 강하게 확정하지 않고 아래 원칙으로 간다.

- 전사 공통 콘텐츠: `center = all`
- 센터 판별 불가: `center = unknown`
- 향후 수동 분류 예정 콘텐츠는 `legacy_meta.center_hint`에 원본 단서를 남긴다.

---

## 4. 테이블별 매핑

## 4-1. `g5_content` -> `pages`

원본 성격:

- `co_id` 기반 고정 페이지 저장소
- 공통 페이지와 운영 페이지가 혼재

핵심 판단:

- P0에서 가장 먼저 옮길 테이블
- 새 프로젝트의 `/about`, `/privacy`, `/refund`, `/faq` 류 페이지에 직접 연결 가능

### 컬럼 매핑

| source column | target field | 변환 규칙 | 비고 |
|---|---|---|---|
| `co_id` | `source_key` | 원본 그대로 저장 | 유니크 키 역할 |
| `co_id` | `slug` | 라우트 매핑표 우선, 없으면 `co_id` 사용 | 수동 매핑 필요 |
| `co_subject` | `title` | trim | 페이지 제목 |
| `co_content` | `html` | 원본 HTML 유지 | 본문 |
| `co_mobile_content` | `mobile_html` | 빈 문자열이면 `NULL` | 모바일 별도 본문 |
| `co_html` | `is_html` | `0/1 -> boolean` | 에디터 HTML 여부 |
| `co_hit` | `legacy_meta.hit_count` | 정수 보존 | 통계 참고용 |
| `co_skin` | `legacy_meta.skin` | 그대로 | 참고용 |
| `co_mobile_skin` | `legacy_meta.mobile_skin` | 그대로 | 참고용 |
| `co_tag_filter_use` | `legacy_meta.tag_filter_use` | 그대로 | 참고용 |
| `co_include_head` | `legacy_meta.include_head` | 그대로 | 참고용 |
| `co_include_tail` | `legacy_meta.include_tail` | 그대로 | 참고용 |

### 권장 page_type 분류

| 조건 | `page_type` |
|---|---|
| `privacy`, `terms`, `refund` 류 | `policy` |
| `faq`, `cs_call`, `enterance`, `useguide` 류 | `guide` |
| `company`, `identity`, `history`, `systemintro` 류 | `about` |
| `map`, `sisul` 류 | `location` 또는 `facility` |
| `profile` 류 | `program` 또는 `results-support` |
| 분류 불가 | `general` |

### 우선 manual route 매핑 추천

| `co_id` | 추천 route |
|---|---|
| `company` | `/about` |
| `privacy` | `/privacy` |
| `map` | `/about/directions` 또는 `/[center]/about` 하위 |
| `sisul` | `/about/facilities` 또는 `/[center]/about` 하위 |
| `faq` | `/faq` 또는 `/[center]/faq` |
| `cs_call` | `/contact` 또는 `/guide` 하위 |
| `enterance` | `/guide` 하위 |
| `useguide` | `/guide` 하위 |
| `profile` | `/[center]/programs/profile-making` 성격으로 별도 정의 |

---

## 4-2. `g5_content2` -> `pages`

원본 성격:

- 구조는 `g5_content`와 동일
- 센터별 또는 보조 성격의 정적 콘텐츠 저장 가능성 높음

핵심 판단:

- 구조는 `g5_content`와 동일하게 이관
- 단, 실제 페이지 의미는 `co_id`와 본문을 보고 후속 분류 필요

### 컬럼 매핑

`g5_content`와 동일 규칙을 사용한다.

### 추가 규칙

- `source_table = g5_content2`를 명시적으로 저장한다.
- 동일한 `co_id`가 `g5_content`에도 존재할 수 있으므로 `source_table + source_key` 조합으로 식별한다.
- `company`, `identity` 등 동일 의미의 페이지가 중복될 경우:
  - 한쪽을 채택
  - 다른 쪽은 `legacy variant`로 보존

---

## 4-3. `g5_teacher` -> `faculty`

원본 성격:

- 강사/배우 소개
- 요약, 상세 경력 HTML, 대표 이미지, 갤러리 이미지, 이미지 제목/설명, 정렬 순서 포함

핵심 판단:

- 새 프로젝트의 강사진 모델로 바로 흡수 가능
- 다만 `subject`만으로는 역할 정의가 부족하므로 후처리 필요

### 컬럼 매핑

| source column | target field | 변환 규칙 | 비고 |
|---|---|---|---|
| `bn_id` | `source_id` | 정수 보존 | 원본 PK |
| `name` | `name` | trim | 이름 |
| `subject` | `role` | trim | 예: 배우, 교수, 모델 |
| `summary` | `summary` | 줄바꿈 정리 | 짧은 소개 |
| `message` | `bio_html` | 원본 HTML 유지 | 상세 경력 |
| `bn_bimg` | `profile_image_path` | 빈 값이면 `NULL` | 대표 이미지 |
| `bn_order` | `display_order` | 정수 보존 | 노출 순서 |
| `pr_1` ~ `pr_9` | `legacy_meta.pr_flags` | 배열 또는 JSON | 원본 의미 미확정 |
| `it_img1` ~ `it_img8` | `gallery[].image_path` | 빈 값 제외 후 배열화 | 상세 이미지 |
| `it_img_title1` ~ `it_img_title8` | `gallery[].title` | 같은 index끼리 매핑 | 이미지 제목 |
| `it_img_desc1` ~ `it_img_desc8` | `gallery[].description` | 같은 index끼리 매핑 | 이미지 설명 |
| `piece` | `legacy_meta.piece_html` | 그대로 | 현재 의미 불명확 |

### 추가 규칙

- `center`는 1차 이관 시 `unknown` 또는 `all`
- `status`는 기본 `published`
- 갤러리는 아래 구조로 변환

```json
[
  {
    "sort": 1,
    "image_path": "1/special1_piece_img01.png",
    "title": "그녀의 13월",
    "description": "2011 한국 멜로/김우철 역"
  }
]
```

### 후처리 항목

- 이미지 경로를 실제 저장소 기준 URL로 치환
- `summary`의 줄바꿈을 문단화
- `message` 안의 표 HTML을 계속 유지할지, structured career로 분해할지 후속 결정

---

## 4-4. `g5_teacher2` -> `faculty`

원본 성격:

- `g5_teacher`와 동일 구조
- 추가 강사진 또는 센터별 변형 데이터로 추정

핵심 판단:

- `g5_teacher`와 동일한 스키마로 이관
- 테이블 소스만 다르게 기록

### 컬럼 매핑

`g5_teacher`와 동일 규칙 사용

### 추가 규칙

- `source_table = g5_teacher2`
- `g5_teacher`와 동일 인물이 중복될 수 있으므로 초기에는 dedupe하지 않는다.
- dedupe는 import 후 `name + role + profile_image_path` 기준 검토한다.

---

## 4-5. `g5_write_new_notice` -> `news`

원본 성격:

- 공지, 뉴스, 운영 소식, 캐스팅 확정 게시물 혼합
- 그누보드 게시판 구조

핵심 판단:

- 새 프로젝트의 `news` 컬렉션으로 우선 통합
- 카테고리와 공개 여부만 분리해서 가져오면 된다

### 컬럼 매핑

| source column | target field | 변환 규칙 | 비고 |
|---|---|---|---|
| `wr_id` | `source_id` | 정수 보존 | 원본 PK |
| `wr_subject` | `title` | trim | 제목 |
| `wr_content` | `body_html` | 원본 HTML 유지 | 본문 |
| `ca_name` | `category` | trim, 빈 값이면 `uncategorized` | 카테고리 |
| `wr_name` | `author_name` | trim | 작성자명 |
| `mb_id` | `legacy_meta.author_member_id` | 그대로 | 원본 작성자 계정 |
| `wr_datetime` | `published_at` | `0000-00-00 00:00:00 -> NULL` | 게시일 |
| `wr_last` | `updated_at` | 유효 날짜면 사용 | 최종 수정시각 성격 |
| `wr_hit` | `view_count` | 정수 보존 | 조회수 |
| `public` | `is_public` | `'' -> true`, `N -> false` 같은 명시 규칙 필요 | 공개 여부 |
| `wr_option` | `legacy_meta.options` | set 문자열 보존 | `html1`, `secret` 등 |
| `wr_file` | `legacy_meta.file_count` | 그대로 | 첨부 개수 |
| `wr_link1` | `legacy_meta.link1` | 빈 값이면 `NULL` | 외부 링크 |
| `wr_link2` | `legacy_meta.link2` | 빈 값이면 `NULL` | 외부 링크 |
| `wr_link1_hit` | `legacy_meta.link1_hit` | 그대로 | 참고용 |
| `wr_link2_hit` | `legacy_meta.link2_hit` | 그대로 | 참고용 |
| `wr_ip` | `legacy_meta.ip` | 초기엔 보존 가능하지만 공개 모델에는 노출 금지 | 운영 메타 |
| `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply` | `legacy_meta.threading` | JSON으로만 보존 | 새 구조 직접 사용 안 함 |
| `wr_1` ~ `wr_10` | `legacy_meta.extra_fields` | JSON | 의미 미확정 |

### display_status 규칙

| 조건 | `display_status` |
|---|---|
| 공개 게시물 | `published` |
| 비공개/숨김 판정 | `private` |
| 날짜 오류/본문 없음 | `draft-review` |

### category 정규화 초안

| 원본 `ca_name` | 권장 정규화 값 |
|---|---|
| `교육ㆍ운영ㆍ소식` | `operations` |
| `캐스팅확정` | `casting-result` |
| `오디션ㆍ캐스팅공지` | `casting-announcement` |
| 빈 값 | `general` |

---

## 5. P0 import 시 버릴 필드

아래는 이번 단계에서 타깃 모델 필드로 승격하지 않는다.

- `g5_content*`
  - `co_skin`
  - `co_mobile_skin`
  - `co_include_head`
  - `co_include_tail`
- `g5_teacher*`
  - `pr_1` ~ `pr_9`
  - `piece`
- `g5_write_new_notice`
  - thread 메타 전부
  - IP, SNS 필드
  - 미확정 extra field 전부

이 값들은 필요하면 `legacy_meta`에만 넣는다.

---

## 6. P0 샘플 테스트 권장안

테이블별로 처음에는 5~10건만 테스트하는 것이 좋다.

### `g5_content`

추천 샘플:

- `privacy`
- `faq`
- `map`
- `cs_call`
- `company`

테스트 포인트:

- HTML 렌더링
- 절대경로 링크 처리
- 페이지 라우트 매핑

### `g5_teacher`

추천 샘플:

- `bn_id = 1`
- `bn_id = 2`
- 이미지와 갤러리가 모두 있는 레코드 1건

테스트 포인트:

- 프로필 이미지 노출
- gallery 배열 생성
- biography HTML 렌더링

### `g5_write_new_notice`

추천 샘플:

- 공지 2건
- 운영 소식 2건
- 캐스팅확정 2건

테스트 포인트:

- 제목 slug 생성
- 게시일 변환
- 카테고리 정규화
- 본문 이미지 처리

---

## 7. 구현 전에 확정할 것

아래 4가지는 실제 import 스크립트 작성 전에 확정해야 한다.

1. `pages`, `faculty`, `news`를 DB 테이블로 둘지 CMS 컬렉션으로 둘지
2. 이미지 원본 경로를 어디로 옮길지
3. slug를 한글 유지로 할지 영문화할지
4. center를 P0에서 바로 분류할지, import 후 수동 분류할지

현재 권장안은 아래다.

- 저장 모델: CMS 컬렉션 또는 단순 Postgres 테이블 모두 가능
- 이미지: 별도 스토리지 이관 전까지 원본 경로 보존
- slug: 우선 안전한 임시 slug 사용
- center: P0에서는 `all` 또는 `unknown`

---

## 8. 다음 단계

이 문서 다음 작업은 아래 순서가 적절하다.

1. `P0 타깃 스키마 초안` 작성
2. `샘플 5~10건 import 스크립트 설계`
3. `본문 HTML 정리 규칙` 문서화
4. `이미지 자산 이관 전략` 문서화

가장 먼저 할 일은 `P0 타깃 스키마 초안` 작성이다.
