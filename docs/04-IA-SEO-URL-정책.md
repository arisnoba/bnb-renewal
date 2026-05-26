# IA SEO URL 정책

> 목적: 센터별 URL, SEO, canonical, sitemap, redirect 기준을 한 문서로 관리한다.
> 마지막 갱신: 2026-05-26

## 기본 결론

센터별 페이지는 쿼리 파라미터가 아니라 독립 URL로 운영한다.

권장:

```text
/art/news
/exam/curriculums
/kids/casting
```

비권장:

```text
/news?center=art
/programs?center=exam
```

독립 URL을 쓰는 이유는 센터별 검색 의도와 브랜드 키워드를 별도 랜딩 페이지로 인덱싱하기 위해서다.

## 센터 슬러그 및 도메인 매핑

현재 운영 중인 센터별 개별 도메인을 신규 사이트에서도 그대로 수용한다.

| 센터       | slug       | 현재 운영 도메인     | 서브도메인 (예정)        |
| ---------- | ---------- | -------------------- | ------------------------ |
| 아트센터   | `art`      | `baewoo.co.kr`       | `art.{newdomain}`        |
| 애비뉴센터 | `avenue`   | `baewoorun.co.kr`| `avenue.{newdomain}`     |
| 입시센터   | `exam`     | `baewoo.kr`          | `exam.{newdomain}`       |
| 하이틴센터 | `highteen` | `baewoo.me`          | `highteen.{newdomain}`   |
| 키즈센터   | `kids`     | `baewoo.net`         | `kids.{newdomain}`       |

> `{newdomain}`은 신규 대표 도메인이 확정되면 채운다. 애비뉴센터는 현재 운영 도메인 없음.

## URL 기준

브랜드 공통:

```text
/
/about
/news
/news/[slug]
/artist-press
/artist-press/[slug]
/privacy
/terms
```

센터별:

```text
/[center]
/[center]/about
/[center]/curriculums
/[center]/curriculums/[slug]
/[center]/news
/[center]/news/[slug]
/[center]/results
/[center]/results/[slug]
/[center]/casting
/[center]/casting/[slug]
/[center]/guide
/[center]/faq
```

## 멀티 도메인 접근 정책

신규 사이트는 동일한 콘텐츠를 3가지 경로로 동시에 서비스한다.

| 접근 방식 | 예시 (아트센터) | 설명 |
|-----------|----------------|------|
| 경로 기반 | `{newdomain}/art/news` | 기본. 전 센터 통합 접근 |
| 서브도메인 | `art.{newdomain}/news` | 센터별 독립 브랜딩 강조 시 |
| 개별 도메인 | `baewoo.co.kr/news` | 현재 사용자 이탈 방지·브랜드 연속성 유지 |

세 경로 모두 **내부적으로 동일한 페이지 컴포넌트**를 렌더링한다. Next.js Middleware에서 호스트명을 파싱해 `/[center]/*` 경로로 rewrite하는 방식으로 구현한다.

```ts
// middleware.ts (개념 코드)
const host = request.headers.get('host') // baewoo.co.kr 또는 art.newdomain.com

// 개별 도메인 매핑
const domainMap: Record<string, string> = {
  'baewoo.co.kr': 'art',
  'baewoo.kr':    'exam',
  'baewoo.me':    'highteen',
  'baewoo.net':   'kids',
}

// 서브도메인 매핑 (art.newdomain.com → art)
const subdomain = host.split('.')[0]

const center = domainMap[host] ?? subdomain
// → 내부 경로 /art/*, /exam/*, ... 로 rewrite
```

### Canonical URL 결정 원칙

동일 콘텐츠가 세 경로로 모두 접근 가능하므로, **canonical은 하나로 고정**해야 중복 색인 패널티를 피한다.

| 운영 목표 | canonical 기준 | 이유 |
|-----------|---------------|------|
| 통합 도메인 SEO 집중 | `{newdomain}/art/*` | 신규 대표 도메인에 권위 축적 |
| 센터별 SEO 독립 운영 | `baewoo.co.kr/*` 등 | 기존 도메인 권위 승계 |

> **결정 필요**: canonical 기준은 개발 착수 전 확정해야 한다. 결정 전까지는 경로 기반(`{newdomain}/art/*`)을 임시 기준으로 사용한다.

### Redirect 우선순위

1. 기존 도메인(`baewoo.co.kr`) 구 URL → 신규 URL 301
2. 개별 도메인 루트(`baewoo.co.kr/`) → canonical 기준 URL로 301 또는 rewrite(투명)
3. 서브도메인(`art.{newdomain}`) → canonical 기준 URL로 canonical 태그 처리

## SEO 렌더링 기준

- 검색 노출이 필요한 페이지는 서버에서 본문, 제목, 설명, canonical을 만들 수 있어야 한다.
- 목록/상세 페이지는 신규 CMS 필드 우선, 레거시 필드 fallback으로 렌더링한다.
- SEO 제목은 `meta.title` -> 대표 제목 순서다.
- SEO 설명은 `meta.description` -> excerpt/요약 가능 필드 순서다.
- SEO 이미지는 `meta.image` -> 대표 media -> legacy path 순서다.
- legacy path는 신규 필드가 비어 있을 때만 fallback으로 사용한다.

## Redirect/Sitemap 기준

- 기존 도메인/경로에서 새 URL로의 301 이전은 센터별 슬러그 기준으로 관리한다.
- sitemap은 실제 공개 URL 기준으로 생성한다.
- canonical은 sitemap과 같은 URL 체계를 사용한다.
- 동일 콘텐츠가 공통/센터 경로에 중복될 경우 대표 URL 하나를 canonical로 지정한다.

## 아트센터 IA 및 URL 구조표

> 기준: 배우앤배움 아트센터 (`/art`)
> 유형: `static` = CMS 없이 정적 렌더링 / `dynamic` = CMS·API 연동 필요

### 배우앤배움

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 1-1 | 회사 소개 | `/art/company` | static | |
| 1-2 | 센터 소개 | `/art/about` | static | |
| 1-3 | 시설 안내 | `/art/facilities` | static | |
| 1-4 | 오시는 길 | `/art/location` | static | 지도 embed 포함 가능 |

### 교육

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 2-1 | 등급제 교육관리시스템 | `/art/education` | static | 섹션 랜딩. 상세 분리 시 `/art/education/grade-system` |
| 2-2 | 엔터테인먼트 위탁교육 | `/art/education/entertainment` | dynamic | |
| 2-3 | 교육진 소개 | `/art/education/instructors` | dynamic | 강사 목록·상세 (`/[id]`) |
| 2-4 | 커리큘럼 | `/art/education/curriculum` | dynamic | 목록·상세 (`/[id]`) |

### 캐스팅

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 3-1 | 드라마·광고 출연장면 | `/art/casting/appearances` | dynamic | 갤러리형 목록 |
| 3-2 | 진행중인 캐스팅 출연현황 | `/art/casting/ongoing` | dynamic | |
| 3-3 | 드라마 광고 캐스팅 | `/art/casting` | dynamic | 캐스팅 섹션 대표 랜딩 |
| 3-4 | 캐스팅 시스템 | `/art/casting/system` | dynamic | |
| 3-5 | 이달의 촬영·오디션 스케줄 | `/art/casting/schedule` | dynamic | 월별 캘린더 또는 목록 |

### 아티스트

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 4-1 | BNB출신 아티스트 | `/art/artists` | dynamic | 목록·상세 (`/[id]`) |
| 4-2 | BNB 루키 | `/art/artists/rookie` | dynamic | 목록·상세 (`/[id]`) |

### 지원센터

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 5-1 | NEWS&NOTICE | `/art/news` | dynamic | 목록·상세 (`/[slug]`) |
| 5-2 | 입학안내 | `/art/guide/admission` | static | |
| 5-3 | 학원100%이용법 | `/art/guide/how-to-use` | static | |
| 5-4 | 스타카드 멤버십서비스 | `/art/star-card` | dynamic | |
| 5-5 | 자주하는 질문 | `/art/faq` | dynamic | 카테고리 필터 포함 가능 |

### 독립 페이지

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| – | 온라인 상담신청 | `/consult` | dynamic | 전 센터 공통. 센터 지정 쿼리 `?center=art` 허용 |

---

## 상세 기록

- SEO URL 상세 전략: [archive/planning/SEO-URL-전략.md](./archive/planning/SEO-URL-전략.md)
- IA 비교안: [archive/planning/IA-대안-비교안-v2.md](./archive/planning/IA-대안-비교안-v2.md)
- 사이트 구조 분석: [archive/planning/IA-사이트구조분석.md](./archive/planning/IA-사이트구조분석.md)
- 전체 메뉴 구조도: [archive/planning/전체-메뉴-구조도.md](./archive/planning/전체-메뉴-구조도.md)
