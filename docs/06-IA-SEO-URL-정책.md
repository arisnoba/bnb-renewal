# IA SEO URL 정책

> 목적: 센터별 URL, SEO, canonical, sitemap, redirect 기준을 한 문서로 관리한다.
> 마지막 갱신: 2026-06-22

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

> `{newdomain}`은 신규 대표 도메인이 확정되면 채운다.

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

### 오픈그래프 메타태그 기준

- 기본 OG 이미지는 전역 페이지는 `/website-template-OG.webp`, 센터 하위 페이지는 `/assets/og/og-{center}.jpg`를 사용한다.
- 센터 기본 OG 이미지는 1200x630 JPG로 관리하고, 파일명은 `og-art.jpg`, `og-avenue.jpg`, `og-exam.jpg`, `og-highteen.jpg`, `og-kids.jpg` 형식을 유지한다.
- 상세 페이지 OG 제목은 `meta.title` -> 대표 제목 순서로 만든다.
- 상세 페이지 OG 설명은 `meta.description` -> excerpt/요약 가능 필드 순서로 만든다.
- 상세 페이지 OG 이미지는 `meta.image` -> 상세 대표 media -> 센터 기본 OG 이미지 -> 전역 기본 OG 이미지 순서로 fallback한다.
- 센터 URL로 접근하는 상세 페이지의 OG URL은 `/{center}/...` canonical 경로를 우선 사용한다. 전역 상세 URL이 별도로 살아있는 콘텐츠만 전역 URL을 canonical로 둘 수 있다.
- `news`, `artist-press`처럼 SEO 탭이 있는 CMS 상세는 `mergeOpenGraph`에 실제 제목, 설명, URL, 이미지 fallback을 명시한다. 상세 대표 이미지가 없는 CMS 상세는 센터 기본 OG 이미지를 상속받는다.

## 목록 필터 URL 및 스크롤 기준

목록 페이지의 필터, 탭, 페이지네이션처럼 콘텐츠 표시 상태를 바꾸는 UI는 사용자 공유와 접근성을 위해 URL 상태를 유지한다.

권장:

```text
/art/rookies?filter=women
/art/faq?category=admission
/art/news?category=education-news&page=2
```

단, 이런 쿼리 파라미터는 센터별 독립 URL처럼 강한 SEO 랜딩 페이지로 보지 않는다. 검색 노출의 대표 URL은 쿼리 없는 목록 URL을 기본으로 삼고, 필터 쿼리는 사용자의 현재 탐색 상태, 공유 링크, 뒤로가기/앞으로가기 복원을 위한 보조 URL로 취급한다.

구현 기준:

- 필터 UI는 가능하면 공용 `FilterChips`를 사용한다.
- 필터 링크는 실제 `href`를 가진 `next/link`로 둔다. 버튼만으로 상태를 바꾸지 않는다.
- 같은 목록 안에서 필터만 바뀌는 전환은 `scroll={false}`를 적용해 현재 스크롤 위치를 유지한다.
- 콘텐츠 영역에 로딩이 필요하더라도 GNB, 헤더, 필터 영역이 페이지 상단으로 튀지 않게 한다.
- 쿼리 파라미터는 canonical에서 제외한다. 예: `/art/faq?category=admission`의 canonical은 `/art/faq`를 기본으로 한다.
- sitemap에는 기본 목록 URL과 상세 URL을 우선 포함한다. 필터별 URL은 별도 색인 목적이 분명한 경우에만 추가한다.

예외 기준:

- 필터 결과가 별도 검색 의도를 충분히 가진 독립 랜딩 페이지라면 쿼리가 아니라 경로 기반 URL로 승격한다.
- 뉴스처럼 업데이트 주기가 높고 카테고리별 유입 가치가 큰 경우에도 먼저 canonical, title, description, sitemap 포함 여부를 별도로 정한 뒤 색인 대상으로 다룬다.

## Redirect/Sitemap 기준

- 기존 도메인/경로에서 새 URL로의 301 이전은 센터별 슬러그 기준으로 관리한다.
- sitemap은 실제 공개 URL 기준으로 생성한다.
- canonical은 sitemap과 같은 URL 체계를 사용한다.
- 동일 콘텐츠가 공통/센터 경로에 중복될 경우 대표 URL 하나를 canonical로 지정한다.

## llms.txt 생성 정책

- 표준 경로는 사이트 루트의 `/llms.txt`다. `llm.txt`는 llmstxt.org 표준 경로가 아니므로 canonical 생성 대상에 포함하지 않는다.
- 목적은 `sitemap.xml` 대체가 아니라 AI 시스템이 사이트의 성격, 센터별 구조, 핵심 공개 페이지를 빠르게 이해하도록 돕는 선별형 Markdown 파일 제공이다.
- 생성 URL은 `getServerSideURL()` 기준 절대 URL을 사용한다. 운영 도메인 결정 전까지는 기존 metadata/canonical 유틸과 같은 기준을 따른다.
- 포함 대상은 센터 홈, 대표 교육 페이지, 캐스팅/아티스트/합격현황 페이지, 입학·FAQ·오시는 길 등 AI가 답변 근거로 삼기 좋은 공개 페이지로 제한한다.
- 제외 대상은 관리자, API, 로그인/미리보기, 페이지네이션·필터 조합 URL, 민감하거나 내부 운영용인 페이지다.
- 링크 항목 수는 이 프로젝트의 관리 기준으로 10~30개 수준을 유지한다. 상세 전체 색인은 sitemap 또는 각 센터 홈의 내비게이션을 기준으로 탐색하게 한다.
- 공개 IA, 센터 명칭, 주요 교육/캐스팅 페이지가 바뀌면 `/llms.txt` 생성 목록도 함께 갱신한다.

## 레거시 URL 마이그레이션 전략

현재 운영 중인 사이트는 **그누보드** 기반으로, URL 구조가 아래와 같다.

```
/web/bbs/board.php?bo_table=new_notice          ← 목록
/web/bbs/board.php?bo_table=new_notice&wr_id=3052  ← 상세
```

### 결정: A안 — 목록 페이지로 일괄 301

게시글 단위 매핑 없이, `bo_table` 기준으로 해당 섹션 목록 페이지로 일괄 리다이렉트한다.

| bo_table 값 | 리다이렉트 대상 |
|-------------|----------------|
| `new_notice` | `/art/news` |
| 추가 테이블은 오픈 전 목록화 후 채운다 | |

`wr_id`가 있든 없든 목록 URL로 동일하게 처리한다.

```js
// next.config.js
redirects: [
  {
    source: '/web/bbs/board.php',
    has: [{ type: 'query', key: 'bo_table', value: 'new_notice' }],
    destination: '/art/news',
    permanent: true,
  },
  // 추가 bo_table 항목...
]
```

### 후속 모니터링

오픈 후 Google Search Console에서 404 및 유입 경로를 확인해, 외부 백링크가 확인된 게시글은 수동으로 개별 매핑을 추가한다.

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
| 3-2 | 캐스팅 출연현황 | `/art/casting/ongoing` | dynamic | |
| 3-3 | 캐스팅 센터 | `/art/casting` | dynamic | 캐스팅 섹션 대표 랜딩 |
| 3-4 | 배우 케어 시스템 | `/art/casting/system` | dynamic | |
| 3-5 | 촬영·오디션 스케줄 | `/art/casting/schedule` | dynamic | 월별 캘린더 또는 목록 |

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
| – | 온라인 상담신청 | `/{center}/consult` | dynamic | 센터별 상담 경로. 기존 `/consult?center=art`는 호환 리다이렉트 |

## 입시센터 IA 및 URL 구조표

> 기준: 배우앤배움 입시센터 (`/exam`)
> 현재 GNB 기준: 교육 / 합격현황 / 합격자소개는 입시센터 전용 메뉴 구조를 사용한다.
> URL 경로는 `/exam` 하위에서 `exam-` 접두어를 반복하지 않는다.

### 배우앤배움

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 1-1 | 회사 소개 | `/art#company` | static | 공통 회사 소개 |
| 1-2 | 센터 소개 | `/exam/about` | static | |
| 1-3 | 시설 안내 | `/exam/facilities` | static | |
| 1-4 | 오시는 길 | `/exam/map` | static | 지도 embed 포함 가능 |

### 교육

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 2-1 | 입시 매니지먼트 | `/exam/management` | static | |
| 2-2 | 특별한 시스템 | `/exam#special-system` | static | 레거시 `new_sys02` 계열 |
| 2-3 | 엔터테인먼트 위탁교육 | `/exam/entertainment` | dynamic | |
| 2-4 | 교육진 소개 | `/exam/teachers` | dynamic | 강사 목록·상세 |
| 2-5 | 커리큘럼 | `/exam#curriculum` | static | 입시반/재입시반/편입반/예비 입시반/예고 입시반을 통합 노출 |

### 합격현황

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 3-1 | 대학교 | `/exam#university-results` | dynamic | `exam-results` 중 대학교 합격현황 |
| 3-2 | 예술고등학교 | `/exam#arts-high-results` | dynamic | `exam-results` 중 예고 합격현황 |

### 합격자소개

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 4-1 | 합격 후기 | `/exam/passed-reviews` | dynamic | `exam-passed-reviews`, 상세 `/{slug}` |
| 4-2 | 합격 영상 | `/exam/passed-videos` | dynamic | `exam-passed-videos` |

### 지원센터

| # | 한글 메뉴명 | URL | 유형 | 비고 |
|---|-------------|-----|------|------|
| 5-1 | NEWS&NOTICE | `/exam/news` | dynamic | 목록·상세 (`/[slug]`) |
| 5-2 | 입학안내 | `/exam#admission` | static | |
| 5-3 | 학원100%이용법 | `/exam#how-to-use` | static | |
| 5-4 | 스타카드 멤버십서비스 | `/exam/starcard` | dynamic | |
| 5-5 | 자주하는 질문 | `/exam/faq` | dynamic | 카테고리 필터 포함 가능 |

---

## 상세 기록

- SEO URL 상세 전략: [archive/planning/SEO-URL-전략.md](./archive/planning/SEO-URL-전략.md)
- IA 비교안: [archive/planning/IA-대안-비교안-v2.md](./archive/planning/IA-대안-비교안-v2.md)
- 사이트 구조 분석: [archive/planning/IA-사이트구조분석.md](./archive/planning/IA-사이트구조분석.md)
- 전체 메뉴 구조도: [archive/planning/전체-메뉴-구조도.md](./archive/planning/전체-메뉴-구조도.md)
