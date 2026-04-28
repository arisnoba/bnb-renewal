# Payload Admin 컬렉션 UX 이식 계획

## 목적

Payload 공식 `website` 템플릿의 `pages`, `posts` 컬렉션 자체를 운영 데이터 모델로 사용하지 않는다.

대신 템플릿에서 확인한 좋은 관리자 작성 경험을 기존 컬렉션에 선택적으로 이식한다. 대상은 뉴스, 출신 아티스트, 프로필성 콘텐츠처럼 공개 페이지 품질과 검색 노출이 중요한 컬렉션부터 정한다.

## 적용 원칙

- 기존 레거시 데이터 필드는 삭제하지 않는다.
- 신규 작성 UX를 위한 필드를 optional로 추가하고, 프론트에서는 신규 필드 우선, 기존 필드 fallback 구조를 사용한다.
- 한 번에 모든 컬렉션을 바꾸지 않는다.
- 대표 컬렉션 1개에서 패턴을 검증한 뒤 다른 컬렉션으로 확장한다.
- `pages`, `posts` 컬렉션은 템플릿 참고용으로 두거나 제거 여부를 별도 판단한다.
- DB migration은 기존 스키마 diff를 먼저 해소한 뒤 생성한다.

## 이식할 UX 패턴

### 1. 상단 타이틀

템플릿처럼 핵심 제목 필드는 탭 밖 최상단에 둔다.

권장 구조:

- 최상단: `title`, `name` 등 대표 제목
- 오른쪽 사이드바: slug, 발행일, 센터, 작성자, 상태 등 보조 정보
- 본문 영역: 탭으로 콘텐츠 성격 분리

기대 효과:

- 작성자가 문서의 핵심 식별값을 먼저 입력한다.
- 탭 내부가 덜 복잡해진다.
- 관리자 목록의 `useAsTitle`과 자연스럽게 연결된다.

### 2. 탭 구성

컬렉션별로 다를 수 있지만 기본 틀은 아래를 우선 검토한다.

- 콘텐츠: 본문, 요약, 카테고리, 주요 설명
- 미디어: 대표 이미지, 갤러리, 첨부 이미지
- SEO: SEO 제목, 설명, 공유 이미지
- 발행/설정: 공개 여부, 발행일, 센터, 작성자, 조회수
- 레거시: 기존 HTML, 기존 이미지 경로, 원본 ID, 마이그레이션 메타

레거시 필드는 새 작성자가 자주 건드리지 않도록 별도 탭이나 접힘 영역으로 분리한다.

### 3. Lexical Rich Text

Lexical은 Payload의 에디터형 rich text 필드다.

적용 후보:

- 신규 뉴스 본문
- 출신 아티스트 소개/본문
- 프로필 상세 소개
- 긴 설명이 필요한 공개 콘텐츠

주의:

- 기존 `bodyHtml`을 바로 대체하지 않는다.
- 신규 필드 예: `body`, `content`, `richTextBody`
- 프론트 렌더링은 신규 Lexical 필드가 있으면 우선 사용하고, 없으면 기존 HTML 필드를 사용한다.

### 4. Media Upload 관계

공식 템플릿의 `media` 컬렉션은 앞으로 신규 작성 콘텐츠에 적합하다.

적용 방식:

- 기존 이미지 경로 필드 유지: 예 `thumbnailPath`, `imagePath`
- 신규 media 관계 필드 추가: 예 `thumbnailMedia`, `heroImage`, `galleryMedia`
- 프론트 표시 우선순위: media 관계 필드 -> 기존 path 필드

이렇게 하면 레거시 데이터와 신규 업로드 UX를 함께 사용할 수 있다.

### 5. SEO 탭

SEO 탭은 공개 검색/공유 품질이 중요한 컬렉션에 우선 적용한다.

우선 후보:

- 뉴스
- 출신 아티스트/합격 후기/합격자 관련 콘텐츠
- 프로필성 콘텐츠
- 언론/보도자료 성격 콘텐츠

기본 필드:

- `meta.title`
- `meta.description`
- `meta.image`

옵션 필드:

- `meta.noIndex`
- `meta.canonicalUrl`
- `meta.ogTitle`
- `meta.ogDescription`

처음에는 기본 필드 3개만 권장한다.

### 6. Versions / 이력

Payload `versions`는 문서 변경 이력을 남기는 기능이다.

장점:

- 누가 어떤 공개 콘텐츠를 바꿨는지 추적하기 쉽다.
- 실수로 수정한 내용을 되돌릴 수 있다.
- 중요한 공개 콘텐츠 관리에 유용하다.

고려사항:

- 변경할 때마다 version row가 쌓인다.
- 모든 컬렉션에 켜면 DB 용량과 관리 부담이 늘어난다.
- draft, schedule publish까지 켜면 운영 워크플로우가 복잡해진다.

권장:

- 처음에는 중요한 공개 콘텐츠에만 적용한다.
- `maxPerDoc: 20` 또는 `maxPerDoc: 30`처럼 보관 개수를 제한한다.
- draft 기능은 별도 운영 절차가 정리된 뒤 검토한다.

### 7. Slug

템플릿의 slug UX는 좋지만, 기본 영문 slug 생성 방식은 한글 제목과 잘 맞지 않는다.

검토 가능한 방식:

- 한글 slug 허용: 사람이 읽기 좋지만 URL 인코딩과 공유 URL이 길어진다.
- 날짜/ID 기반 자동 생성: 예 `news-20260428-123`
- 수동 slug: 자동 제안은 하되 관리자가 직접 수정한다.
- 컬렉션별 prefix 사용: 예 `news-20260428-123`, `artist-press-20260428-123`

권장:

- 오른쪽 보조 레이아웃에 slug 필드를 둔다.
- 제목 입력 시 자동 제안을 만든다.
- 한글 제목이면 날짜/ID 기반 slug를 기본값으로 사용한다.
- 관리자가 필요하면 직접 수정할 수 있게 한다.

## 권장 진행 순서

1. 적용 대상 컬렉션 목록을 확정한다.
2. 컬렉션별 필드 작성 폼을 채운다.
3. 대표 컬렉션 1개를 선정한다.
4. 해당 컬렉션에 타이틀/탭/미디어/SEO/versions/slug 패턴을 적용한다.
5. 타입 생성, import map 생성, lint, typecheck, build를 통과시킨다.
6. 프론트 fallback 정책을 검증한다.
7. DB migration을 생성하기 전 기존 스키마 diff를 정리한다.
8. migration 적용 후 관리자 작성 UX를 수동 확인한다.
9. 같은 패턴을 다른 컬렉션에 확장한다.

## 대표 컬렉션 예시: News

초안 구조:

- 최상단: `title`
- 콘텐츠 탭: `category`, `excerpt`, `body` 또는 기존 `bodyHtml`
- 미디어 탭: `thumbnailMedia`, 기존 `thumbnailPath`
- SEO 탭: `meta.title`, `meta.description`, `meta.image`
- 발행/설정 사이드바: `centers`, `publishedAt`, `authorName`, `viewCount`
- 레거시 영역: 원본 ID, 기존 HTML, 기존 이미지 경로, 마이그레이션 메타

프론트 우선순위:

- 본문: `body` -> `bodyHtml`
- 대표 이미지: `thumbnailMedia` -> `thumbnailPath`
- SEO 제목: `meta.title` -> `title`
- SEO 설명: `meta.description` -> `excerpt`
- SEO 이미지: `meta.image` -> `thumbnailMedia` -> `thumbnailPath`

## 미결정 사항

- 실제 적용할 컬렉션 목록
- 각 컬렉션의 신규 rich text 필드명
- 기존 HTML 필드의 장기 보존 위치
- 컬렉션별 media 필드 개수와 용도
- versions 적용 대상과 `maxPerDoc` 값
- slug 생성 규칙
- SEO 필드의 필수 여부
- 프론트 fallback 구현 범위
