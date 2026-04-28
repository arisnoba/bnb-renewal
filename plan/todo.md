# Payload Admin UX 이식 TODO

> 기준 문서:
> - [docs/plan/Payload-admin-컬렉션-UX-이식-계획.md](../docs/plan/Payload-admin-컬렉션-UX-이식-계획.md)
> - [docs/plan/Payload-admin-컬렉션-필드-작성폼.md](../docs/plan/Payload-admin-컬렉션-필드-작성폼.md)
>
> 마지막 갱신: 2026-04-28  
> 현재 진행 기준: 공식 Payload `website` 템플릿의 관리자 작성 UX를 기존 컬렉션에 선택적으로 이식한다.

## 현재 상태

- `dev` 브랜치에서 공식 Payload `website` 템플릿 기반 프론트와 공통 컴포넌트가 1차로 들어왔다.
- 기존 Payload admin/API/Postgres 구성은 유지했다.
- 신규 `media`, `pages`, `posts`, `categories`, `header`, `footer` 모델이 추가되어 있다.
- 실제 운영 데이터 모델로는 `pages`, `posts`를 쓰지 않을 계획이다.
- 앞으로는 `pages/posts` 컬렉션 자체보다 템플릿의 필드 구성, 관리자 UI, SEO, media, validation, slug UX를 기존 컬렉션에 이식한다.
- 1차 구현 우선순위는 `news`가 가장 높다.
- DB migration은 아직 생성하지 않았다. 기존 스키마 diff 질문이 먼저 떠서 자동 선택하지 않았다.

## 작업 원칙

- 기존 레거시 필드는 삭제하지 않는다.
- 신규 작성 UX 필드는 optional로 추가한다.
- 프론트는 신규 필드 우선, 레거시 필드 fallback 구조로 간다.
- 한 번에 모든 컬렉션을 바꾸지 않는다.
- 대표 컬렉션 1개에서 패턴을 검증한 뒤 확장한다.
- migration 생성 전 기존 schema diff를 먼저 판단한다.
- seed 라우트처럼 destructive 가능성이 있는 템플릿 기능은 활성화하지 않는다.

## 완료

- [x] `dev` 브랜치 생성
- [x] 공식 Payload `website` 템플릿 구조 확인
- [x] 기존 `(site)` 프론트 라우트를 템플릿 `(frontend)` 구조로 교체
- [x] 기존 Payload admin/API 라우트 유지
- [x] 템플릿 공통 컴포넌트, 블록, 필드, provider, utility 추가
- [x] `media`, `pages`, `posts`, `categories`, `header`, `footer` 모델 추가
- [x] 템플릿 plugin 의존성 추가
- [x] destructive seed route 제거
- [x] destructive seed 구현 파일 제거, static homepage fallback만 유지
- [x] migration 전에도 `/`가 뜨도록 homepage/header/footer fallback 추가
- [x] `npm run payload:generate-types`
- [x] `npm run payload:generate-importmap`
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `/` HTTP 200 확인
- [x] `/admin` HTTP 200 확인
- [x] 관리자 UX 이식 계획 문서 작성
- [x] 컬렉션별 필드 작성 폼 작성

## 현재 우선순위

1. 저장 버튼을 `posts`, `pages` 템플릿처럼 눈에 띄게 개선한다.
2. 관리자 사이드바 필드를 정리한다.
   - 발행일
   - 작성자
   - slug
   - 센터 선택
3. Lexical rich text를 순차 적용한다.
   - 뉴스
   - 출신 아티스트
   - 드라마/광고 출연장면
   - 합격후기

## 다음 결정 필요

- [ ] `pages`, `posts`, `categories`, `header`, `footer` 컬렉션/글로벌을 계속 둘지 제거할지 결정
  - 현재는 템플릿 참조와 빌드 호환을 위해 남아 있다.
  - 운영에서 쓰지 않을 경우 제거하거나 관리자에서 숨기는 방향을 검토한다.
- [ ] `media` 컬렉션은 유지할지 확정
  - 현재 판단으로는 신규 게시글/콘텐츠 작성에 유용하므로 유지 후보.
- [ ] UX 이식 대상 컬렉션 목록 확정
  - 현재 1차 우선순위는 `news`
- [x] 대표 적용 컬렉션 1개 선정
  - 대표 컬렉션: `news`
- [ ] versions 적용 대상 결정
  - 후보: 뉴스, 출신 아티스트, 프로필성 콘텐츠
- [ ] slug 생성 규칙 결정
  - 후보: 날짜/ID 기반 자동 생성 + 수동 수정 허용
- [ ] SEO 탭 적용 대상 결정
  - 후보: 뉴스, 출신 아티스트, 프로필성 콘텐츠

## 인터뷰 진행 방식

긴 작성 폼을 사용자가 직접 전부 채우는 방식은 중단한다. 대신 에이전트가 [인터뷰 노트](../docs/plan/Payload-admin-컬렉션-필드-작성폼.md)를 기준으로 짧은 질문을 하나씩 하고, 답변이 모이면 이 TODO와 구현 계획을 갱신한다.

- [ ] 질문 1: `news` 1차 적용 범위를 전체 패턴 검증으로 할지, 저장 버튼/사이드바/Lexical까지만 할지 결정
- [ ] 질문 2: 저장 버튼 개선 범위를 관리자 전체로 할지, 콘텐츠 작성 화면만 할지 결정
- [ ] 질문 3: 사이드바 필드 순서 결정
- [ ] 질문 4: 신규 Lexical 필드명 결정
- [ ] 질문 5: 기존 `bodyHtml` 위치 결정
- [ ] 질문 6: versions만 적용할지 draft까지 적용할지 결정
- [ ] 질문 7: slug 생성 규칙 결정
- [ ] 질문 8: SEO 적용 컬렉션 결정

## 1차 구현 대상: News

> `news`를 최우선으로 적용한다. 저장 버튼, 사이드바, Lexical, media, SEO, slug, versions의 대표 패턴을 여기서 먼저 검증한다.

- [x] `news` 컬렉션을 대표 컬렉션으로 선정
- [ ] `title`을 탭 밖 최상단 필드로 유지
- [ ] 콘텐츠 탭 구성 확정
  - 후보: `category`, `excerpt`, 신규 `body`
  - 기존: `bodyHtml` 유지
- [ ] 미디어 탭 구성 확정
  - 후보: 신규 `thumbnailMedia`
  - 기존: `thumbnailPath` 유지
- [ ] SEO 탭 구성 확정
  - 후보: `meta.title`, `meta.description`, `meta.image`
- [ ] 발행/설정 필드 위치 확정
  - 후보: `centers`, `publishedAt`, `authorName`, `viewCount`
- [ ] 레거시 필드 위치 확정
  - 후보: 레거시 탭 또는 접힘 영역
- [ ] versions 적용 여부 확정
  - 후보: `maxPerDoc: 15`
  - draft는 1차 보류 권장
- [ ] slug 생성 방식 확정
  - 후보: `news-{날짜}-{짧은 suffix}` 또는 수동 slug
- [ ] 프론트 fallback 구현
  - 본문: `body` -> `bodyHtml`
  - 이미지: `thumbnailMedia` -> `thumbnailPath`
  - SEO 제목: `meta.title` -> `title`
  - SEO 설명: `meta.description` -> `excerpt`
  - SEO 이미지: `meta.image` -> `thumbnailMedia` -> `thumbnailPath`

## 구현 단계

### Phase 1. 설계 확정

- [ ] 사용자가 컬렉션별 작성 폼을 채운다.
- [ ] 컬렉션별 변경 범위를 표로 정리한다.
- [ ] 대표 컬렉션 1개를 확정한다.
- [ ] 레거시 fallback 정책을 확정한다.
- [ ] migration 위험 항목을 사전에 정리한다.

### Phase 2. 대표 컬렉션 적용

- [ ] 대표 컬렉션 파일을 읽고 현재 필드/권한/훅 구조를 확인한다.
- [ ] 타이틀 필드를 탭 밖 최상단에 둔다.
- [ ] 탭 구조를 적용한다.
- [ ] 신규 Lexical 필드를 추가한다.
- [ ] 신규 media 관계 필드를 추가한다.
- [ ] SEO 필드를 추가한다.
- [ ] 필요 시 versions를 제한 개수로 추가한다.
- [ ] slug 필드와 자동 생성 로직을 추가한다.
- [ ] 기존 레거시 필드를 레거시 영역으로 이동한다.

### Phase 3. 프론트 fallback 적용

- [ ] 대표 컬렉션의 목록/상세 렌더링 위치를 확인한다.
- [ ] 신규 본문 필드 우선 렌더링을 추가한다.
- [ ] 기존 HTML 본문 fallback을 유지한다.
- [ ] 신규 media 이미지 우선 렌더링을 추가한다.
- [ ] 기존 이미지 경로 fallback을 유지한다.
- [ ] SEO metadata fallback을 추가한다.

### Phase 4. 검증

- [ ] `npm run payload:generate-types`
- [ ] `npm run payload:generate-importmap`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] 관리자 화면에서 대표 컬렉션 작성 UX 수동 확인
- [ ] 기존 레거시 데이터 표시 확인
- [ ] 신규 작성 데이터 표시 확인

### Phase 5. Migration

- [ ] `npm run db:local:migrate:create` 실행 전 현재 schema diff를 확인한다.
- [ ] Payload가 묻는 rename/create 질문을 검토한다.
- [ ] 기존 데이터 손실 위험이 있는 선택은 하지 않는다.
- [ ] 대표 컬렉션 변경분만 포함되도록 migration을 확인한다.
- [ ] migration 파일 생성 후 SQL 내용을 검토한다.
- [ ] 로컬 DB에서 migration 적용을 검증한다.

### Phase 6. 확장

- [ ] 대표 컬렉션 패턴을 기준으로 2번째 컬렉션을 선정한다.
- [ ] 같은 방식으로 필드/프론트/migration을 반복한다.
- [ ] 컬렉션별 공통 helper가 실제 중복을 줄일 때만 추출한다.
- [ ] 불필요해진 템플릿 `pages/posts` 모델 정리 여부를 다시 결정한다.

## Migration 주의 항목

현재 `npm run db:local:migrate:create -- --name website-template` 실행 시 기존 스키마 차이에 대한 질문이 먼저 나왔다.

예:

- `artist_press.author_name` 컬럼을 새로 만들 것인지
- 기존 `is_public` 컬럼을 `author_name`으로 rename할 것인지

이 질문은 자동으로 답하면 위험하다. 잘못 선택하면 기존 데이터 구조를 의도와 다르게 바꾸는 migration이 만들어질 수 있다.

따라서 다음 migration 생성 전에는 아래를 먼저 확인한다.

- [ ] 현재 DB schema와 최신 migration 파일의 차이
- [ ] `artist_press` 관련 기존 변경 이력
- [ ] rename으로 판단할 수 있는 명확한 근거가 있는지
- [ ] create column으로 처리해도 기존 데이터 손실이 없는지
- [ ] 신규 Payload Admin UX 변경분과 기존 schema diff를 분리할 수 있는지

## 보류

- [ ] 모든 컬렉션에 versions 일괄 적용
- [ ] 모든 본문 HTML을 Lexical로 즉시 변환
- [ ] 기존 이미지 path 필드 제거
- [ ] Payload template seed 활성화
- [ ] draft/schedule publish 전면 도입
- [ ] 한글 slug 전면 허용

## 검증 기록

- 2026-04-28
  - `npm run payload:generate-types`: 통과
  - `npm run payload:generate-importmap`: 통과
  - `npm run typecheck`: 통과
  - `npm run lint`: 통과
  - `npm run build`: 통과
  - `curl -I http://localhost:3000`: HTTP 200
  - `curl -I http://localhost:3000/admin`: HTTP 200
