# BNB 리뉴얼 디자인 가이드

## 피그마 파일

- **파일명**: BNB Renewal sRgb (26.04.01~)
- **파일 링크**: https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-
- **작업 페이지**: 리뉴얼 디자인 작업

---

## 사이트 구조 (GNB 메뉴)

| 순번 | 섹션 | 서브메뉴 | 피그마 섹션 |
|------|------|---------|------------|
| 01 | 배우앤배움 | 회사 소개, 센터 소개, 시설 안내, 오시는 길 | 기업소개 |
| 02 | 교육 | 등급제 교육관리시스템, 엔터테인먼트 위탁교육, 교육진 소개, 커리큘럼 | 교육 |
| 03 | 캐스팅 | BNB 출연장면, 캐스팅 출연현황, 캐스팅 센터, 배우 케어 시스템, 촬영ㆍ오디션 스케줄 | 캐스팅 |
| 04 | 아티스트 | BNB출신 아티스트, BNB 루키 | 매니지먼트 |
| 05 | 지원센터 | NEWS&NOTICE, 입학안내, 학원100%이용법, 스타카드 멤버쉽서비스, 자주하는 질문 | 운영 |

### 입시센터 GNB 예외 구조

입시센터(`exam`)는 아트센터 기준 1depth를 일부 대체한다. `교육`에는 입시 전용 메뉴와 엔터테인먼트 위탁교육을 함께 노출하며, `캐스팅`은 `합격현황`, `아티스트`는 `합격자소개`로 표시한다.

| 순번 | 섹션 | 서브메뉴 | 비고 |
|------|------|---------|------|
| 01 | 배우앤배움 | 회사 소개, 센터 소개, 시설 안내, 오시는 길 | 공통 |
| 02 | 교육 | 입시 매니지먼트, 특별한 시스템, 엔터테인먼트 위탁교육, 교육진 소개, 커리큘럼 | 입시센터 전용 |
| 03 | 합격현황 | 대학교, 예술고등학교 | 입시센터 전용 |
| 04 | 합격자소개 | 합격 후기, 합격 영상 | 입시센터 전용 |
| 05 | 지원센터 | NEWS&NOTICE, 입학안내, 학원100%이용법, 스타카드 멤버쉽서비스, 자주하는 질문 | 공통 |

### 하이틴센터 GNB 구조

하이틴센터(`highteen`)는 아트센터와 같은 1depth를 유지하되, 공개 GNB 2depth는 아래 구조를 기준으로 한다. 후보 메뉴였던 `대표인사말`, `BNB 캐스팅`, `IMGround 캐스팅`, `BX모델에이전시`, `다이렉트 캐스팅`, `BNB 캐스팅 섭외뉴스`, `매니지먼트 시스템`, `프로필 촬영ㆍ제작`, `오디션 지원하기`는 하이틴 GNB 2depth에 노출하지 않는다.

| 순번 | 섹션 | 서브메뉴 | 비고 |
|------|------|---------|------|
| 01 | 배우앤배움 | 회사 소개, 센터 소개, 시설 안내, 오시는 길 | 하이틴센터 |
| 02 | 교육 | 등급제 교육관리시스템, 엔터테인먼트 위탁교육, 교육진 소개, 커리큘럼, 하이틴센터 특강 | 하이틴센터 |
| 03 | 캐스팅 | BNB 출연장면, 캐스팅 출연현황, 캐스팅 센터, 배우 케어 시스템, 촬영ㆍ오디션 스케줄 | 하이틴센터 |
| 04 | 아티스트 | BNB 출신 아티스트, BNB 루키 | 하이틴센터 |
| 05 | 지원센터 | NEWS&NOTICE, 입학안내, 학원100%이용법, 스타카드 멤버쉽서비스, 자주하는 질문 | 공통 |

### 키즈센터 GNB 구조

키즈센터(`kids`)는 아트센터와 같은 1depth를 유지하되, 공개 GNB 2depth는 아래 구조를 기준으로 한다. `커리큘럼`은 정적 페이지(`/kids/curriculum`)로 연결한다. 후보 메뉴였던 `대표인사말`, `영재 교육과정`, `아역배우 교육과정`, `아티스트 교육과정`, `BNB 캐스팅`, `IMGround 캐스팅`, `매니지먼트 시스템`, `아역배우 프로필`, `프로필 촬영ㆍ제작`은 키즈 GNB 2depth에 노출하지 않는다.

| 순번 | 섹션 | 서브메뉴 | 비고 |
|------|------|---------|------|
| 01 | 배우앤배움 | 회사 소개, 센터 소개, 시설 안내, 오시는 길 | 키즈센터 |
| 02 | 교육 | 등급제 교육관리시스템, 엔터테인먼트 위탁교육, 커리큘럼, 교육진 소개 | 키즈센터 |
| 03 | 캐스팅 | BNB 출연장면, 캐스팅 출연현황, 캐스팅 센터, 배우 케어 시스템, 촬영ㆍ오디션 스케줄 | 키즈센터 |
| 04 | 아티스트 | BNB 출신 아티스트, BNB 루키 | 키즈센터 |
| 05 | 지원센터 | NEWS&NOTICE, 입학안내, 학원100%이용법, 스타카드 멤버쉽서비스, 자주하는 질문 | 공통 |

---

## 공통 컴포넌트

피그마 Section 1에 위치 (node-id: 1:1607)

| 컴포넌트 | 설명 | 피그마 링크 |
|---------|------|------------|
| GNB | 글로벌 네비게이션 바 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1608) |
| GNB Hover | 전체 메뉴 구조를 보여주는 메가 메뉴 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=38:9927) |
| Footer | 푸터 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1662) |

---

## 페이지 루트 클래스

페이지 루트 클래스는 공통 루트, 표면 톤, 상단 offset 필요 여부, 페이지 식별자를 분리해서 쓴다. 페이지 식별자가 배경색이나 상단 padding 적용 여부를 결정하지 않는다.

- 공통 루트 클래스: `page`
- 표면 톤 클래스: `page-light`, `page-dark`
- 상단 offset 클래스: `page-top-offset`
- 페이지 식별 클래스: `page-landing`, `page-faq`, `page-starcard`, `page-detail`처럼 실제 화면/템플릿을 표시한다.

| 클래스 | 대상 | 현재 적용 예 |
|--------|------|--------------|
| `page` | 모든 공개 페이지 루트 | 전체 페이지 공통 제어 |
| `page-light` | 흰 배경/검정 텍스트 기반 페이지 | FAQ, 스타카드, 상세 페이지 |
| `page-dark` | 검정 배경/흰 텍스트 기반 페이지 | 센터 랜딩, 오시는 길, 등급제 교육관리시스템 |
| `page-landing` | 랜딩/섹션 조립형 페이지 | `/`, `/{center}` |
| `page-landing--center` | 센터 랜딩 보조 클래스 | `/{center}` |
| `page-faq` | FAQ 목록 페이지 | `/{center}/faq` |
| `page-starcard` | 스타카드 제휴업체 페이지 | `/{center}/starcard` |
| `page-detail` | CMS 데이터 기반 상세 페이지 | `/news/[slug]`, `/artist-press/[slug]`, `/profiles/[slug]`, `/{center}/profiles/{profileSlug}` |
| `page-top-offset` | hero 없이 첫 콘텐츠가 고정 GNB/관리자 바 아래에서 시작되어야 하는 화면 | 상세 페이지, `/{center}/faq`, `/{center}/starcard` |

`page-top-offset`은 로그인 여부에 따라 높이가 달라지는 관리자 바와 고정 헤더를 피해야 하므로, 전역 CSS 변수 기반 상단 padding을 사용한다. hero가 GNB 뒤로 깔리는 화면은 `page-top-offset`을 붙이지 않고 hero 섹션 자체에서 여백을 제어한다.

---

## 프론트 구현 스타일 원칙

이 프로젝트의 공개 프론트엔드는 **Tailwind 우선**으로 구현한다. `/{center}/grade-system`처럼 레이아웃, 반응형 분기, 고정 padding/margin, grid/flex, 색상, 폰트 크기, border 등 대부분의 시각 스타일은 `className`의 Tailwind 유틸리티로 직접 작성한다.

의미 있는 클래스명은 Tailwind를 대체하기 위한 것이 아니라, 나중에 화면별 커스텀을 쉽게 하기 위한 **식별자와 확장 훅**이다. 예를 들어 FAQ 페이지는 `section-faq-list`, `section-faq-list__search`, `section-faq-item__summary` 같은 클래스명을 주요 요소에 함께 붙일 수 있다. 단, 이 클래스의 기본 역할은 “중요 요소를 찾고 필요한 예외 스타일을 덧붙이는 것”이며, 반응형 레이아웃과 고정 spacing을 전부 별도 CSS로 옮기는 방식이 아니다.

한국어 줄바꿈 품질을 위해 공개 프론트엔드는 전역 `word-break: keep-all`을 기본으로 사용한다. 전역 `overflow-wrap: break-word`는 한국어 단어 중간 줄바꿈을 다시 허용할 수 있으므로 함께 두지 않고, 긴 URL이나 영문 토큰이 있는 요소에만 `break-words`, `break-all`, `[overflow-wrap:anywhere]`를 제한적으로 사용한다.

권장 형태:

```tsx
<section className="section-faq-list py-20 md:py-[120px]">
  <div className="container-sm">
    <form className="section-faq-list__search flex h-[45px] rounded-full border border-foreground/40">
      {/* 검색 UI */}
    </form>
  </div>
</section>
```

아이콘 사용 기준:

- 버튼/링크 안의 방향, 닫기, 검색, 다운로드 같은 UI 기호는 `>`, `→`, `×` 같은 텍스트 문자로 직접 쓰지 않는다.
- UI용 아이콘은 프로젝트의 기본 아이콘 컴포넌트인 `lucide-react`를 우선 사용한다.
- 가능한 경우 `lucide-react` 아이콘을 사용한다. 예: `ChevronRight`, `X`, `Search`, `Download`.
- 아이콘은 `aria-hidden="true"`를 붙이고, 버튼/링크의 접근 가능한 이름은 실제 텍스트나 `aria-label`로 제공한다.
- 텍스트와 함께 쓰는 아이콘은 Tailwind로 크기와 간격을 명확히 둔다. 예: `<ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />`.

별도 CSS/SCSS는 다음처럼 Tailwind만으로 표현하기 어렵거나 재사용 커스텀이 필요한 경우에 제한한다.

- `details[open]`, `summary::-webkit-details-marker`처럼 상태/브라우저 기본 스타일 제어가 필요한 경우
- `::before`, `::after` 장식 요소. 아이콘은 우선 아이콘 컴포넌트를 사용한다.
- Tailwind 유틸리티만으로 유지보수가 어려운 복잡한 selector
- 페이지별 후속 커스텀을 위해 비워 두거나 최소화한 의미 클래스 hook

---

## 01. 기업소개

피그마 섹션 node-id: `38:6476`

| 화면 | 피그마 이름 | 피그마 링크 | 구현 |
|------|-----------|------------|------|
| 기업소개 메인 (Desktop) | BNB_02교육_01등급제교육관리시스템 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=38:10759) | ❌ |
| 기업소개 메인 (Mobile) | BNB_02교육_01등급제교육관리시스템 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=42:11825) | ❌ |
| 기업소개 소개 | bnb_아트센터_02교육_03교육진 소개 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=42:12277) | ❌ |
| 이미지 갤러리 | Image Gallery Container | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=42:12964) | ❌ |

---

## 02. 교육

피그마 섹션 node-id: `10:6595`

| 화면 | 피그마 이름 | 피그마 링크 | 구현 |
|------|-----------|------------|------|
| 등급제 교육관리시스템 (Desktop) | BNB_02교육_01등급제교육관리시스템 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1799) | ❌ |
| 등급제 교육관리시스템 (Mobile) | BNB_02교육_01등급제교육관리시스템 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:2143) | ❌ |
| 교육진 소개 목록 | bnb_아트센터_02교육_03교육진 소개 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:120) | ❌ |
| 교육진 소개 상세 | bnb_아트센터_02교육_03교육진 소개_상세 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:245) | ❌ |
| 커리큘럼 (Desktop) | 04커리큘럼_1 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:2492) | ✅ `/art/curriculum`, `/highteen/curriculum`, `/kids/curriculum` |
| 강의 검색 결과 | 배우앤배움_강의검색결과 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:2652) | ❌ |

---

## 03. 캐스팅

피그마 섹션 node-id: `10:6744`

| 화면 | 피그마 이름 | 피그마 링크 | 구현 |
|------|-----------|------------|------|
| 이달의 드라마 목록 | bnb_아트센터_03캐스팅_01이달의드라마 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:649) | ✅ `/{center}/screen-appearances` |
| 이달의 드라마 상세 | bnb_아트센터_03캐스팅_01이달의드라마_상세 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:389) | ❌ |
| 캐스팅 출연현황 (Desktop) | bnb_아트센터_03캐스팅_02캐스팅출연현황 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:972) | ❌ |
| 캐스팅 출연현황 (Mobile) | bnb_아트센터_03캐스팅_02캐스팅출연현황 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=21:3647) | ❌ |
| 드라마 캐스팅 01 | bnb_아트센터_03캐스팅_03드라마캐스팅_01 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1341) | ❌ |
| 드라마 캐스팅 02 | bnb_아트센터_03캐스팅_03드라마캐스팅_02 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1411) | ❌ |
| 배우 케어 시스템 (Desktop) | 04캐스팅시스템_1 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=457:10765) | ✅ `/{center}/casting-system` |
| 프로필 제작 절차 안내 (Desktop) | 04캐스팅시스템_2프로필 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=457:11652) | ✅ `/{center}/profile-production` |
| 오디션 지원 | bnb_아트센터_03캐스팅_05오디션지원 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=20:4974) | ✅ `/audition` |

---

## 04. 매니지먼트

피그마 섹션 node-id: `10:10109`

| 화면 | 피그마 이름 | 피그마 링크 | 구현 |
|------|-----------|------------|------|
| BNB 루키 목록 | bnb_아트센터_04매니지먼트_05BNB루키 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1537) | ❌ |
| BNB 루키 상세 | bnb_아트센터_04매니지먼트_05BNB루키_상세 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:349) | ❌ |

---

## 05. 운영

피그마 섹션 node-id: `10:12027`

| 화면 | 피그마 이름 | 피그마 링크 | 구현 |
|------|-----------|------------|------|
| 뉴스 목록 | bnb_아트센터_05운영_01news | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=10:13109) | ✅ `/news` |
| 뉴스 상세 | bnb_아트센터_05운영_01news_상세 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=10:13198) | ✅ `/news/[slug]` |

---

## 06. 상담센터

피그마 섹션 node-id: `38:5133`

> 디자인 작업 미완성

---

## 구현 현황 요약

| 구현됨 | 미구현 |
|--------|--------|
| `/audition` — 오디션 지원<br />`/{center}/screen-appearances` — BNB 출연장면<br />`/{center}/casting-system` — 배우 케어 시스템<br />`/{center}/profile-production` — 프로필 제작 절차 안내 | 기업소개 전체 |
| `/news` — 뉴스 목록 | 교육 전체 |
| `/news/[slug]` — 뉴스 상세 | 캐스팅 (오디션 제외) |
| `/artist-press` — 아티스트 보도자료 | 매니지먼트 전체 |
| | 상담센터 (디자인 미완성) |

> **참고**: 아티스트 보도자료(`/artist-press`)는 피그마에 별도 화면이 없으며, 코드에만 존재함.
