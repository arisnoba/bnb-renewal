# 배우앤배움 통합 사이트 SEO URL 전략

> **작성 배경:** `docs/통합-사이트-메뉴-구조도.md`의 쿼리 파라미터 URL 설계(`/faculty?center=art`)는 SEO 위험을 내포하고 있어 이를 경로 기반 URL로 대체하는 전략을 정의한다.
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

### 해결 방향: 경로 기반 URL + 단일 템플릿 공유

```
✅ /art/faculty      (아트센터 강사진)
✅ /highteen/faculty (하이틴센터 강사진)
✅ /kids/programs    (키즈센터 프로그램)
```

**핵심 포인트:** URL 구조는 다르지만 Next.js 컴포넌트는 하나를 공유한다. `app/[center]/faculty/page.tsx` 파일 하나가 `params.center` 값에 따라 5개 센터 페이지를 모두 처리한다. 관리 비용은 동일하게 통합된다.

---

## 2. URL 구조 전체 정의

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

---

## 4. 센터별 고유 SEO 메타데이터

### 생성 원칙

같은 `FacultyPage` 컴포넌트를 쓰더라도 `generateMetadata`에서 센터별로 다른 메타데이터를 생성한다.

```typescript
// app/[center]/faculty/page.tsx (개념 예시)
export async function generateMetadata({ params }) {
  const center = await getCenterData(params.center) // Payload CMS 조회
  return {
    title: `강사진 - ${center.name} | 배우앤배움`,
    description: center.seo.facultyDescription,
    openGraph: {
      title: `강사진 - ${center.name} | 배우앤배움`,
      description: center.seo.facultyDescription,
      url: `https://bnb.co.kr/${params.center}/faculty`,
      images: [center.seo.facultyOgImage],
    },
    alternates: {
      canonical: `https://bnb.co.kr/${params.center}/faculty`,
    },
  }
}
```

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

---

## 7. Sitemap 구조

동적 sitemap을 Next.js에서 센터별로 분리 생성한다.

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

각 URL 항목:
- `<loc>`: 절대 경로 canonical URL
- `<lastmod>`: Payload CMS `updatedAt` 자동 연동
- `<priority>`: 센터 랜딩 0.9 → 섹션 목록 0.8 → 상세 0.6

### robots.txt

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

### 도메인 레벨 리다이렉트

| 구 도메인 | 신규 도메인 매핑 |
|---------|--------------|
| `baewoo.co.kr/*` | `https://bnb.co.kr/art/*` |
| `baewoo.kr/*` | `https://bnb.co.kr/exam/*` |
| `baewoo.net/*` | `https://bnb.co.kr/kids/*` |
| `baewoo.me/*` | `https://bnb.co.kr/highteen/*` |
| `baewoorun.co.kr` | `https://bnb.co.kr/avenue` |

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
| [HIGH] 필터 URL 중복 콘텐츠 위험 | 경로 기반 URL(`/art/faculty`)로 전환. 각 URL에 고유 title·description·H1·canonical·Schema 적용. 구글이 5개를 독립 브랜드 페이지로 인식. |
| [MEDIUM] 얇은 센터 도어웨이 페이지 위험 | ① 애비뉴센터 풀스케일 리뉴얼로 콘텐츠 확보. ② CMS 콘텐츠 게이팅으로 콘텐츠 없는 섹션은 URL 미생성 + sitemap 미포함. 도어웨이 구조 원천 차단. |

---

## 11. 관련 문서 연관 관계

| 문서 | 관계 |
|------|------|
| `docs/통합-사이트-메뉴-구조도.md` | 섹션 7의 쿼리 파라미터 URL을 이 문서의 경로 기반 URL로 대체 |
| `docs/IA-대안-비교안-v2.md` | 대안 2(센터 브랜드 GNB) 선택 시 이 문서의 URL 구조 적용 |
| `docs/IA-사이트구조분석.md` | 섹션 8 리다이렉트 매핑의 소스 데이터 |
