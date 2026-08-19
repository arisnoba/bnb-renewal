# GEO Audit Report: 배우앤배움

**감사일:** 2026-08-19
**URL:** https://www.baewooenm.com/
**사업 유형:** 하이브리드 — 로컬 교육기관 + 교육/캐스팅 서비스 브랜드
**분석 페이지:** 50개 HTML 페이지 (`www` 게이트 + 5개 센터 서브도메인)
**보조 점검:** 6개 호스트의 `robots.txt`, `sitemap.xml`, `llms.txt`, 응답 헤더와 외부 브랜드 표면

---

## Executive Summary

**Overall GEO Score: 59/100 (Poor)**

배우앤배움은 모든 표본 URL이 정상 응답하고 AI 크롤러 접근, `llms.txt`, 센터별 사이트맵, 실제 커리큘럼·캐스팅·교사진 경력 같은 1차 정보가 강합니다. 반면 외부 권위 신호가 자사 채널에 편중되고, 47/50페이지에 canonical이 없으며, FAQ를 제외한 조직·지점·인물·뉴스·과정 구조화 데이터가 거의 없어 AI가 브랜드 엔터티와 근거를 안정적으로 연결하기 어렵습니다.

59점은 기술 기반이 나쁘다는 의미가 아닙니다. **Technical GEO 79점, E-E-A-T 71점**의 양호한 기반이 있지만 **Brand Authority 43점, Schema 30점**이 전체 점수를 끌어내리는 구조입니다.

### Score Breakdown

| Category                 |  Score | Weight |     Weighted Score |
| ------------------------ | -----: | -----: | -----------------: |
| AI Citability            | 60/100 |    25% |              15.00 |
| Brand Authority          | 43/100 |    20% |               8.60 |
| Content E-E-A-T          | 71/100 |    20% |              14.20 |
| Technical GEO            | 79/100 |    15% |              11.85 |
| Schema & Structured Data | 30/100 |    10% |               3.00 |
| Platform Optimization    | 64/100 |    10% |               6.40 |
| **Overall GEO Score**    |        |        | **59.05 → 59/100** |

> 이 점수는 공개 웹 표면을 스킬의 가중 모델로 평가한 진단 지표이며 Google, OpenAI 또는 다른 플랫폼의 공식 점수가 아닙니다.

### 검증 방법과 범위

- 6개 호스트의 robots 규칙을 먼저 확인하고 허용된 공개 경로만 요청했습니다.
- 고유 HTML URL은 50개로 제한했고 요청 간 최소 1초 간격과 페이지당 30초 제한을 적용했습니다.
- 서버 응답 HTML과 설치된 Chrome의 렌더링 DOM을 모두 비교했습니다.
- 50개 URL은 모두 HTTP 200이었고 Chrome 렌더링 오류도 없었습니다.
- 렌더링 본문 중앙값은 약 247단어였으며 100단어 미만 페이지는 7개였습니다.
- PageSpeed Insights API가 일일 할당량 초과를 반환해 Lighthouse/Core Web Vitals 점수는 확인하지 못했습니다. 따라서 성능 평가는 응답 시간과 HTML 크기에 한정합니다.
- 뉴스 상세는 50페이지 한도 안에서 1개를 페이지 단위 표본으로 삼았고, 목록에서 발견한 상세 URL과 별도 스키마 검증으로 보완했습니다.

---

## Critical Issues (Fix Immediately)

**없음.** 도메인 전체 `noindex`, 전면 5xx, 전체 AI 크롤러 차단, 완전한 비색인 콘텐츠 같은 즉시 복구 수준의 문제는 발견되지 않았습니다.

## High Priority Issues

### 1. 가장 최신이고 인용 가치가 높은 상세 콘텐츠가 사이트맵에서 빠짐

6개 사이트맵은 모두 정상 XML이고 총 103개 정적 URL을 제공합니다. 그러나 센터 뉴스 목록에서 발견된 27개 고유 `/news/{id}` URL과 교사진 상세 URL은 사이트맵에 없었습니다. 표본 뉴스인 [Talk with BNB Q&A](https://art.baewooenm.com/news/6399)도 누락돼 있습니다.

**권장 수정:** 발행 상태인 뉴스·교사진·아티스트 상세 URL을 호스트별 사이트맵에 포함하고 정확한 `<lastmod>`를 제공합니다. 현재 6개 사이트맵에는 `<lastmod>`가 없습니다.

### 2. 브랜드·지점 엔터티 그래프가 없음

`www`와 5개 센터 홈에 `Organization`, `EducationalOrganization`, `LocalBusiness`, `sameAs`가 없습니다. 주소·전화·법인 정보가 화면에 있어도 AI가 `BNB INDUSTRY → 배우앤배움 EnM → 5개 센터` 관계를 기계적으로 확정하기 어렵습니다.

**권장 수정:** 안정적인 `@id`를 쓰는 JSON-LD `@graph`로 지주사, 교육 브랜드, 5개 센터를 분리하고 `parentOrganization`, `address`, `telephone`, `sameAs`로 연결합니다. 확인되지 않은 영업시간·좌표·수치는 넣지 않습니다.

### 3. 최상급·수치 주장에 기준일과 검증 근거가 없음

[센터소개](https://art.baewooenm.com/about)의 `대한민국 1위`, `국내 최초`, `국내 60여 개의 중·대형 기획사`, `연간 20편 이상`, `한예종 최대 합격률`은 인용 잠재력은 높지만 비교 범위·집계 기간·원자료 링크가 없습니다. FAQ의 신규 수강생 비율과 가격·할인 정보도 기준일과 분모가 필요합니다.

**권장 수정:** 각 주장 옆에 집계 기간, 표본, 산정 방식, 마지막 검토일, 내부 원장 또는 독립 출처를 연결합니다. 근거가 없으면 최상급 표현을 검증 가능한 사실형 문장으로 바꿉니다.

### 4. 외부 권위가 자사 채널에 편중됨

공식 YouTube와 센터별 Instagram·Naver Blog는 활발하지만, 제3자 리뷰·업계 분석·외부 인터뷰 표면은 상대적으로 약합니다. 공식 LinkedIn 회사 페이지는 공개 검색에서 확인되지 않았고 Reddit 정확 일치 언급도 발견되지 않았습니다. Wikipedia 회사 문서는 있으나 회사 Wikidata와 창업자 역할 연결은 불완전합니다.

**권장 수정:** 공식 LinkedIn 회사 페이지와 일관된 회사 설명을 만들고, 독립 미디어·동문·감독·캐스팅 관계자 채널의 검증 가능한 인터뷰/사례를 늘립니다. Wikipedia는 이해상충을 피하고 신뢰 가능한 독립 출처 중심으로만 보강합니다.

### 5. 콘텐츠 책임 주체가 약함

뉴스 상세에는 작성자·검수자·담당 부서가 없고 FAQ·내부 통계에는 검토일이 없습니다. 교사진 상세 페이지의 전문성은 강하지만 해당 전문가가 어떤 콘텐츠를 작성하거나 검수했는지 연결되지 않습니다.

**권장 수정:** 뉴스·가이드·FAQ에 실제 작성자 또는 발행 조직, 검수자, 게시일, 수정일을 표시하고 `Article.author`, `publisher`, `datePublished`, `dateModified`와 일치시킵니다.

## Medium Priority Issues

1. **Canonical 47/50 누락:** FAQ 3개 외에는 self-canonical이 없습니다. 과거 `www.baewooenm.com/{center}`와 레거시 도메인이 현재 서브도메인으로 리디렉션되므로 최종 URL을 명시해야 합니다.
2. **설명 메타 14/50 누락:** `/teachers`, `/casting-status`, `/news`, 표본 뉴스 상세에서 `description`과 `og:description`이 비어 있습니다.
3. **센터 홈 H1 5개 누락:** `art`, `exam`, `highteen`, `kids`, `avenue` 홈에 H2는 있지만 H1이 없습니다.
4. **비JS 추출 격차:** 커리큘럼·뉴스·FAQ 등 16개 URL은 원시 DOM 텍스트가 로딩 문구 수준이지만 Chrome 렌더링 후 본문이 나타납니다. 콘텐츠는 서버 응답의 Next.js 데이터에 직렬화되어 있어 완전한 client-only 페이지는 아니지만, 실행·파싱 능력이 제한된 크롤러에는 추출 부담이 있습니다.
5. **센터 소개 중복:** 5개 센터의 `/about` 본문이 사실상 동일합니다. 대상 연령, 정원, 운영 방식, 시설, 교육진, 성과를 센터별로 분리해야 합니다.
6. **FAQ 답변 정확성·이관 잔재:** 5개 FAQ의 110개 구조화 항목은 유효하지만 일부 답변에 `02-1577-9929`, 아트센터 층수·운영 정보, 과거 `/web/html/...` 경로가 남아 있어 센터별 검수가 필요합니다.
7. **센터별 `llms.txt` 우선순위 부족:** 6개 호스트가 동일한 7,414바이트 파일을 제공해 센터 호스트에서도 아트센터 링크 비중이 높습니다. `www`는 전체 허브, 센터 호스트는 해당 센터 우선 목록으로 분리하는 편이 좋습니다.
8. **공개 HTML 캐시·크기:** 홈 응답은 `private, no-cache, no-store`, Vercel cache MISS였고 센터 홈 HTML은 약 232–306KB였습니다. 안정적인 공개 콘텐츠에 ISR/재검증을 적용할 수 있는지 검토해야 합니다.

## Low Priority Issues

1. 표본 1,486개 이미지 중 951개가 비어 있거나 없는 `alt`로 감지됐습니다. 장식 이미지는 빈 alt가 맞을 수 있으므로 콘텐츠 이미지부터 의미 있는 대체 텍스트를 선별 적용합니다.
2. 공통 `FAMILY SITE` H2가 본문 H1보다 먼저 나타나는 페이지가 많습니다. 공통 UI는 본문 헤딩 계층을 방해하지 않게 조정합니다.
3. `[시설 안내](https://art.baewooenm.com/facilities)`는 렌더링 후에도 약 24단어로 이미지 의존도가 높습니다. 공간 수, 용도, 주요 설비, 접근성을 텍스트로 보강합니다.
4. 애비뉴센터의 독립 주소·전화·운영 정보 노출을 다른 센터와 같은 수준으로 확인하고, footer의 `배움앤배움` 표기가 등록 상호인지 오기인지 검토합니다.

---

## Category Deep Dives

### AI Citability (60/100)

#### 강점

- [키즈센터 커리큘럼](https://kids.baewooenm.com/curriculum)은 과정별 정원 6명, 단계별 목표와 훈련 내용을 구체적으로 제공합니다.
- [입시센터 커리큘럼](https://exam.baewooenm.com/curriculum)은 정원, 주당 횟수, 월 시간, 가격처럼 비교 가능한 데이터를 제공합니다.
- [아트센터 캐스팅 현황](https://art.baewooenm.com/casting-status)은 작품명, 방송사, 배우, 배역, 회차로 구성된 고유 1차 데이터입니다.
- 5개 FAQ에는 총 110개 유효 Q&A가 JSON-LD로 제공돼 질문 추출 기반이 좋습니다.

#### 약점

- 유용한 정보가 긴 홍보 서술이나 목록 안에 있고, “질문 → 40~60단어 직접 답변 → 근거” 구조가 부족합니다.
- FAQ 답변은 접힌 UI와 JSON-LD에 존재하지만 첫 표시 텍스트에는 질문 중심으로 잡힙니다.
- 캐스팅·합격 수치에는 기준일, 중복 처리, 표본 정의가 부족합니다.

#### 권장 답변 블록 예시

```markdown
## 배우앤배움 입시센터의 입시반은 어떻게 운영되나요?

배우앤배움 입시센터 입시반은 최대 8명 소수정예로 운영됩니다. 주 5회 과정은 월 60시간, 주 4회 과정은 월 48시간이며 연기·움직임·보컬 훈련과 대학별 실기 전략을 함께 구성합니다. 수업료와 시간표는 2026년 8월 기준이며 변경 시 이 페이지의 기준일을 갱신합니다.
```

### Brand Authority (43/100)

#### 확인된 권위 표면

- [공식 YouTube](https://www.youtube.com/@BNB_ENM): 약 1.05만 구독자, 717개 영상, 약 126.9만 누적 조회가 공개 표면에서 확인됐고 감사 당일 신규 업로드가 있었습니다.
- 센터별 Instagram: [아트](https://www.instagram.com/bnbartcenter/), [입시](https://www.instagram.com/bnb_univ/), [키즈](https://www.instagram.com/bnbkids_agency/), [하이틴](https://www.instagram.com/bnb_highteen/), [애비뉴](https://www.instagram.com/bnb_avenuecenter/).
- Naver Blog: [아트](https://blog.naver.com/baewoobaewoo), [입시](https://blog.naver.com/bnb__univ), [키즈](https://blog.naver.com/bnb__kids), [하이틴](https://blog.naver.com/bnb_highteen).
- [비앤비인더스트리 Wikipedia](https://ko.wikipedia.org/wiki/%EB%B9%84%EC%95%A4%EB%B9%84%EC%9D%B8%EB%8D%94%EC%8A%A4%ED%8A%B8%EB%A6%AC)와 [임채홍 Wikidata](https://www.wikidata.org/wiki/Q43089192)가 존재합니다.
- 제3자 표면으로 [JobKorea 회사 프로필](https://www.jobkorea.co.kr/company/46160215), [임채홍 의장 인터뷰](https://v.daum.net/v/20250728103612732), [BNB IDOL LAB 기사](https://www.thepowernews.co.kr/view.php?ud=2026070711255431119aeda69934_7)가 확인됐습니다.

#### 핵심 문제

`배우앤배움`, `배우앤배움 EnM`, `BNB ENM`, `BNB INDUSTRY`, `비앤비인더스트리`가 플랫폼별로 혼용됩니다. 영문 `BNB`는 Binance·Airbnb 관련 결과와 충돌하므로 공식 설명에서 법인-브랜드-센터 관계와 대표 도메인을 일관되게 반복해야 합니다.

Reddit 결과 부재와 LinkedIn 회사 페이지 부재는 공개·비로그인 검색 표본 기준이며 절대적 부재를 의미하지 않습니다.

### Content E-E-A-T (71/100)

#### 강점

- 커리큘럼, 캐스팅, 입학 데이터와 실제 가격·운영 시간이 경험 신호를 만듭니다.
- [송민지 교육진 상세](https://art.baewooenm.com/teachers/%EC%86%A1%EB%AF%BC%EC%A7%80)는 학력, TV·영화·연극·CF 경력, 작품 연도와 배역을 제공합니다. 전문 프로필은 존재하지만 사이트맵에서 발견되기 어렵습니다.
- 각 센터의 주소, 대표전화 `1577-9929`, 법인·사업자·학원 등록 정보, 이용약관·개인정보처리방침이 신뢰 기반을 만듭니다.
- 뉴스와 캐스팅 데이터가 2026년까지 갱신돼 최신성은 양호합니다.

#### 약점

- 외부 원문 링크와 독립 검증이 적어 Authoritativeness가 Experience·Expertise보다 약합니다.
- 뉴스·FAQ에 작성자·검수자·수정일이 부족합니다.
- 합격·캐스팅·신규 수강생 통계에 방법론이 없습니다.

### Technical GEO (79/100)

#### 크롤러 접근

6개 `robots.txt`는 모두 다음 정책을 제공했습니다.

```text
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://{host}/sitemap.xml
```

GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot 등은 wildcard 허용을 상속합니다. `noindex`, `X-Robots-Tag`, 전면 차단은 발견되지 않았습니다.

#### `llms.txt`

`llms.txt` 자체 점수는 86/100입니다. H1, 소개, 7개 H2 섹션, 핵심 사실, 연락처, 29개 고유 URL이 있어 유용합니다. 다만 모든 호스트가 동일 파일을 제공하고 법적 페이지 링크가 최종 URL까지 두 번 리디렉션되며, 최신 뉴스와 센터별 상세 우선순위가 부족합니다.

#### 응답·렌더링

- 50페이지 평균 fetch 약 381ms, p95 약 650ms, 최대 약 1.785초였습니다.
- 게이트 HTML은 약 71KB, 센터 홈은 약 232–306KB였습니다.
- HSTS와 CSP가 확인됐습니다.
- 핵심 콘텐츠가 서버 응답의 Next.js 데이터에 포함되어 검색 엔진이 실제로 색인하고 있으나, 일부 페이지는 일반 DOM 텍스트와 Chrome 렌더링 결과의 격차가 큽니다.

### Schema & Structured Data (30/100)

#### 확인된 스키마

5개 FAQ는 모두 유효한 `FAQPage → Question → acceptedAnswer → Answer` 구조를 서버 HTML에 제공합니다.

| FAQ                                              | 항목 수 | 상태 |
| ------------------------------------------------ | ------: | ---- |
| [아트센터](https://art.baewooenm.com/faq)        |      27 | 유효 |
| [입시센터](https://exam.baewooenm.com/faq)       |      18 | 유효 |
| [하이틴센터](https://highteen.baewooenm.com/faq) |      18 | 유효 |
| [키즈센터](https://kids.baewooenm.com/faq)       |      24 | 유효 |
| [애비뉴센터](https://avenue.baewooenm.com/faq)   |      23 | 유효 |

총 110개 중 105개는 UI 답변과 정규화한 JSON-LD 답변이 일치했고, 5개는 표 변환 구분자 차이가 있었습니다. FAQPage는 Schema.org 타입으로 유지할 가치가 있지만 Google은 FAQ 리치 결과를 종료했으므로, 검색 장식이 아닌 AI 이해와 데이터 명료성을 목표로 관리해야 합니다. [Google Search 변경 내역](https://developers.google.com/search/updates#removing-faq-rich-result)

#### 빠진 스키마

- 홈·회사: `Organization`, `EducationalOrganization`, `WebSite`, `sameAs`
- 센터·지도: `EducationalOrganization` + `LocalBusiness`, 주소·전화·지도·서비스 지역
- 뉴스: `Article`, 발행일·수정일·작성자·publisher
- 커리큘럼: `Course`, `CourseInstance`, provider·교육 수준·훈련 내용
- 교사진: `Person` 또는 `ItemList<Person>`, 학력·직무·소속·전문 분야
- 내부 경로: `BreadcrumbList`

사이트에 실제 검색 기능이 확인되지 않았으므로 `SearchAction`은 임의로 만들지 않습니다.

### Platform Optimization (64/100)

YouTube, Instagram, Naver Blog의 운영 빈도와 규모는 좋습니다. 반면 LinkedIn·Wikidata 회사 엔터티·독립 커뮤니티 언급이 약하고 지주사와 교육 브랜드의 교차 링크가 부족합니다. 자사 채널의 강한 운영 데이터를 `sameAs`와 일관된 소개 문구로 묶고, Naver에만 있는 성과 콘텐츠를 공식 사이트의 구조화된 사례와 YouTube 자막·설명으로 재발행하는 것이 효과적입니다.

---

## Quick Wins (Implement This Week)

1. 모든 공개 페이지에 최종 호스트 기준 absolute self-canonical을 추가합니다.
2. 뉴스·교사진 상세 URL과 `<lastmod>`를 사이트맵에 추가합니다.
3. 5개 센터 홈에 센터 역할을 답하는 H1을 넣고, 14개 누락 페이지의 meta/OG description을 채웁니다.
4. `BNB INDUSTRY → 배우앤배움 EnM → 5개 센터` JSON-LD `@graph`와 공식 `sameAs`를 구현합니다.
5. `/about`과 FAQ의 수치·최상급 주장에 기준일과 산정 근거를 붙이고 센터별 이관 오류를 정정합니다.

## 30-Day Action Plan

### Week 1: 발견성·정규 URL

- [ ] 공통 metadata 생성 경로에 absolute canonical을 추가하고 50개 표본으로 재검증
- [ ] 뉴스·교사진·아티스트 상세를 host-aware sitemap에 포함
- [ ] 게시·수정일 기반 `<lastmod>` 추가
- [ ] 센터 홈 H1과 누락 description/OG description 보완

### Week 2: 엔터티·구조화 데이터

- [ ] 법인, 교육 브랜드, 5개 센터의 JSON-LD `@graph` 작성
- [ ] 센터별 주소·전화·공식 SNS를 검증한 뒤 LocalBusiness/EducationalOrganization에 연결
- [ ] 뉴스 Article, 교사진 Person, 커리큘럼 Course, BreadcrumbList 적용
- [ ] Schema.org validator와 실제 렌더링 HTML로 재검증

### Week 3: 인용 콘텐츠·신뢰 근거

- [ ] 핵심 커리큘럼·FAQ·캐스팅 페이지에 질문형 H2와 answer-first 요약 추가
- [ ] 수치·합격·캐스팅 주장에 집계 기간, 표본, 중복 처리, 검토일 추가
- [ ] 뉴스·가이드에 작성자/검수자/수정일과 교육진 프로필 연결
- [ ] 5개 `/about`을 센터별 대상·정원·방식·성과 중심으로 고유화

### Week 4: 외부 권위·측정

- [ ] 법인·브랜드·센터 명칭과 공식 URL을 모든 채널에서 통일
- [ ] 공식 LinkedIn 회사 페이지와 회사 Wikidata 필요성을 검토하고 독립 출처로 보강
- [ ] 동문·감독·캐스팅 관계자의 외부 인터뷰와 검증 가능한 사례 확보
- [ ] Google Search Console 색인·사이트맵 상태, AI 유입 로그, 브랜드 질의 노출을 기준선으로 기록
- [ ] PageSpeed/Lighthouse와 실제 Core Web Vitals를 할당량 정상화 후 재측정

---

## Appendix: Pages Analyzed

`비JS 추출 격차`는 콘텐츠 부재가 아니라 일반 DOM 텍스트 추출과 Chrome 렌더링 결과의 큰 차이를 뜻합니다. `핵심 스키마 없음`은 해당 페이지 역할상 Organization/LocalBusiness/Article/Course/Person 계열이 유용하지만 발견되지 않았다는 의미입니다.

| URL                                            | Title                                                           | GEO Issues                                                            |
| ---------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| https://www.baewooenm.com/                     | 센터 선택 - 배우앤배움                                          | 2: canonical 없음, 핵심 스키마 없음                                   |
| https://art.baewooenm.com/                     | 배우앤배움 아트센터                                             | 3: canonical 없음, H1 없음, 핵심 스키마 없음                          |
| https://art.baewooenm.com/company              | 회사소개 - 배우앤배움 아트센터                                  | 1: canonical 없음                                                     |
| https://art.baewooenm.com/about                | 센터소개 - 배우앤배움 아트센터                                  | 1: canonical 없음                                                     |
| https://art.baewooenm.com/facilities           | 시설 안내 - 배우앤배움 아트센터                                 | 2: canonical 없음, 얇은 본문                                          |
| https://art.baewooenm.com/map                  | 오시는 길 - 배우앤배움 아트센터                                 | 2: canonical 없음, 핵심 스키마 없음                                   |
| https://art.baewooenm.com/grade-system         | 등급제 교육관리시스템 - 배우앤배움 아트센터                     | 1: canonical 없음                                                     |
| https://art.baewooenm.com/teachers             | 교육진 소개 - 배우앤배움 아트센터                               | 3: canonical 없음, description 없음, 핵심 스키마 없음                 |
| https://art.baewooenm.com/curriculum           | 커리큘럼 - 배우앤배움 아트센터                                  | 3: canonical 없음, 비JS 추출 격차, 핵심 스키마 없음                   |
| https://art.baewooenm.com/casting-status       | 캐스팅 출연현황 - 배우앤배움 아트센터                           | 2: canonical 없음, description 없음                                   |
| https://art.baewooenm.com/casting              | 캐스팅 센터 - 배우앤배움 아트센터                               | 1: canonical 없음                                                     |
| https://art.baewooenm.com/news                 | 뉴스 - 배우앤배움 아트센터                                      | 4: canonical 없음, description 없음, 비JS 추출 격차, 핵심 스키마 없음 |
| https://art.baewooenm.com/faq                  | 자주하는 질문 - 배우앤배움 아트센터                             | 1: 비JS 추출 격차                                                     |
| https://art.baewooenm.com/consult              | 상담하기 - 배우앤배움 아트센터                                  | 1: canonical 없음                                                     |
| https://exam.baewooenm.com/                    | 배우앤배움 입시센터                                             | 3: canonical 없음, H1 없음, 핵심 스키마 없음                          |
| https://exam.baewooenm.com/company             | 회사소개 - 배우앤배움 입시센터                                  | 1: canonical 없음                                                     |
| https://exam.baewooenm.com/about               | 센터소개 - 배우앤배움 입시센터                                  | 1: canonical 없음                                                     |
| https://exam.baewooenm.com/map                 | 오시는 길 - 배우앤배움 입시센터                                 | 2: canonical 없음, 핵심 스키마 없음                                   |
| https://exam.baewooenm.com/management          | 입시 매니지먼트 - 배우앤배움 입시센터                           | 1: canonical 없음                                                     |
| https://exam.baewooenm.com/teachers            | 교육진 소개 - 배우앤배움 입시센터                               | 4: canonical 없음, description 없음, 얇은 본문, 핵심 스키마 없음      |
| https://exam.baewooenm.com/curriculum          | 커리큘럼 - 배우앤배움 입시센터                                  | 3: canonical 없음, 비JS 추출 격차, 핵심 스키마 없음                   |
| https://exam.baewooenm.com/university-results  | 대학교 합격현황 - 배우앤배움 입시센터                           | 3: canonical 없음, 얇은 본문, 비JS 추출 격차                          |
| https://exam.baewooenm.com/passed-reviews      | 수강생 합격후기 - 배우앤배움 입시센터                           | 2: canonical 없음, 비JS 추출 격차                                     |
| https://exam.baewooenm.com/news                | 뉴스 - 배우앤배움 입시센터                                      | 4: canonical 없음, description 없음, 비JS 추출 격차, 핵심 스키마 없음 |
| https://exam.baewooenm.com/faq                 | 자주하는 질문 - 배우앤배움 입시센터                             | 1: 비JS 추출 격차                                                     |
| https://exam.baewooenm.com/consult             | 상담하기 - 배우앤배움 입시센터                                  | 1: canonical 없음                                                     |
| https://highteen.baewooenm.com/                | 배우앤배움 하이틴센터                                           | 3: canonical 없음, H1 없음, 핵심 스키마 없음                          |
| https://highteen.baewooenm.com/about           | 센터소개 - 배우앤배움 하이틴센터                                | 1: canonical 없음                                                     |
| https://highteen.baewooenm.com/map             | 오시는 길 - 배우앤배움 하이틴센터                               | 2: canonical 없음, 핵심 스키마 없음                                   |
| https://highteen.baewooenm.com/grade-system    | 등급제 교육관리시스템 - 배우앤배움 하이틴센터                   | 1: canonical 없음                                                     |
| https://highteen.baewooenm.com/teachers        | 교육진 소개 - 배우앤배움 하이틴센터                             | 4: canonical 없음, description 없음, 얇은 본문, 핵심 스키마 없음      |
| https://highteen.baewooenm.com/special-lecture | 특강 - 배우앤배움 하이틴센터                                    | 3: canonical 없음, 얇은 본문, 비JS 추출 격차                          |
| https://highteen.baewooenm.com/casting-status  | 캐스팅 출연현황 - 배우앤배움 하이틴센터                         | 2: canonical 없음, description 없음                                   |
| https://highteen.baewooenm.com/news            | 뉴스 - 배우앤배움 하이틴센터                                    | 4: canonical 없음, description 없음, 비JS 추출 격차, 핵심 스키마 없음 |
| https://highteen.baewooenm.com/faq             | 자주하는 질문 - 배우앤배움 하이틴센터                           | 1: 비JS 추출 격차                                                     |
| https://kids.baewooenm.com/                    | 배우앤배움 키즈센터                                             | 3: canonical 없음, H1 없음, 핵심 스키마 없음                          |
| https://kids.baewooenm.com/about               | 센터소개 - 배우앤배움 키즈센터                                  | 1: canonical 없음                                                     |
| https://kids.baewooenm.com/map                 | 오시는 길 - 배우앤배움 키즈센터                                 | 2: canonical 없음, 핵심 스키마 없음                                   |
| https://kids.baewooenm.com/grade-system        | 등급제 교육관리시스템 - 배우앤배움 키즈센터                     | 1: canonical 없음                                                     |
| https://kids.baewooenm.com/teachers            | 교육진 소개 - 배우앤배움 키즈센터                               | 4: canonical 없음, description 없음, 얇은 본문, 핵심 스키마 없음      |
| https://kids.baewooenm.com/curriculum          | 커리큘럼 - 배우앤배움 키즈센터                                  | 3: canonical 없음, 비JS 추출 격차, 핵심 스키마 없음                   |
| https://kids.baewooenm.com/casting-status      | 캐스팅 출연현황 - 배우앤배움 키즈센터                           | 2: canonical 없음, description 없음                                   |
| https://kids.baewooenm.com/news                | 뉴스 - 배우앤배움 키즈센터                                      | 4: canonical 없음, description 없음, 비JS 추출 격차, 핵심 스키마 없음 |
| https://avenue.baewooenm.com/                  | 배우앤배움 애비뉴센터                                           | 3: canonical 없음, H1 없음, 핵심 스키마 없음                          |
| https://avenue.baewooenm.com/about             | 센터소개 - 배우앤배움 애비뉴센터                                | 1: canonical 없음                                                     |
| https://avenue.baewooenm.com/grade-system      | 등급제 교육관리시스템 - 배우앤배움 애비뉴센터                   | 1: canonical 없음                                                     |
| https://avenue.baewooenm.com/teachers          | 교육진 소개 - 배우앤배움 애비뉴센터                             | 4: canonical 없음, description 없음, 얇은 본문, 핵심 스키마 없음      |
| https://avenue.baewooenm.com/curriculum        | 커리큘럼 - 배우앤배움 애비뉴센터                                | 3: canonical 없음, 비JS 추출 격차, 핵심 스키마 없음                   |
| https://avenue.baewooenm.com/news              | 뉴스 - 배우앤배움 애비뉴센터                                    | 4: canonical 없음, description 없음, 비JS 추출 격차, 핵심 스키마 없음 |
| https://art.baewooenm.com/news/6399            | [QnA] 무엇이든 물어보세요! Talk with BNB! - 배우앤배움 아트센터 | 4: canonical 없음, description 없음, 비JS 추출 격차, 핵심 스키마 없음 |

## Audit Limitations

- 외부 플랫폼 수치는 로그인하지 않은 공개 검색·메타데이터 스냅샷이며 변동될 수 있습니다.
- Reddit API는 403이어서 웹 검색 결과에 의존했고 LinkedIn은 비로그인 노출 범위가 제한됩니다.
- FAQ·교사진 상세처럼 상호작용 또는 상세 이동 후 보이는 콘텐츠는 대표 표본을 추가 검증했지만 모든 항목을 수동 전수 검증하지는 않았습니다.
- Google Business Profile, 실제 계약, 합격·캐스팅 원장, 내부 분석 도구 데이터는 확인하지 않았습니다.
- 이 보고서는 읽기 전용 감사 결과입니다. 원격·운영 시스템과 사이트 콘텐츠는 변경하지 않았습니다.
