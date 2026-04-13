# 배우앤배움 통합 사이트 SEO URL 전략

> **작성 배경:** `docs/통합-사이트-메뉴-구조도.md`의 쿼리 파라미터 URL 설계(`/faculty?center=art`)는 SEO 위험을 내포하고 있어 이를 SEO 안전한 독립 URL 구조로 대체하는 전략을 정의한다.
> **연관 문서:** `docs/IA-대안-비교안-v2.md` (대안 2 GNB 구조 기준)

---

## 1. 핵심 원칙

### 왜 쿼리 파라미터 URL이 문제인가

```
❌ /faculty?center=art
❌ /faculty?center=highteen
❌ /programs?center=kids&type=curriculum
```

구글은 `/faculty?center=art`와 `/faculty?center=highteen`을 동일 페이지의 필터 변형으로 인식한다. 결과:
- 두 페이지가 서로의 검색 순위를 잠식 (cannibalization)
- 구글이 canonical을 임의로 선택해 의도하지 않은 페이지가 인덱싱됨
- 센터별 브랜드 검색(예: "아트센터 강사진")에서 독립적인 랜딩 페이지 역할 불가

### 해결 방향: SEO 안전한 독립 URL + 단일 템플릿 공유

```
✅ /art/faculty      (아트센터 강사진)
✅ /highteen/faculty (하이틴센터 강사진)
✅ /kids/programs    (키즈센터 프로그램)
✅ art.domain.com/faculty
✅ highteen.domain.com/faculty
```

핵심은 `센터별로 독립 인덱싱 가능한 URL`을 만드는 것이다. 이 조건만 만족하면 외부 노출 URL은 아래 2가지 모두 가능하다.

- 경로형: `domain.com/<center>/...`
- 서브도메인형: `<center>.domain.com/...`

### 1-1. 운영 옵션 상태

현재 단계에서는 아래처럼 본다.

- 기본 권장안: `domain.com/<center>/...`
- 선택 가능 옵션: `<center>.domain.com/...`
- 비권장안: `?center=art` 같은 쿼리 파라미터 필터형 URL

경로형을 기본 권장안으로 두는 이유는 아래와 같다.

- 현재 Next.js 라우팅 구조가 `app/[center]/...` 기준으로 이미 설계되어 있다.
- 구현/운영 복잡도가 가장 낮다.
- 하나의 루트 도메인 권한으로 SEO를 집중하기 쉽다.

서브도메인형도 충분히 가능하다. 다만 이것은 `현재 즉시 확정안`이 아니라 `클라이언트 선택 시 전환 가능한 운영 옵션`으로 관리한다.

### 1-2. 옵션 비교표

| 항목 | 경로형 `domain.com/<center>` | 서브도메인형 `<center>.domain.com` |
|------|-----------------------------|----------------------------------|
| SEO 독립 URL 조건 | 충족 | 충족 |
| 현재 코드 구조와 적합성 | 높음 | 중간 |
| 구현 복잡도 | 낮음 | 중간 |
| canonical/sitemap 관리 | 단순 | 더 주의 필요 |
| 브랜드 분리 체감 | 중간 | 높음 |
| 운영 기본안 여부 | 기본안 | 선택 옵션 |

### 1-3. 전환 원칙

클라이언트가 서브도메인형을 선택하더라도 아래 원칙은 유지한다.

- 내부 IA는 동일하게 유지한다.
- `center slug` 체계 `art`, `exam`, `kids`, `highteen`, `avenue`는 그대로 쓴다.
- Next.js 템플릿은 최대한 공유한다.
- canonical, sitemap, 301 기준만 선택된 공개 URL 방식에 맞춘다.

---

## 2. URL 구조 전체 정의

이 섹션의 예시는 `경로형 기본안` 기준으로 적는다. 서브도메인형을 선택하면 `호스트명만 달라지고 페이지 구조와 섹션 체계는 동일`하다.

### 센터 슬러그 매핑

| 센터 | URL 슬러그 | 기존 도메인 |
|------|-----------|-----------|
| 아트센터 | `art` | baewoo.co.kr |
| 입시센터 | `exam` | baewoo.kr |
| 키즈센터 | `kids` | baewoo.net |
| 하이틴센터 | `highteen` | baewoo.me |
| 애비뉴센터 | `avenue` | baewoorun.co.kr |

### 브랜드 공통 페이지

```
/                     게이트 페이지
/about                배우앤배움 소개
/about/philosophy     운영 철학 / 교육 시스템
/about/history        연혁
/about/facilities     시설안내
/about/directions     오시는 길
/news                 공지사항/뉴스
/news/[slug]          뉴스 상세
/privacy              개인정보처리방침
/terms                이용약관
/refund               환불정책
```

### 센터별 페이지 (대안 2 GNB 기반)

```
/[center]                  센터 랜딩 (서브홈)
/[center]/about            센터 소개
/[center]/programs         프로그램 목록
/[center]/programs/[slug]  프로그램 상세
/[center]/faculty          강사진
/[center]/faculty/[slug]   강사 상세
/[center]/results          성과/활동
/[center]/results/[slug]   성과 상세
/[center]/casting          캐스팅/오디션
/[center]/casting/[slug]   캐스팅 상세
/[center]/guide            이용안내
/[center]/faq              FAQ
/[center]/contact          상담 신청
```

**[center]** 에 들어올 수 있는 값: `art`, `exam`, `kids`, `highteen`, `avenue`

예시:
```
/art/faculty
/exam/programs
/kids/casting
/highteen/results
/avenue/about
```

서브도메인형 선택 시 같은 페이지는 아래처럼 노출된다.

```
art.domain.com/faculty
exam.domain.com/programs
kids.domain.com/casting
highteen.domain.com/results
avenue.domain.com/about
```

### 통합(크로스센터) 페이지

통합 페이지는 모든 센터의 콘텐츠를 한눈에 보는 별도 기능 페이지다. 센터별 페이지와 경쟁하지 않으며 서로 다른 검색 인텐트를 가진다.

```
/programs   전체 프로그램 (필터 UI로 탐색)
/faculty    전체 강사진
/results    전체 성과/활동
/casting    전체 캐스팅/오디션 (진행중)
/contact    통합 상담 신청
/faq        통합 FAQ
```

> 통합 페이지: "배우앤배움 연기 프로그램" 검색 → `/programs`
> 센터 페이지: "아트센터 연기 프로그램" 검색 → `/art/programs`
> 완전히 다른 인텐트, 서로 잠식 없음

---

## 3. Next.js App Router 구조

현재 구현 기준 내부 라우팅 골격은 `app/[center]/...`를 유지하는 것이 가장 안전하다.

```
app/
├── layout.tsx                          루트 레이아웃 (GNB)
├── page.tsx                            게이트 페이지 (/)
├── about/
│   ├── page.tsx
│   ├── philosophy/page.tsx
│   ├── history/page.tsx
│   ├── facilities/page.tsx
│   └── directions/page.tsx
├── programs/page.tsx                   /programs (통합)
├── faculty/page.tsx                    /faculty (통합)
├── results/page.tsx                    /results (통합)
├── casting/page.tsx                    /casting (통합)
├── contact/page.tsx                    /contact (통합)
├── faq/page.tsx                        /faq (통합)
├── news/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── [center]/                           ← 5개 센터 통합 동적 세그먼트
│   ├── layout.tsx                      센터별 레이아웃 (2차 GNB, 테마)
│   ├── page.tsx                        센터 랜딩
│   ├── about/page.tsx
│   ├── programs/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── faculty/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── results/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── casting/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── guide/page.tsx
│   ├── faq/page.tsx
│   └── contact/page.tsx
├── privacy/page.tsx
├── terms/page.tsx
├── refund/page.tsx
└── sitemap.ts
```

### 라우팅 충돌 방지

Next.js App Router는 **정적 세그먼트가 동적 세그먼트보다 우선**한다.

```
/programs    → app/programs/page.tsx    (정적, 통합 페이지)
/art/programs → app/[center]/programs/page.tsx  (동적, 아트센터)
```

`/about`, `/news`, `/privacy` 등 최상위 정적 경로는 `[center]` 동적 세그먼트와 충돌하지 않는다.

### generateStaticParams로 유효 슬러그 제한

```typescript
// app/[center]/layout.tsx
export async function generateStaticParams() {
  return [
    { center: 'art' },
    { center: 'exam' },
    { center: 'kids' },
    { center: 'highteen' },
    { center: 'avenue' },
  ]
}
```

`/unknown-center` 같은 경로는 404 처리된다.

### 서브도메인형 선택 시 구현 원칙

서브도메인형을 선택하더라도 내부 구현은 `app/[center]/...` 구조를 유지할 수 있다.

권장 방식:

- 외부 URL: `art.domain.com/faculty`
- 내부 rewrite: `/art/faculty`
- 센터 판별 기준: `hostname`

즉, 호스트명을 읽어 `center slug`로 변환한 뒤 내부 경로로 rewrite하면 된다. 이렇게 하면 현재 경로형 코드와 템플릿을 대부분 재사용할 수 있다.

---

## 4. 센터별 고유 SEO 메타데이터

### 생성 원칙

같은 `FacultyPage` 컴포넌트를 쓰더라도 `generateMetadata`에서 센터별로 다른 메타데이터를 생성한다.

```typescript
// app/[center]/faculty/page.tsx (개념 예시)
export async function generateMetadata({ params }) {
  const center = await getCenterData(params.center) // Payload CMS 조회
  const publicBaseUrl = getPublicBaseUrl(center.slug) // URL 전략별 분기
  return {
    title: `강사진 - ${center.name} | 배우앤배움`,
    description: center.seo.facultyDescription,
    openGraph: {
      title: `강사진 - ${center.name} | 배우앤배움`,
      description: center.seo.facultyDescription,
      url: `${publicBaseUrl}/faculty`,
      images: [center.seo.facultyOgImage],
    },
    alternates: {
      canonical: `${publicBaseUrl}/faculty`,
    },
  }
}
```

`getPublicBaseUrl(center.slug)`는 선택된 공개 URL 전략에 따라 아래처럼 달라진다.

- 경로형: `https://domain.com/art`
- 서브도메인형: `https://art.domain.com`

### 센터 x 섹션 메타데이터 조합 (35개)

각 조합마다 고유한 title, description, H1, OG image를 Payload CMS에서 관리한다.

| 섹션 | art | exam | kids | highteen | avenue |
|------|:---:|:---:|:---:|:---:|:---:|
| 센터 랜딩 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 프로그램 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 강사진 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 성과/활동 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 캐스팅/오디션 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 이용안내 | ✓ | ✓ | ✓ | ✓ | ✓ |
| FAQ | ✓ | ✓ | ✓ | ✓ | ✓ |

메타데이터 차별화 예시:

| | `/art/faculty` | `/exam/faculty` | `/kids/faculty` |
|-|----------------|----------------|----------------|
| title | 강사진 - 아트센터 \| 배우앤배움 | 강사진 - 입시센터 \| 배우앤배움 | 강사진 - 키즈센터 \| 배우앤배움 |
| description | 현직 배우 출신 강사진. 연기·카메라연기·뮤지컬 전문. | 예술대학 입시 전문 강사진. 한예종·중앙대·동국대 합격 지도. | 아역배우 전문 강사진. 드라마·광고 실무 경험 보유. |
| H1 | 아트센터 강사진 | 입시센터 강사진 | 키즈센터 강사진 |
| canonical | /art/faculty | /exam/faculty | /kids/faculty |

---

## 5. Schema.org 전략

Schema의 `url`, `@id`, `mainEntityOfPage`도 선택된 공개 URL 전략과 반드시 일치해야 한다.

아래 JSON 예시는 이해를 돕기 위한 샘플이며, 실제 배포 시에는 확정된 운영 도메인과 URL 전략에 맞춰 교체한다.

### 조직 계층 구조

```json
{
  "@type": "EducationalOrganization",
  "@id": "https://bnb.co.kr/#organization",
  "name": "배우앤배움",
  "url": "https://bnb.co.kr",
  "subOrganization": [
    { "@id": "https://bnb.co.kr/art/#center" },
    { "@id": "https://bnb.co.kr/exam/#center" },
    { "@id": "https://bnb.co.kr/kids/#center" },
    { "@id": "https://bnb.co.kr/highteen/#center" },
    { "@id": "https://bnb.co.kr/avenue/#center" }
  ]
}
```

각 센터 랜딩 페이지 (`/art`, `/exam` 등):

```json
{
  "@type": ["EducationalOrganization", "LocalBusiness"],
  "@id": "https://bnb.co.kr/art/#center",
  "name": "배우앤배움 아트센터",
  "parentOrganization": { "@id": "https://bnb.co.kr/#organization" },
  "url": "https://bnb.co.kr/art",
  "address": { "@type": "PostalAddress", "addressLocality": "서울" },
  "telephone": "+82-2-XXXX-XXXX"
}
```

### 섹션별 Schema 타입

| URL 패턴 | Schema 타입 |
|---------|------------|
| `/[center]` | `EducationalOrganization` + `LocalBusiness` |
| `/[center]/programs` | `ItemList` of `Course` |
| `/[center]/programs/[slug]` | `Course` + `CourseInstance` |
| `/[center]/faculty` | `ItemList` of `Person` |
| `/[center]/faculty/[slug]` | `Person` (worksFor = 해당 센터) |
| `/[center]/results` | `ItemList` |
| `/[center]/casting` | `ItemList` of `Event` |
| `/[center]/faq` | `FAQPage` (센터별 다른 질문) |

---

## 6. Canonical URL 정책

canonical은 반드시 `현재 선택된 공개 URL 1개 방식만` 사용한다. 경로형과 서브도메인형을 동시에 canonical 후보로 두지 않는다.

| 상황 | Canonical 처리 |
|------|---------------|
| `/art/faculty` | self-canonical (자기 자신) |
| `/faculty` (통합) | self-canonical (센터 페이지와 별개) |
| `/art/faculty?page=2` | `/art/faculty` (페이지네이션 제외) |
| `/art/faculty?sort=name` | `/art/faculty` (정렬 파라미터 제외) |
| `/art/faculty?utm_source=naver` | `/art/faculty` (UTM 제외) |

**원칙:**
- 센터별 페이지와 통합 페이지는 상호 canonical을 가리키지 않는다. 각각 독립적인 콘텐츠다.
- UI 상태(정렬, 필터, 페이지)를 나타내는 쿼리 파라미터는 canonical에서 제외한다.
- 항상 HTTPS + 슬래시 없는 경로 사용.

### URL 전략별 canonical 예시

| 전략 | 아트센터 강사진 canonical |
|------|--------------------------|
| 경로형 | `https://domain.com/art/faculty` |
| 서브도메인형 | `https://art.domain.com/faculty` |

---

## 7. Sitemap 구조

동적 sitemap은 선택된 공개 URL 전략을 기준으로 생성한다.

경로형 기본안 예시:

```
/sitemap.xml              sitemap index
  /sitemap-static.xml     브랜드 공통 페이지 (/about/*, /news/*, 정책 페이지)
  /sitemap-art.xml        아트센터 전체 (/art/*)
  /sitemap-exam.xml       입시센터 전체 (/exam/*)
  /sitemap-kids.xml       키즈센터 전체 (/kids/*)
  /sitemap-highteen.xml   하이틴센터 전체 (/highteen/*)
  /sitemap-avenue.xml     애비뉴센터 전체 (/avenue/*)
  /sitemap-aggregate.xml  통합 페이지 (/programs, /faculty 등)
```

서브도메인형 선택 시에는 아래 2가지 방식 중 하나를 택한다.

- 단일 sitemap index에서 `art.domain.com`, `exam.domain.com` 등 각 호스트 URL을 함께 나열
- 센터별 서브도메인마다 자체 sitemap을 두고 루트 index에서 연결

중요한 것은 형식보다 아래 원칙이다.

- sitemap의 `<loc>`는 canonical과 완전히 일치해야 한다.
- 경로형과 서브도메인형 URL을 혼합 기재하지 않는다.
- 운영 중간에 URL 전략을 바꾸면 sitemap도 즉시 함께 바꾼다.

각 URL 항목:
- `<loc>`: 절대 경로 canonical URL
- `<lastmod>`: Payload CMS `updatedAt` 자동 연동
- `<priority>`: 센터 랜딩 0.9 → 섹션 목록 0.8 → 상세 0.6

### robots.txt

아래 예시의 `Sitemap` 값도 최종 선택된 공개 URL 전략에 맞춰 바뀌어야 한다.

```
User-agent: *
Allow: /

# AI 크롤러 허용
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://bnb.co.kr/sitemap.xml
```

---

## 8. 301 리다이렉트 매핑

기존 레거시 도메인에서 새 통합 서비스로 옮길 때의 301 대상은 `최종 선택된 공개 URL 전략`에 맞춰 결정한다.

### 도메인 레벨 리다이렉트

| 구 도메인 | 경로형 기본안 | 서브도메인형 선택 시 |
|---------|--------------|---------------------|
| `baewoo.co.kr/*` | `https://domain.com/art/*` | `https://art.domain.com/*` |
| `baewoo.kr/*` | `https://domain.com/exam/*` | `https://exam.domain.com/*` |
| `baewoo.net/*` | `https://domain.com/kids/*` | `https://kids.domain.com/*` |
| `baewoo.me/*` | `https://domain.com/highteen/*` | `https://highteen.domain.com/*` |
| `baewoorun.co.kr/*` | `https://domain.com/avenue/*` | `https://avenue.domain.com/*` |

아래 세부 매핑표는 `경로형 기본안` 기준으로 작성한다. 서브도메인형을 선택하면 `/<center>` prefix를 제거하고 해당 센터 서브도메인으로 치환하면 된다.

### 아트센터 (baewoo.co.kr) URL 매핑

| 구 URL | 신규 URL |
|--------|---------|
| `/web/index.php` | `/art` |
| `?co_id=parents`, `?co_id=identity` | `/art/about` |
| `?co_id=sisul` | `/art/guide` |
| `?co_id=map` | `/about/directions` |
| `/html/teacher_list.php?mid=teacher` | `/art/faculty` |
| `?co_id=grade01` | `/art/programs` |
| `/html/class_curriculum.php` | `/art/programs` |
| `/html/manage_list.php?mid=entertain` | `/art/programs` |
| `?co_id=systemintro`, `/web/management.php` | `/art/about` |
| `bo_table=new_drama`, `bo_table=new_appear` | `/art/results` |
| `bo_table=new_shoot`, `bo_table=new_profile` | `/art/results` |
| `bo_table=new_hoogi` | `/art/results` |
| `bo_table=new_casting2`, `bo_table=new_casting_bx` | `/art/casting` |
| `write.php?bo_table=new_audition` | `/art/casting` |
| `?co_id=profile` | `/art/programs` |
| `bo_table=new_calendar02` | `/art/casting` |
| `?co_id=enterance`, `?co_id=useguide` | `/art/guide` |
| `?co_id=cs_call` | `/art/contact` |
| `write.php?bo_table=new_counsel` | `/art/contact` |
| `bo_table=new_counsel` | `/art/contact` |
| `?co_id=faq` | `/art/faq` |
| `bo_table=new_notice` | `/news` |
| `bo_table=new_starcard` | `/art/guide` |

### 입시센터 (baewoo.kr) URL 매핑

| 구 URL | 신규 URL |
|--------|---------|
| `/web/index.php` | `/exam` |
| `?co_id=company`, `?co_id=greeting` | `/exam/about` |
| `?co_id=sisul` | `/exam/guide` |
| `?co_id=map` | `/about/directions` |
| `?co_id=parents`, `?co_id=history` | `/about` |
| `/html/teacher_list.php?mid=teacher` | `/exam/faculty` |
| `?co_id=curi` | `/exam/programs` |
| `?co_id=curi02`, `?co_id=curi03`, `?co_id=curi04`, `?co_id=curi06` | `/exam/programs` |
| `?co_id=exam_mng` | `/exam/about` |
| `bo_table=victory10`, `bo_table=victory30` | `/exam/results` |
| `bo_table=new_hoogi`, `bo_table=new_shoot` | `/exam/results` |
| `?co_id=useguide`, `?co_id=new_sys02` | `/exam/guide` |
| `?co_id=new_sys06`, `bo_table=new_starcard` | `/exam/guide` |
| `?co_id=Scholarship` | `/exam/guide` |
| `?co_id=cs_call` | `/exam/contact` |
| `write.php?bo_table=new_counsel` | `/exam/contact` |
| `bo_table=new_counsel` | `/exam/contact` |
| `?co_id=faq` | `/exam/faq` |
| `bo_table=new_notice` | `/news` |

### 키즈센터 (baewoo.net) URL 매핑

| 구 URL | 신규 URL |
|--------|---------|
| `/web/index.php` | `/kids` |
| `?co_id=company`, `?co_id=greeting` | `/kids/about` |
| `?co_id=sisul` | `/kids/guide` |
| `?co_id=map` | `/about/directions` |
| `/html/teacher_list.php?mid=teacher` | `/kids/faculty` |
| `?co_id=grade01`, `?co_id=edu01`, `?co_id=edu02`, `?co_id=edu03` | `/kids/programs` |
| `/html/manage_list.php?mid=entertain` | `/kids/programs` |
| `?co_id=systemintro` | `/kids/about` |
| `bo_table=new_drama`, `bo_table=new_appear` | `/kids/results` |
| `bo_table=new_profile`, `?co_id=profile` | `/kids/results` |
| `bo_table=new_casting_enm`, `bo_table=new_casting2` | `/kids/casting` |
| `bo_table=new_casting_img`, `bo_table=new_casting_bx` | `/kids/casting` |
| `bo_table=new_calendar` | `/kids/casting` |
| `?co_id=enterance`, `?co_id=useguide` | `/kids/guide` |
| `bo_table=new_starcard` | `/kids/guide` |
| `?co_id=cs_call` | `/kids/contact` |
| `write.php?bo_table=new_counsel` | `/kids/contact` |
| `bo_table=new_counsel` | `/kids/contact` |
| `?co_id=faq` | `/kids/faq` |
| `bo_table=new_notice` | `/news` |

### 하이틴센터 (baewoo.me) URL 매핑

| 구 URL | 신규 URL |
|--------|---------|
| `/web/index.php` | `/highteen` |
| `?co_id=company`, `?co_id=greeting` | `/highteen/about` |
| `?co_id=sisul` | `/highteen/guide` |
| `?co_id=map` | `/about/directions` |
| `/html/teacher_list.php?mid=teacher` | `/highteen/faculty` |
| `?co_id=grade01`, `/html/class_curriculum.php` | `/highteen/programs` |
| `/html/manage_list.php?mid=entertain` | `/highteen/programs` |
| `bo_table=new_specialclass` | `/highteen/programs` |
| `?co_id=systemintro`, `?co_id=profile` | `/highteen/about` |
| `bo_table=new_drama`, `bo_table=new_appear` | `/highteen/results` |
| `bo_table=new_profile`, `bo_table=bnb_highteen_news` | `/highteen/results` |
| `bo_table=new_casting_enm`, `bo_table=new_casting2` | `/highteen/casting` |
| `bo_table=new_casting_img`, `bo_table=new_casting_bx` | `/highteen/casting` |
| `bo_table=new_direct_bx` | `/highteen/casting` |
| `write.php?bo_table=new_audition` | `/highteen/casting` |
| `bo_table=new_calendar02` | `/highteen/casting` |
| `?co_id=enterance`, `?co_id=useguide` | `/highteen/guide` |
| `bo_table=new_starcard` | `/highteen/guide` |
| `?co_id=cs_call` | `/highteen/contact` |
| `write.php?bo_table=new_counsel` | `/highteen/contact` |
| `bo_table=new_counsel` | `/highteen/contact` |
| `?co_id=faq` | `/highteen/faq` |
| `bo_table=new_notice` | `/news` |

### 애비뉴센터 (baewoorun.co.kr)

단일 원페이지 → 전부 `/avenue` 로 301 리다이렉트.

### 구현 방식

```
Next.js middleware 사용
- 이유: 구 URL이 쿼리 파라미터 기반이라 next.config.js redirects로는 처리가 어려움
- middleware.ts에서 hostname + path/query 조합을 분석해 301 응답
- 구 도메인에서의 진입은 DNS 레벨에서 신규 도메인으로 라우팅 후 middleware 처리
```

서브도메인형 선택 시 추가 원칙:

- `*.domain.com` 와일드카드 DNS/SSL 구성이 필요하다.
- `hostname -> center slug` 매핑이 필요하다.
- 공개 접근 URL은 서브도메인형으로 통일하고, 내부 구현은 rewrite 기반으로 `/<center>` 경로를 재사용할 수 있다.

구 도메인 유지 기간: **최소 12개월** (Google Search Console 인덱스 전환 완료까지)

---

## 9. CMS 기반 콘텐츠 게이팅

콘텐츠가 없는 센터 섹션은 인덱싱되지 않도록 Payload CMS에서 제어한다.

**원칙:** 발행된 콘텐츠가 없는 섹션은 페이지를 생성하지 않고, GNB에도 노출하지 않는다.

```typescript
// 개념 예시
export async function generateStaticParams() {
  const centers = await getAllCenters()
  const params = []
  for (const center of centers) {
    const hasFaculty = await getPublishedFacultyCount(center.slug) > 0
    if (hasFaculty) {
      params.push({ center: center.slug })
    }
  }
  return params
}
```

센터 레이아웃의 2차 GNB도 동일하게:

```typescript
// 개념 예시
const navItems = [
  center.hasPrograms && { label: '프로그램', href: `/${center.slug}/programs` },
  center.hasFaculty && { label: '강사진', href: `/${center.slug}/faculty` },
  center.hasCasting && { label: '캐스팅/오디션', href: `/${center.slug}/casting` },
  // ...
].filter(Boolean)
```

애비뉴센터가 특정 섹션의 콘텐츠를 아직 등록하지 않았다면, 그 탭은 GNB에 나타나지 않고 URL도 생성되지 않는다. 콘텐츠가 Payload에 등록되는 순간 자동으로 활성화된다.

---

## 10. Codex 리뷰 대응 요약

| Codex 지적 | 해소 방법 |
|-----------|---------|
| [HIGH] 필터 URL 중복 콘텐츠 위험 | 쿼리 파라미터 대신 독립 URL로 전환. 기본안은 경로형(`/art/faculty`), 선택 옵션은 서브도메인형(`art.domain.com/faculty`). 각 URL에 고유 title·description·H1·canonical·Schema 적용. |
| [MEDIUM] 얇은 센터 도어웨이 페이지 위험 | ① 애비뉴센터 풀스케일 리뉴얼로 콘텐츠 확보. ② CMS 콘텐츠 게이팅으로 콘텐츠 없는 섹션은 URL 미생성 + sitemap 미포함. 도어웨이 구조 원천 차단. |

---

## 11. 관련 문서 연관 관계

| 문서 | 관계 |
|------|------|
| `docs/통합-사이트-메뉴-구조도.md` | 섹션 7의 쿼리 파라미터 URL을 이 문서의 경로 기반 URL로 대체 |
| `docs/IA-대안-비교안-v2.md` | 대안 2(센터 브랜드 GNB) 선택 시 이 문서의 URL 구조 적용 |
| `docs/IA-사이트구조분석.md` | 섹션 8 리다이렉트 매핑의 소스 데이터 |
