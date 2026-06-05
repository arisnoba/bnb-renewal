# BNB 리뉴얼 디자인 가이드

## 피그마 파일

- **파일명**: BNB Renewal sRgb (26.04.01~)
- **파일 링크**: https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-
- **작업 페이지**: 리뉴얼 디자인 작업

---

## 사이트 구조 (GNB 메뉴)

| 순번 | 섹션 | 서브메뉴 | 피그마 섹션 |
|------|------|---------|------------|
| 01 | 기업소개 | - | 기업소개 |
| 02 | 교육 | 등급제 교육관리시스템, 교육진 소개 | 교육 |
| 03 | 캐스팅 | 이달의 드라마, 캐스팅 출연현황, 드라마 캐스팅, 오디션 지원 | 캐스팅 |
| 04 | 매니지먼트 | BNB 루키 | 매니지먼트 |
| 05 | 운영 | 뉴스 | 운영 |
| 06 | 상담센터 | - | 상담센터 (미완성) |

---

## 공통 컴포넌트

피그마 Section 1에 위치 (node-id: 1:1607)

| 컴포넌트 | 설명 | 피그마 링크 |
|---------|------|------------|
| GNB | 글로벌 네비게이션 바 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1608) |
| GNB Hover | 전체 메뉴 구조를 보여주는 메가 메뉴 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=38:9927) |
| Footer | 푸터 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1662) |

---

## 페이지 타입 클래스

페이지 루트는 화면 성격을 구분할 수 있는 타입 클래스를 가진다. 타입 클래스는 디자인/레이아웃 규칙의 적용 범위를 제한하기 위한 기준이며, 섹션 클래스(`section-{name}`)와 함께 사용한다.

| 클래스 | 대상 | 현재 적용 예 |
|--------|------|--------------|
| `page-detail` | CMS 데이터 기반 상세 페이지. 고정 GNB와 관리자 바 아래에서 본문이 시작되어야 하는 화면 | `/news/[slug]`, `/artist-press/[slug]`, `/profiles/[slug]`, `/{center}/profiles/{profileSlug}` |
| `page-static` | Payload `pages` 기반 일반 정적 페이지. 화면별 hero/section이 자체 상단 여백을 제어하는 화면 | `/`, `/{center}`, 기타 정적 페이지 slug |
| `page-static--center` | 센터 랜딩처럼 메인 배너/센터 전용 섹션을 포함하는 정적 페이지 보조 클래스 | `/{center}` |

`page-detail`은 로그인 여부에 따라 높이가 달라지는 관리자 바와 고정 헤더를 피해야 하므로, 전역 CSS 변수 기반 상단 padding을 사용한다. `page-static`은 기본적으로 padding을 강제하지 않는다.

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
| 강의 검색 결과 | 배우앤배움_강의검색결과 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:2652) | ❌ |

---

## 03. 캐스팅

피그마 섹션 node-id: `10:6744`

| 화면 | 피그마 이름 | 피그마 링크 | 구현 |
|------|-----------|------------|------|
| 이달의 드라마 목록 | bnb_아트센터_03캐스팅_01이달의드라마 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:649) | ❌ |
| 이달의 드라마 상세 | bnb_아트센터_03캐스팅_01이달의드라마_상세 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:389) | ❌ |
| 캐스팅 출연현황 (Desktop) | bnb_아트센터_03캐스팅_02캐스팅출연현황 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:972) | ❌ |
| 캐스팅 출연현황 (Mobile) | bnb_아트센터_03캐스팅_02캐스팅출연현황 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=21:3647) | ❌ |
| 드라마 캐스팅 01 | bnb_아트센터_03캐스팅_03드라마캐스팅_01 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1341) | ❌ |
| 드라마 캐스팅 02 | bnb_아트센터_03캐스팅_03드라마캐스팅_02 | [바로가기](https://www.figma.com/design/uJrO9GmJsQkqnKO6XLNoW6/BNB-Renewal-sRgb--26.04.01~-?node-id=1:1411) | ❌ |
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
| `/audition` — 오디션 지원 | 기업소개 전체 |
| `/news` — 뉴스 목록 | 교육 전체 |
| `/news/[slug]` — 뉴스 상세 | 캐스팅 (오디션 제외) |
| `/artist-press` — 아티스트 보도자료 | 매니지먼트 전체 |
| | 상담센터 (디자인 미완성) |

> **참고**: 아티스트 보도자료(`/artist-press`)는 피그마에 별도 화면이 없으며, 코드에만 존재함.
