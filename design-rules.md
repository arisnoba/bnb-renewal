# BNB 리뉴얼 — 코딩 디자인 룰

피그마 파일 분석 기반. 모든 수치는 피그마 변수/컴포넌트에서 직접 추출.

---

## 1. 폰트

### 주요 폰트
| 용도 | 패밀리 | 비고 |
|------|--------|------|
| 본문/UI 전체 | **Pretendard** | 한국어 + 영문 통합 |
| 아이콘 | **Font Awesome 7 Pro** | Solid 스타일 기준 |

> **현재 코드 교체 필요**: `layout.tsx`의 `GeistSans` → `Pretendard`로 변경

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

> 전체 타입 스케일은 피그마 화면별 텍스트 노드 확인 후 보완 예정

---

## 2. 색상

### 브랜드 색상
| 토큰 | Hex | 용도 |
|------|-----|------|
| `brand-red` | `#C80000` | 주요 액센트, CTA, Destructive |

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

### 시맨틱 색상

#### 배경
| 토큰 | Hex | 용도 |
|------|-----|------|
| `bg-default` | `#FFFFFF` | 기본 페이지 배경 |
| `bg-subtle` | `#FAFAFA` | 섹션 구분 배경 |
| `bg-muted` | `#F5F5F5` | 카드/인풋 배경 |
| `bg-dark` | `#0C0C0C` | Footer, 다크 섹션 |
| `bg-inverted` | `#222222` | 다크 모드 배경 |

#### 텍스트
| 토큰 | Hex | 용도 |
|------|-----|------|
| `text-default` | `#222222` | 기본 본문 |
| `text-subtle` | `#4D4D4D` | 보조 텍스트 |
| `text-muted` | `#999999` | 플레이스홀더, 비활성 |
| `text-disabled` | `#AAAAAA` | 비활성 상태 |
| `text-inverted` | `#FFFFFF` | 어두운 배경 위 |
| `text-link` | `#3B82F6` | 링크 |
| `text-link-hover` | `#1D4ED8` | 링크 호버 |

#### 테두리
| 토큰 | Hex | 용도 |
|------|-----|------|
| `border-default` | `#EEEEEE` | 기본 구분선 |
| `border-subtle` | `#F5F5F5` | 약한 구분선 |
| `border-strong` | `#D9D9D9` | 강조 구분선 |
| `border-focus` | `#3B82F6` | 포커스 링 |

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

피그마 `Radius` 컬렉션 기준:

| 토큰 | 값 | Tailwind 클래스 |
|------|----|----------------|
| `radius-none` | `0px` | `rounded-none` |
| `radius-sm` | `2px` | `rounded-sm` |
| `radius-base` | `4px` | `rounded` |
| `radius-md` | `6px` | `rounded-md` |
| `radius-lg` | `8px` | `rounded-lg` |
| `radius-xl` | `12px` | `rounded-xl` |
| `radius-2xl` | `16px` | `rounded-2xl` |
| `radius-3xl` | `24px` | `rounded-3xl` |
| `radius-full` | `9999px` | `rounded-full` |

---

## 4. Spacing (4px 그리드)

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

### 기준 화면 너비
- **Desktop**: 1920px (피그마 기준)

### GNB
- 전체 너비: 1920px (full-width)
- 좌우 패딩: `40px`
- 높이: `84px`
- 내부 영역: 1840px
- 배경: 투명 (페이지 최상단, 이미지 위에 오버레이)
- 텍스트 색상: `#FFFFFF`
- 메뉴 아이템 간격: `80px`

### Footer
- 전체 너비: 1920px (full-width)
- 좌우 패딩: `400px` (각각)
- **내용 영역 너비: 1120px**
- 상하 패딩: `80px`
- 아이템 간격: `40px`
- 배경: `#0C0C0C`

### 메인 컨텐츠 컨테이너
- **추정 max-width: 1120px** (Footer 내용 영역 기준)
- 중앙 정렬 (`margin-inline: auto`)

### 레이아웃 그리드 (뉴스 화면 기준)
- 컬럼 수: **12 columns**
- 거터: **20px**
- 양쪽 여백: **560px**

### Breakpoints (피그마 변수 기준)
| 이름 | 값 | 해상도 |
|------|----|--------|
| `sm` | `40rem` (640px) | 모바일 |
| `md` | `48rem` (768px) | 태블릿 |
| `lg` | `64rem` (1024px) | 소형 데스크탑 |
| `xl` | `80rem` (1280px) | 데스크탑 |
| `2xl` | `86rem` (1376px) | 대형 데스크탑 |

---

## 6. Tailwind 설정 업데이트 가이드

`globals.css`의 `@theme` 섹션에 반영해야 할 값들:

```css
@theme {
  /* 폰트 */
  --font-sans: 'Pretendard', sans-serif;

  /* 브랜드 색상 */
  --color-brand: #C80000;

  /* 배경 */
  --color-bg-dark: #0C0C0C;

  /* 텍스트 */
  --color-text-default: #222222;
  --color-text-subtle: #4D4D4D;
  --color-text-muted: #999999;

  /* 테두리 */
  --color-border-default: #EEEEEE;
  --color-border-strong: #D9D9D9;

  /* Radius */
  --radius-none: 0px;
  --radius-sm: 2px;
  --radius-base: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-full: 9999px;

  /* 컨테이너 */
  --container-main: 1120px;
  --gnb-padding-x: 40px;
  --footer-padding-x: 400px;
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
