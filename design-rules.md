# BNB 리뉴얼 — 코딩 디자인 룰

피그마 파일 분석 기반. 모든 수치는 피그마 변수/컴포넌트에서 직접 추출.

---

## 0. 핵심 원칙

- **에이전트는 이 문서를 신뢰 기준(source of truth)으로 삼는다.**
- 의심스러울 때는 "적게 만들기": 새 토큰·클래스·파일을 만들기 전에 기존 것으로 해결 가능한지 먼저 확인.
- 공개 프론트엔드는 **라이트 모드 고정**이다. `[data-theme='dark']` 는 Payload Admin 전용이며, 프론트 컴포넌트에서는 다크 variant를 추가하지 않는다.

---

## 1. 폰트

### 주요 폰트
| 용도 | 패밀리 | 비고 |
|------|--------|------|
| 본문/UI 전체 | **Pretendard** | 한국어 + 영문 통합 |
| 아이콘 | **Font Awesome 7 Pro** | Solid 스타일 기준 |

> **현재 코드 교체 필요**: `layout.tsx`의 `GeistSans` → `Pretendard`로 변경 (설치 전까지 임시 유지)

### Pretendard 설치
```bash
npm install pretendard
```
또는 CDN:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
```

### 타이포그래피 스케일 (피그마 GNB/버튼 기준)

| 역할 | Size | Weight | Line Height |
|------|------|--------|-------------|
| GNB 메뉴 | 16px | 900 (Black) | 135% |
| 버튼 텍스트 | 14px | 700 (Bold) | 135% |

> 전체 타입 스케일은 피그마 화면별 텍스트 노드 확인 후 보완 후 작업 시작.

---

## 2. 색상

### 토큰 체계 원칙

- **단일 소스**: 기존 shadcn oklch 토큰(`--foreground`, `--primary`, `--destructive`, `--border` 등)이 기준이다. 신규로는 **`--brand` 계열만** `@theme`에 추가한다.
- shadcn 토큰과 중복되는 시맨틱 토큰(예: `text-default`, `bg-subtle`)을 별도로 만들지 말 것. 아래 매핑 참고:

  | 용도 | 사용할 클래스 |
  |------|--------------|
  | 기본 본문 텍스트 | `text-foreground` |
  | 보조 텍스트 | `text-muted-foreground` |
  | 기본 배경 | `bg-background` |
  | 카드/인풋 배경 | `bg-muted` |
  | 기본 구분선 | `border-border` |

- 디폴트를 tw으로 두고 커스텀을 진행한다. 클래스는 겹치지 않도록 적절히 변경.

### 센터 브랜드 컬러 ⚠️ HEX 임시값 — 피그마 확정 후 교체 필요

각 센터는 고유 브랜드 컬러를 가진다. 마크업에선 `data-center` 속성으로 활성화하고, 클래스는 항상 `text-brand` / `bg-brand` / `border-brand`만 사용한다. 센터별 클래스 직접 지정 금지.

| 센터 | 토큰 | Hex | 비고 |
|------|------|-----|------|
| 아트 | `brand-art` | `#C80000` | 확정 |
| 입시 | `brand-exam` | `#1E5FCC` | ⚠️ 임시 |
| 하이틴 | `brand-highteen` | `#E0529B` | ⚠️ 임시 |
| 키즈 | `brand-kids` | `#F5A623` | ⚠️ 임시 |
| 애브뉴 | `brand-avenue` | `#2BB673` | ⚠️ 임시 |

**적용 방식 — CSS**:
```css
/* globals.css @theme에 등록 */
@theme {
  --color-brand: var(--brand);
  --color-brand-art: #C80000;
  --color-brand-exam: #1E5FCC;
  --color-brand-highteen: #E0529B;
  --color-brand-kids: #F5A623;
  --color-brand-avenue: #2BB673;
}

/* data-center에 따라 --brand 변수 스위치 */
[data-center='art']      { --brand: var(--color-brand-art); }
[data-center='exam'] { --brand: var(--color-brand-exam); }
[data-center='highteen'] { --brand: var(--color-brand-highteen); }
[data-center='kids']     { --brand: var(--color-brand-kids); }
[data-center='avenue']   { --brand: var(--color-brand-avenue); }
```

**적용 방식 — 마크업**:
```tsx
<main>
  <section className="section-hero" data-center="art">
    <div className="container">
      <h1 className="text-brand">아트센터</h1>
      <button className="bg-brand text-white">문의하기</button>
    </div>
  </section>
</main>
```

### 기본 팔레트 (Neutral)
| 토큰 | Hex |
|------|-----|
| `white` | `#FFFFFF` |
| `black` | `#000000` |
| `neutral-50` | `#FAFAFA` |
| `neutral-100` | `#F5F5F5` |
| `neutral-200` | `#EEEEEE` |
| `neutral-300` | `#D9D9D9` |
| `neutral-400` | `#AAAAAA` |
| `neutral-500` | `#999999` |
| `neutral-600` | `#737373` |
| `neutral-700` | `#4D4D4D` |
| `neutral-800` | `#333333` |
| `neutral-900` | `#222222` |
| `neutral-950` | `#111111` |

### 시맨틱 색상 (참고용 — 실제 클래스는 shadcn 토큰 사용)

#### 배경
| HEX | 용도 | shadcn 클래스 |
|-----|------|---------------|
| `#FFFFFF` | 기본 페이지 배경 | `bg-background` |
| `#FAFAFA` | 섹션 구분 배경 | `bg-secondary` |
| `#F5F5F5` | 카드/인풋 배경 | `bg-muted` |
| `#0C0C0C` | Footer, 다크 섹션 | `bg-[#0C0C0C]` (예외 — 직접 지정) |

#### 텍스트
| HEX | 용도 | shadcn 클래스 |
|-----|------|---------------|
| `#222222` | 기본 본문 | `text-foreground` |
| `#4D4D4D` | 보조 텍스트 | `text-muted-foreground` |
| `#999999` | 플레이스홀더, 비활성 | `text-muted-foreground` |
| `#FFFFFF` | 어두운 배경 위 | `text-white` |

#### 테두리
| HEX | 용도 | shadcn 클래스 |
|-----|------|---------------|
| `#EEEEEE` | 기본 구분선 | `border-border` |
| `#3B82F6` | 포커스 링 | `ring` (shadcn 자동) |

#### 상태 색상
| 상태 | Background | Text | Border |
|------|-----------|------|--------|
| Primary | `#3B82F6` | `#FFFFFF` | `#3B82F6` |
| Success | `#259F46` | `#FFFFFF` | `#86EFAC` |
| Warning | `#F59E0B` | `#222222` | `#FFAE1B` |
| Destructive | `#E03131` → hover: `#C80000` | `#FFFFFF` | `#F87171` |
| Info | `#3B82F6` | `#FFFFFF` | `#60A5FA` |

---

## 3. Border Radius

실제 코드는 `--radius: 0.625rem` 기반 파생 체계를 사용한다.

| 토큰 | 값 | Tailwind 클래스 |
|------|----|----|
| `--radius-sm` | `calc(var(--radius) - 4px)` ≈ 2px | `rounded-sm` |
| `--radius-md` | `calc(var(--radius) - 2px)` ≈ 4px | `rounded-md` |
| `--radius-lg` | `var(--radius)` = 10px | `rounded-lg` |
| `--radius-xl` | `calc(var(--radius) + 4px)` ≈ 14px | `rounded-xl` |
| `full` | 9999px | `rounded-full` |

피그마에서 다른 값이 필요하면 `@theme`에 `--radius-*` 변수로 추가하고 shadcn 체계와 충돌하지 않게 네이밍.

---

## 4. Spacing (4px 그리드)
테일윈드로 설정하되 없는 크기는 별도로 지정(ex.160px)
피그마 `Spacing` 컬렉션 기준:

| 토큰 | 값 |
|------|----|
| `space-0` | `0px` |
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-5` | `20px` |
| `space-6` | `24px` |
| `space-7` | `28px` |
| `space-8` | `32px` |
| `space-9` | `36px` |
| `space-10` | `40px` |
| `space-11` | `44px` |
| `space-12` | `48px` |
| `space-14` | `56px` |
| `space-16` | `64px` |
| `space-20` | `80px` |
| `space-24` | `96px` |
| `space-30` | `120px` |
| `space-40` | `160px` |

---

## 5. 레이아웃 / 컨테이너

### 커스텀 스타일 작성 위치

| 범위 | 파일 | 방식 |
|------|------|------|
| 전역 토큰, container 정의, 공용 유틸 | `src/app/(frontend)/globals.css` `@layer` | CSS `clamp()` |
| 섹션 고유 패딩·폰트 크기 등 | 섹션 컴포넌트 옆 colocated `index.scss` | SCSS 중첩 + CSS `clamp()` |

- SCSS mixin 대신 **네이티브 CSS `clamp()`** 우선 사용. SCSS는 중첩/모듈 목적으로만 쓴다.
- SCSS 파이프라인이 현재 미설치 상태. 섹션 스타일 파일 작성 전에 `npm install sass` 실행 필요.

### 반응형 폰트 크기 — clamp() 사용 규칙

섹션별 커스텀 font-size는 CSS `clamp()`로 작성하고, `--fs-{name}` 형식의 CSS 변수 또는 섹션 scss 내 지역 클래스(`.section-hero__title`)를 사용한다. 임의 클래스명 생성 금지.

```scss
// SectionHero/index.scss
.section-hero {
  &__title {
    font-size: clamp(2rem, 5vw, 4rem);
  }
  &__subtitle {
    font-size: clamp(1rem, 2vw, 1.5rem);
  }
}
```

### class 스타일링 기준
- 반응형, 칼럼, display 등은 tw을 사용하여 직관적으로 작성한다.
- 예외 요소(font-size, 각 section의 padding, margin)는 섹션 scss 또는 globals.css `@layer`에서 `clamp()`로 관리한다.
- **각 섹션에는 `section-{name}` (kebab-case) classname이 필수**이며, 섹션 scss 파일로 컨트롤한다.
- 페이지 루트에는 화면 타입을 구분하는 클래스가 필요하다. CMS 상세는 `page-detail`, Payload `pages` 기반 일반 정적 페이지는 `page-static`을 사용한다.

### 페이지 타입 클래스

| 클래스 | 적용 대상 | 역할 |
|--------|-----------|------|
| `page-detail` | `/news/[slug]`, `/artist-press/[slug]`, 프로필 상세처럼 개별 콘텐츠를 보여주는 상세 페이지 | 관리자 바와 고정 GNB 높이를 반영해 본문 시작 위치를 보정한다. |
| `page-static` | `/`, `/{center}`, 기타 Payload `pages` 기반 정적 페이지 | 정적/섹션형 화면임을 표시한다. 기본 상단 padding은 강제하지 않는다. |
| `page-static--center` | 센터 랜딩 정적 페이지 | 센터 전용 메인 배너/소셜 섹션을 포함하는 정적 페이지를 구분한다. |

`page-detail`의 상단 여백은 Tailwind `pt-*` 값에 의존하지 않고 아래 전역 변수로 관리한다.

```css
:root {
  --admin-bar-height: 0px;
  --site-header-height: 84px;
  --page-top-offset: calc(
    var(--admin-bar-height, 0px) +
    var(--site-header-measured-height, var(--site-header-height, 84px))
  );
  --page-detail-padding-top: var(--page-top-offset);
}

@media (max-width: 640px) {
  :root {
    --site-header-height: 68px;
  }
}

.page-detail {
  padding-top: var(--page-detail-padding-top);
}
```

- `--admin-bar-height`는 로그인한 관리자 바가 보일 때 실측값으로 갱신한다.
- `--site-header-measured-height`는 렌더된 GNB 높이를 실측한 값이며, 없을 때는 `--site-header-height`를 fallback으로 사용한다.
- 상세 페이지에서 `pt-20`, `pt-24` 같은 고정 상단 padding을 추가하더라도 최종 상단 padding은 `.page-detail` 규칙이 담당한다.
- `page-static`에는 이 offset을 자동 적용하지 않는다. 정적 페이지 hero는 대개 GNB 오버레이를 전제로 하므로 화면별 섹션에서 직접 여백을 제어한다.

### 마크업 구조 패턴

```tsx
// 상세 페이지: page-detail이 관리자 바 + GNB offset을 담당
<article className="page-detail pb-24">
  <header className="container">
    {/* 상세 제목 */}
  </header>
</article>

// 정적 페이지: page-static은 타입 표식이고, 섹션별 여백은 section scss에서 제어
<main className="page-static">
  <section className="section-hero" data-center="art">
    <div className="container">
      {/* 콘텐츠 */}
    </div>
  </section>
  <section className="section-about">
    <div className="container-sm">
      {/* 좁은 컨테이너가 필요한 경우 */}
    </div>
  </section>
</main>
```

### Container 정의 (globals.css에 구현)

아래가 프로젝트 container 기준이다. `globals.css`의 기존 breakpoint 기반 `.container`를 이 정의로 **교체**한다. `container-fluid`·`container-sm`은 신규 추가.

| 클래스 | max-width | 용도 |
|--------|-----------|------|
| `container-fluid` | 100% | 전체 너비 섹션 |
| `container` | 1120px | 기본 콘텐츠 영역 |
| `container-sm` | 800px | 좁은 콘텐츠(텍스트 중심) |

모든 container 공통: `margin-inline: auto; padding-inline: 20px`

```css
/* globals.css @layer utilities */
@layer utilities {
  .container-fluid {
    width: 100%;
    padding-inline: 20px;
  }
  .container {
    width: 100%;
    max-width: 1120px;
    margin-inline: auto;
    padding-inline: 20px;
  }
  .container-sm {
    width: 100%;
    max-width: 800px;
    margin-inline: auto;
    padding-inline: 20px;
  }
}
```

### GNB

> ⚠️ 아래 수치는 **디자인 아트보드(1920px) 기준 참조값**이다. 실제 구현은 반응형/clamp() 적용. `padding: 400px` 등 고정값 하드코딩 금지.

- 전체 너비: 1920px (full-width)
- 좌우 패딩: `40px`
- 높이: `84px`
- 내부 영역: 1840px
- 배경: 투명 (페이지 최상단, 이미지 위에 오버레이)
- 텍스트 색상: `#FFFFFF`
- 메뉴 아이템 간격: `80px`

### GNB Hover / Mega Nav

피그마 기준 노드: `38:9927`

- 어떤 1depth 메뉴를 hover/focus해도 전체 1depth/2depth 구조가 한 번에 보이는 메가 메뉴를 사용한다.
- 데스크톱 메가 메뉴는 GNB와 같은 검정 배경(`#0C0C0C`)을 쓰고, GNB 아래에 이어지는 패널로 렌더링한다.
- 메가 메뉴 데이터는 `src/Header/Nav/menu.ts`에서만 관리한다. 데스크톱 hover 메뉴와 모바일 fullscreen 메뉴는 같은 데이터 구조를 재사용한다.
- 현재 센터는 URL 첫 segment로 판단한다. 예: `/exam/news`는 입시센터 메뉴, `/kids/profiles/{slug}`는 키즈센터 메뉴, 센터 segment가 없으면 아트센터 메뉴를 fallback으로 쓴다.
- 센터별로 없는 메뉴는 렌더링하지 않는다. 입시센터처럼 성격이 다른 센터는 1depth label도 `합격현황`, `합격자 소개`처럼 센터 문맥에 맞게 바꾼다.
- 아직 공개 라우트가 없는 세부 메뉴는 깨진 경로를 만들지 않고 `/{center}#anchor` 형태로 연결한다. 실제 라우트가 생기면 menu 데이터의 `href`만 교체한다.
- 모바일에서는 별도 메뉴 데이터를 만들지 않는다. 햄버거 버튼으로 같은 메가 메뉴 구조를 fullscreen 패널에 표시한다.

### Footer

> ⚠️ 아래 수치는 **디자인 아트보드(1920px) 기준 참조값**이다. 실제 구현은 반응형/clamp() 적용.

- 전체 너비: 1920px (full-width)
- 좌우 패딩: `400px` (각각) → 실제로는 `container` 내부 정렬로 구현
- **내용 영역 너비: 1120px**
- 상하 패딩: `80px`
- 아이템 간격: `40px`
- 배경: `#0C0C0C`

### 메인 컨텐츠 컨테이너
- 모든 메인 컨텐츠는 중앙정렬이며 padding-inline: 20px 설정.
- container-fluid, container, container-sm로 구성.
- main > section > container*로 구성하며 필요에 따라 적절한 container 선택. section에는 다수의 container가 있을 수 있음.

---

## 6. Tailwind / globals.css 설정 업데이트 가이드

`globals.css`의 `@theme` 섹션에 반영해야 할 값들. shadcn 토큰과 중복되는 시맨틱 토큰은 추가하지 않는다.

```css
@theme {
  /* 폰트 (Pretendard 설치 후 활성화) */
  /* --font-sans: 'Pretendard', sans-serif; */

  /* 센터 브랜드 컬러 */
  --color-brand: var(--brand); /* data-center 스위치용 */
  --color-brand-art: #C80000;
  --color-brand-exam: #1E5FCC; /* ⚠️ 임시 */
  --color-brand-highteen: #E0529B;  /* ⚠️ 임시 */
  --color-brand-kids: #F5A623;      /* ⚠️ 임시 */
  --color-brand-avenue: #2BB673;    /* ⚠️ 임시 */

  /* Footer 배경 (shadcn 토큰에 없는 값만 추가) */
  --color-bg-footer: #0C0C0C;

  /* 컨테이너 (참고용) */
  --container-main: 1120px;
  --container-sm: 800px;
}
```

---

## 7. GNB 구조 참고

```
[로고 (116×36)]          [메뉴: 배우앤배움 | 교육 | 캐스팅 | 매니지먼트 | 지원센터]          [온라인상담신청] [Family Site ▾]
```

- 로고: 좌측 40px padding 후 배치
- 메뉴: 절대 위치로 수평 중앙 배치, 아이템 간격 80px
- 우측 버튼 영역: `온라인상담신청` (테두리 버튼) + `Family Site` (배경 채움 버튼 + 드롭다운)

---

## 미확인 항목 (추후 보완 필요)

- [ ] 전체 타이포그래피 스케일 (h1~h6, body, caption 등)
- [ ] 모바일 레이아웃 (GNB, 컨테이너 패딩 변화)
- [ ] 기업소개 섹션 내용 확인 (현재 이름이 교육 화면과 혼용되어 있음)
- [ ] 상담센터 섹션 디자인 (피그마 미완성)
- [ ] **센터 브랜드 컬러 5종 실제 HEX 확정** (현재 임시값 — 피그마에서 추출 후 `@theme` 교체)
- [ ] **Pretendard / Font Awesome 7 Pro 실제 설치** (현재 GeistSans 임시 사용)
