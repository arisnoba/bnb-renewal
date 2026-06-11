# BNB 리뉴얼 — 코딩 디자인 룰

피그마 파일 분석 기반. 모든 수치는 피그마 변수/컴포넌트에서 직접 추출.

---

## 0. 핵심 원칙

- **에이전트는 이 문서를 신뢰 기준(source of truth)으로 삼는다.**
- 의심스러울 때는 "적게 만들기": 새 토큰·클래스·파일을 만들기 전에 기존 것으로 해결 가능한지 먼저 확인.
- 공개 프론트엔드는 **라이트 모드 고정**이다. `[data-theme='dark']` 는 Payload Admin 전용이며, 프론트 컴포넌트에서는 다크 variant를 추가하지 않는다.
- 공개 프론트엔드 구현은 **Tailwind 우선**이다. 레이아웃, 반응형, 고정 padding/margin, grid/flex, border, 색상, 폰트 크기 등 대부분의 시각 스타일은 `className`에 Tailwind 유틸리티로 작성한다.
- 의미 클래스(`section-faq-list`, `section-faq-item__summary` 등)는 Tailwind를 대체하기 위한 스타일 파일 기준이 아니라, 후속 커스텀과 QA를 쉽게 하기 위한 **중요 요소 식별자/확장 hook**이다.

---

## 1. 폰트

### 주요 폰트
| 용도 | 패밀리 | 비고 |
|------|--------|------|
| 본문/UI 전체 | **Pretendard** | 한국어 + 영문 통합 |
| 아이콘 | **Font Awesome 7 Pro** | Solid 스타일 기준 |

> **현재 코드 상태**: `globals.css`에서 Pretendard 우선 fallback 스택 사용. Pretendard 패키지/CDN은 아직 미설치.

### 줄바꿈 기준

- 공개 프론트엔드는 한국어 웹사이트 기준으로 전역 `word-break: keep-all`을 적용한다.
- 전역 `overflow-wrap: break-word`는 한국어 단어 중간 줄바꿈을 다시 허용할 수 있으므로 함께 두지 않는다.
- 긴 URL, 영문 토큰, 숫자 조합 때문에 레이아웃이 터질 수 있는 요소에만 `break-words`, `break-all`, `[overflow-wrap:anywhere]`를 제한적으로 사용한다.

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

### 타입 스케일 토큰 (`type-{role}-{size}`)

공통 텍스트 크기의 단일 정의처는 `src/styles/_type-scale.scss`다. 피그마 "Text-size styles"(role × size)를 클래스로 매핑했고, 크기 변경은 마크업이 아니라 이 파일의 `$type-scale` 맵에서만 한다.

- 클래스: `type-display-{xl,l,m,s}`, `type-headline-{xl,l,m,s}`, `type-title-{l,m,s}`, `type-body-{l,m,s}`, `type-label-{l,m,s}`, `type-caption-{m,s}`
- 토큰은 **font-size + 디폴트 line-height + 디폴트 font-weight**만 책임진다. 굵기/서체 세부 조정은 Tailwind로 조합한다. 예: 피그마 `headline---l--semi-bold` → `type-headline-l font-semibold`, `title---m--extra-bold` → `type-title-m font-extrabold`. 피그마의 weight/서체 변형 스타일을 별도 클래스로 만들지 않는다.
- display/headline은 fluid(clamp), title 이하(body/label/caption)는 고정 크기다. 피그마 값은 데스크톱(max) 기준이며, **모바일 min 값은 임의 초안 상태** — 모바일 시안 확정 시 맵에서 교체.
- `@layer components`에 선언되어 있어 Tailwind 유틸리티(`font-bold`, `text-sm` 등)가 토큰 디폴트를 항상 덮을 수 있다.
- 새 텍스트 크기가 필요하면 임의 `text-[Npx]`를 만들기 전에 기존 슬롯 재사용을 먼저 검토하고, 같은 값이 반복되면 슬롯을 추가한다.

> 피그마 caption 그룹은 위계 역전이 있어(`caption---l--medium` 0.75rem < `caption---m` 0.81rem) 코드에서는 m(13px) > s(12px)로 정리함 — 디자이너 확인 필요.

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

### 페이지 데코 요소

페이지 전반의 배경 장식은 직접 `div`, 인라인 SVG, `border-brand` 도형을 새로 만들지 않고 `PageDeco`를 사용한다.

- 공통 컴포넌트: `src/components/PageDeco`
- 공통 클래스: `.page-deco`
- 에셋 위치: `public/assets/common/deco/icon-*.svg`
- 색상 제어: SVG 내부 `fill`을 수정하지 않고 CSS mask + `currentColor`로 제어한다.
- 브랜드 색상: 페이지 또는 섹션 상위에 `data-center`를 두고, 데코는 `text-brand`/`--brand` 흐름을 따른다.
- 접근성: 장식 목적이므로 `aria-hidden="true"` 상태를 유지한다.

페이지에 여러 데코를 배치할 때는 같은 페이지 안에서 아이콘이 겹치지 않게 `getPageDecoIcons(count, seed)`로 페이지 단위 아이콘 순서를 만든다. 각 데코가 독립적으로 `random`을 고르면 같은 페이지 안에서 중복될 수 있으므로 새 페이지에서는 페이지 단위 seed를 우선 사용한다.

```tsx
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'

const decoIcons = getPageDecoIcons(2, `map-hero-${center}`)

<section className="relative overflow-hidden" data-center={center}>
  <PageDeco
    className="-left-16 top-[15%] h-56 w-56 md:h-90 md:w-90"
    icon={decoIcons[0]}
  />
  <PageDeco
    className="-right-20 bottom-[8%] h-56 w-56 md:h-90 md:w-90"
    icon={decoIcons[1]}
  />
</section>
```

나중에 패럴렉스나 스크롤 인터랙션을 붙일 수 있도록 `PageDeco`의 `className`, `data-deco-icon`, `data-parallax`를 확장 hook으로 사용한다. 아이콘 방향이 의미를 가지는 경우 `rotate-180` 같은 회전 유틸리티를 이전 장식에서 그대로 가져오지 말고, 실제 아이콘 방향을 확인한 뒤 필요한 경우에만 적용한다.

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

### Tailwind 우선 구현 기준

`/{center}/grade-system` 구현 방식을 기준으로 삼는다. 대부분의 구조와 시각값은 Tailwind className에서 바로 확인 가능해야 한다.

Tailwind로 작성해야 하는 것:

- 반응형 레이아웃: `flex`, `grid`, `md:grid-cols-*`, `lg:*`, `overflow-*`
- 고정 spacing: `gap-5`, `mt-12`, `px-5`
- 섹션 상하 여백: `section-p-block-base`, `section-p-t-sm`, `section-p-b-lg` 같은 공용 section padding 유틸
- 컨테이너 조합: `container`, `container-sm`, `container-fluid`
- 일반 색상/테두리/배경: `bg-background`, `text-foreground`, `border-border`, `bg-brand`, `text-brand`
- 일반 타이포그래피: `text-base`, `text-[48px]`, `font-bold`, `leading-[1.35]`
- 일반 상태 스타일: `hover:*`, `focus-visible:*`, `data-[active=true]:*` 등 Tailwind로 표현 가능한 상태

의미 클래스는 함께 붙인다. 예를 들어 FAQ 페이지는 다음처럼 작성한다.

```tsx
<main className="page page-light page-faq page-top-offset" data-center={center}>
  <section className="section-faq-list section-p-block-base">
    <div className="container-sm">
      <form className="section-faq-list__search flex h-[45px] overflow-hidden rounded-full border border-foreground/40">
        <input className="section-faq-list__search-input min-w-0 flex-1 px-5 text-lg font-bold" />
        <button className="section-faq-list__search-button grid size-[45px] place-items-center rounded-full bg-foreground text-background">
          <Search aria-hidden="true" size={18} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  </section>
</main>
```

이때 `section-faq-list__search` 같은 클래스는 나중에 해당 요소를 찾거나, Tailwind로 처리하기 어려운 최소 예외를 붙이기 위한 이름이다. 이 클래스만으로 padding, gap, display, responsive width를 전부 CSS 파일에 몰아넣지 않는다.

### 아이콘 사용 기준

- 버튼/링크 안의 방향, 닫기, 검색, 다운로드 같은 UI 기호는 텍스트 문자로 직접 쓰지 않는다. 예: `>`, `→`, `×`, `검색`용 문자 기호 금지.
- UI용 아이콘은 프로젝트의 기본 아이콘 컴포넌트인 `lucide-react`를 우선 사용한다.
- 가능한 경우 `lucide-react` 아이콘을 사용한다. 예: `ChevronRight`, `X`, `Search`, `Download`.
- 아이콘은 `aria-hidden="true"`를 붙이고, 버튼/링크의 접근 가능한 이름은 실제 텍스트나 `aria-label`로 제공한다.
- 텍스트와 함께 쓰는 아이콘은 Tailwind로 크기와 간격을 명확히 둔다. 예: `<ChevronRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2.2} />`.
- 아이콘을 만들기 위해 별도 SVG를 직접 작성하거나 CSS pseudo-element를 쓰는 것은 기존 아이콘 라이브러리에 적절한 아이콘이 없을 때만 허용한다.

### 커스텀 스타일 작성 위치

| 범위 | 파일 | 방식 |
|------|------|------|
| 전역 토큰, container 정의, 공용 유틸 | `src/app/(frontend)/globals.css` `@layer` | CSS 변수 또는 최소 유틸 |
| 화면/섹션 고유 예외 스타일 | 섹션 컴포넌트 옆 colocated `*.css`/`*.scss` | Tailwind로 어려운 selector와 pseudo-element만 최소 작성 |

- 새 스타일 파일은 기본 선택지가 아니다. 먼저 Tailwind로 해결하고, 아래 예외에 해당할 때만 추가한다.
- SCSS mixin 대신 네이티브 CSS를 우선 사용한다. SCSS는 이미 프로젝트에 쓰는 파일이 있거나 중첩이 꼭 필요할 때만 쓴다.
- Tailwind arbitrary value(`text-[48px]`, `leading-[1.35]`)는 피그마의 고정값을 반영할 때 허용한다.
- `main > section > .container*` 구조의 대표 섹션 상하 여백은 `section-p-{t,b,block}-{xs,sm,base,lg}` 유틸을 우선 사용한다. 기준 최대값은 `xs: 80px`, `sm: 100px`, `base: 120px`, `lg: 160px`이며, `src/styles/_section-spacing.scss`에서 `fluid-space`로 관리한다.
- 별도 CSS/SCSS를 추가하더라도 레이아웃과 spacing은 가능한 한 Tailwind className에 남겨 둔다.

### 별도 CSS/SCSS 허용 범위

다음 경우에만 의미 클래스를 selector로 사용해 별도 CSS/SCSS를 작성한다.

- `details[open]`, `summary::-webkit-details-marker`처럼 HTML 상태나 브라우저 기본 UI 제어가 필요한 경우
- `::before`, `::after`로 만드는 아이콘/장식처럼 Tailwind className으로 직접 표현하기 어려운 경우
- Markdown/리치텍스트 출력처럼 내부 마크업을 직접 제어하기 어려운 콘텐츠 스타일
- 전역 container, header offset, admin bar offset처럼 여러 화면이 공유하는 기반 규칙
- Tailwind className이 지나치게 길어지고 같은 복잡 selector가 반복되는 경우

반대로 다음은 별도 CSS/SCSS로 옮기지 않는다.

- `display`, `flex/grid`, `gap`, `padding`, `margin`, `width`, `height` 같은 일반 레이아웃
- `md:*`, `lg:*` 같은 일반 반응형 분기
- `text-*`, `font-*`, `leading-*`, `bg-*`, `border-*`로 표현 가능한 기본 시각값

### 반응형 폰트 크기 기준

피그마 고정값이 있는 일반 텍스트는 Tailwind arbitrary value를 우선 사용한다. 예: `text-[34px] md:text-[48px] leading-[1.25]`.

유동형 크기가 실제로 필요한 hero title, 특수 padding 등은 `src/styles/_mixins.scss`의 `fluid-type`, `fluid-space`, `fluid-size`를 사용한다. 이때도 섹션 의미 클래스는 확장 hook으로 두고, 일반 레이아웃은 Tailwind에 남긴다.

```scss
@use '@/styles/mixins' as *;

// Tailwind로 표현하기 어려운 유동형 타입 예외
.section-hero {
  &__title {
    @include fluid-type(32px, 64px);
  }

  &__subtitle {
    @include fluid-type(16px, 24px);
  }

  &__media {
    @include fluid-space(padding-block, 48px, 96px);
  }
}
```

### class 스타일링 기준
- 반응형, 칼럼, display, spacing, 고정 padding/margin은 Tailwind를 사용하여 직관적으로 작성한다.
- 예외 요소는 CSS/SCSS 또는 globals.css `@layer`에서 최소 관리한다.
- **각 주요 섹션에는 `section-{name}` (kebab-case) classname을 함께 붙인다.** 이는 커스텀/QA용 hook이며, 섹션의 모든 기본 스타일을 CSS 파일로 컨트롤하라는 뜻이 아니다.
- 주요 내부 요소에는 필요에 따라 `section-{name}__element` 형식의 클래스명을 함께 붙인다. 예: `section-faq-list__search`, `section-faq-item__summary`.
- 페이지 루트에는 공통 루트, 표면 톤, 페이지 식별 클래스, 상단 offset 클래스를 분리해서 사용한다. 모든 공개 페이지 루트에는 `page`를 붙이고, 흰/검 표면 톤은 `page-light`/`page-dark`로 표시한다. 식별 클래스는 `page-landing`, `page-faq`, `page-starcard`, `page-detail`처럼 실제 화면/템플릿을 드러내고, 고정 GNB/관리자 바 아래에서 첫 콘텐츠가 시작되어야 하면 별도로 `page-top-offset`을 붙인다.

### 페이지 루트 클래스

| 클래스 | 적용 대상 | 역할 |
|--------|-----------|------|
| `page` | 모든 공개 페이지 루트 | 전체 페이지 공통 제어 훅이다. |
| `page-light` | 흰 배경/검정 텍스트 기반 페이지 | 밝은 표면 톤을 표시한다. |
| `page-dark` | 검정 배경/흰 텍스트 기반 페이지 | 어두운 표면 톤을 표시한다. |
| `page-landing` | `/`, `/{center}` 같은 랜딩/섹션 조립형 페이지 | 랜딩 화면임을 표시한다. |
| `page-landing--center` | 센터 랜딩 페이지 | 센터 전용 메인 배너/소셜 섹션을 포함하는 랜딩을 구분한다. |
| `page-faq` | `/{center}/faq` | FAQ 목록 화면임을 표시한다. |
| `page-starcard` | `/{center}/starcard` | 스타카드 제휴업체 화면임을 표시한다. |
| `page-detail` | `/news/[slug]`, `/artist-press/[slug]`, 프로필 상세처럼 개별 콘텐츠를 보여주는 상세 페이지 | 개별 콘텐츠 상세 화면임을 표시한다. |
| `page-top-offset` | hero 없이 바로 콘텐츠가 시작되는 페이지, 상세 페이지 | 관리자 바와 고정 GNB 높이를 반영해 본문 시작 위치를 보정한다. |

표면 톤과 상단 offset은 페이지 식별 클래스에 묶지 않는다. `오시는 길`, `등급제 교육관리시스템`처럼 hero 비주얼이 있는 화면은 `page-dark`를 쓰되 hero 섹션이 자체 여백을 담당하므로 `page-top-offset`을 붙이지 않는다. `자주하는 질문`, `스타카드`, 상세 페이지처럼 첫 콘텐츠가 바로 시작되는 화면은 `page-light page-top-offset`을 붙인다.

`page-top-offset`의 상단 여백은 Tailwind `pt-*` 값에 의존하지 않고 아래 전역 변수로 관리한다.

```css
:root {
  --admin-bar-height: 0px;
  --site-header-height: 84px;
  --page-top-offset: calc(
    var(--admin-bar-height, 0px) +
    var(--site-header-measured-height, var(--site-header-height, 84px))
  );
  --page-top-offset-padding: var(--page-top-offset);
}

@media (max-width: 640px) {
  :root {
    --site-header-height: 68px;
  }
}

.page {
  background: var(--background);
  color: var(--foreground);
}

.page-light {
  background: #fff;
  color: #111;
}

.page-dark {
  background: #111;
  color: #fff;
}

.page-top-offset {
  padding-top: var(--page-top-offset-padding);
}
```

- `--admin-bar-height`는 로그인한 관리자 바가 보일 때 실측값으로 갱신한다.
- `--site-header-measured-height`는 렌더된 GNB 높이를 실측한 값이며, 없을 때는 `--site-header-height`를 fallback으로 사용한다.
- 상단 offset이 필요한 페이지에는 `pt-20`, `pt-24` 같은 고정 상단 padding을 추가하지 않는다. 최종 상단 padding은 `.page-top-offset` 규칙이 담당한다.
- 페이지 식별 클래스에는 배경색이나 offset을 자동 적용하지 않는다. hero 없는 페이지에는 `page page-light page-faq page-top-offset`처럼 각 축을 같이 쓰고, hero가 있는 페이지는 화면별 섹션에서 직접 여백을 제어한다.

### 마크업 구조 패턴

```tsx
// 상세 페이지: page-detail은 페이지 식별, page-top-offset은 관리자 바 + GNB offset 담당
<article className="page page-light page-detail page-top-offset pb-24">
  <header className="container">
    {/* 상세 제목 */}
  </header>
</article>

// hero가 있는 정적 페이지: 대표 섹션 여백은 section padding 유틸을 사용
<main className="page page-dark page-landing">
  <section className="section-hero section-p-block-base" data-center="art">
    <div className="container">
      {/* 콘텐츠 */}
    </div>
  </section>
  <section className="section-about section-p-block-sm">
    <div className="container-sm">
      {/* 좁은 컨테이너가 필요한 경우 */}
    </div>
  </section>
</main>

// hero 없이 콘텐츠가 바로 시작되는 정적 페이지
<main className="page page-light page-faq page-top-offset">
  <section className="section-faq-list section-p-block-base">
    <div className="container">
      {/* 콘텐츠 */}
    </div>
  </section>
</main>
```

### Container 정의 (globals.css에 구현)

아래가 프로젝트 container 기준이다. `globals.css`의 기존 breakpoint 기반 `.container`를 이 정의로 **교체**한다. `container-fluid`·`container-sm`은 신규 추가.

| 클래스 | max-width | 용도 |
|--------|-----------|------|
| `container-fluid` | 100% | 전체 너비 섹션 |
| `container` |1160px | 기본 콘텐츠 영역 |
| `container-sm` | 840px | 좁은 콘텐츠(텍스트 중심) |

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
    max-width: 1160px;
    margin-inline: auto;
    padding-inline: 20px;
  }
  .container-sm {
    width: 100%;
    max-width: 840px;
    margin-inline: auto;
    padding-inline: 20px;
  }
}
```

### GNB

> ⚠️ 아래 수치는 **디자인 아트보드(1920px) 기준 참조값**이다. 실제 구현은 Tailwind 반응형 유틸리티를 우선 사용하고, 유동형 값이 꼭 필요할 때만 `clamp()`를 쓴다. `padding: 400px` 등 고정값 하드코딩 금지.

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
- 데스크톱 메가 메뉴 패널 안에서는 1depth 메뉴명을 다시 노출하지 않는다. 1depth는 상단 GNB 자체를 사용하고, 패널에는 각 1depth 아래의 2depth 목록만 같은 그리드 열에 맞춰 표시한다.
- 데스크톱 hover 구조는 `nav > 1depth item > submenu` 형태를 유지한다. hover 이전에는 item padding을 좁게 두고, hover/open 상태에서는 item padding을 넓혀 1depth 간격을 확장한다. 2depth는 별도 그리드에 다시 배치하지 않고 각 1depth item 중앙 아래에 absolute로 붙인다.
- 메가 메뉴 데이터는 `src/Header/Nav/menu.ts`에서만 관리한다. 데스크톱 hover 메뉴와 모바일 fullscreen 메뉴는 같은 데이터 구조를 재사용한다.
- 현재 센터는 URL 첫 segment로 판단한다. 예: `/exam/news`는 입시센터 메뉴, `/kids/profiles/{slug}`는 키즈센터 메뉴, 센터 segment가 없으면 아트센터 메뉴를 fallback으로 쓴다.
- 센터별로 없는 메뉴는 렌더링하지 않는다. 입시센터처럼 성격이 다른 센터는 1depth label도 `합격현황`, `합격자 소개`처럼 센터 문맥에 맞게 바꾼다.
- 아직 공개 라우트가 없는 세부 메뉴는 깨진 경로를 만들지 않고 `/{center}#anchor` 형태로 연결한다. 실제 라우트가 생기면 menu 데이터의 `href`만 교체한다.
- 모바일에서는 별도 메뉴 데이터를 만들지 않는다. 햄버거 버튼으로 같은 메가 메뉴 구조를 fullscreen 패널에 표시한다.
- 아트센터 기준 1depth 구조는 `배우앤배움 / 교육 / 캐스팅 / 아티스트 / 지원센터`이며, 하이틴센터·키즈센터·애비뉴센터도 같은 1depth를 따른다. 지원센터에는 `온라인 상담신청`을 2depth로 중복 배치하지 않는다.

### Footer

> ⚠️ 아래 수치는 **디자인 아트보드(1920px) 기준 참조값**이다. 실제 구현은 Tailwind 반응형 유틸리티와 `container` 정렬을 우선 사용하고, 유동형 값이 꼭 필요할 때만 `clamp()`를 쓴다.

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
  --container-main: 1160px;
  --container-sm: 840px;
}
```

---

## 7. GNB 구조 참고

```
[로고 (116×36)]          [메뉴: 배우앤배움 | 교육 | 캐스팅 | 아티스트 | 지원센터]          [온라인상담신청] [Family Site ▾]
```

- 로고: 좌측 40px padding 후 배치
- 메뉴: 절대 위치로 수평 중앙 배치, 아이템 간격 80px
- 우측 버튼 영역: `온라인상담신청` (테두리 버튼) + `Family Site` (배경 채움 버튼 + 드롭다운)

---

## 미확인 항목 (추후 보완 필요)

- [x] 전체 타이포그래피 스케일 → `type-{role}-{size}` 토큰 초안 완료 (`src/styles/_type-scale.scss`). 단 **모바일 min 값은 임의 초안** — 모바일 시안 확정 후 교체 필요
- [ ] 모바일 레이아웃 (GNB, 컨테이너 패딩 변화)
- [ ] 기업소개 섹션 내용 확인 (현재 이름이 교육 화면과 혼용되어 있음)
- [ ] 상담센터 섹션 디자인 (피그마 미완성)
- [ ] **센터 브랜드 컬러 5종 실제 HEX 확정** (현재 임시값 — 피그마에서 추출 후 `@theme` 교체)
- [ ] **Pretendard / Font Awesome 7 Pro 실제 설치**
