---
name: frontend-publishing
description: 공개 프론트엔드 퍼블리싱 규칙 적용 워크플로우. src/app/(frontend) 아래 페이지·섹션·컴포넌트를 새로 만들거나 마크업/스타일(Tailwind, CSS/SCSS)을 수정할 때, 피그마 화면을 구현할 때 반드시 사용. "퍼블리싱", "페이지 만들어", "섹션 추가", "마크업", "스타일 수정", "디자인 적용" 요청 시 적용.
---

# 프론트 퍼블리싱 규칙

## 신뢰 기준 (source of truth)

이 스킬은 요약 체크리스트다. 충돌 시 아래 두 문서가 항상 우선한다.

| 문서 | 내용 | 언제 읽나 |
|------|------|----------|
| `design-rules.md` | 코딩 디자인 룰 (색 토큰, 페이지 루트 클래스, Tailwind 기준, container, 아이콘, CSS 허용 범위) | 모든 퍼블리싱 작업 전 관련 섹션 필수 |
| `design.md` | 사이트 구조, 피그마 매핑, 페이지 루트 클래스 적용 예, 구현 현황 | 새 페이지/화면 작업 전 필수 |

**작업 시작 전에 이번 작업과 관련된 섹션을 실제로 읽고 시작한다.** 읽지 않고 기억에 의존해 구현하는 것은 미완료 작업으로 본다.

## 절대 규칙 12 (위반 시 작업 미완료)

1. **라이트 모드 고정** — 프론트 컴포넌트에 `dark:` variant를 추가하지 않는다. `[data-theme='dark']`는 Payload Admin 전용.
2. **Tailwind 우선** — 레이아웃, 반응형, 고정 spacing, 색, 타이포그래피는 `className` Tailwind 유틸리티로 작성한다. 피그마 고정값은 `text-[48px]` 같은 arbitrary value 허용.
3. **의미 클래스는 식별자/확장 hook** — 주요 섹션에 `section-{name}`, 주요 내부 요소에 `section-{name}__element`를 함께 붙인다. 단, 기본 스타일을 CSS 파일로 옮기는 용도가 아니다.
4. **페이지 루트 4축** — 모든 공개 페이지 루트에 `page` + 표면 톤(`page-light`|`page-dark`) + 페이지 식별(`page-faq`, `page-detail` 등) + hero 없이 콘텐츠가 바로 시작되면 `page-top-offset`.
5. **고정 상단 padding 금지** — `page-top-offset` 페이지에 `pt-20`, `pt-24` 같은 고정 상단 padding을 추가하지 않는다. 상단 offset은 전역 CSS 변수가 담당한다.
6. **브랜드 컬러는 토큰 경유** — 상위에 `data-center` 속성을 두고 `text-brand`/`bg-brand`/`border-brand`만 사용한다. `text-brand-art`처럼 센터별 클래스 직접 지정 금지.
7. **UI 기호는 아이콘 컴포넌트** — `>`, `→`, `×` 같은 텍스트 문자 금지. `lucide-react` 아이콘 + `aria-hidden="true"` + 접근 가능한 이름(텍스트 또는 `aria-label`).
8. **컨테이너 구조** — `main > section > .container|.container-sm|.container-fluid`. 콘텐츠 폭: 기본 1160px(`container`), 텍스트 중심 840px(`container-sm`).
9. **섹션 상하 여백 유틸** — 대표 섹션 여백은 `section-p-{t,b,block}-{xs,sm,base,lg}` 공용 유틸 우선 (`src/styles/_section-spacing.scss`).
10. **새 CSS/SCSS는 마지막 수단** — `details[open]`, `::before/::after` 장식, 리치텍스트 출력 등 design-rules.md §5 허용 범위에서만 colocated 파일 작성. 일반 레이아웃/반응형/색은 옮기지 않는다.
11. **배경 장식은 PageDeco** — 직접 div/SVG 장식 금지. `PageDeco` + 페이지 단위 `getPageDecoIcons(count, seed)` 사용, `aria-hidden="true"` 유지.
12. **한국어 줄바꿈** — 전역 `word-break: keep-all` 전제. `break-words`/`break-all`/`[overflow-wrap:anywhere]`는 긴 URL·영문 토큰 요소에만 제한적으로 사용.

## 작업 절차

1. `design.md`에서 대상 화면, 피그마 링크, 페이지 루트 클래스를 확인한다.
2. `design-rules.md`에서 관련 섹션(§2 색상, §5 레이아웃/컨테이너 등)을 읽는다.
3. 기존 구현 화면의 패턴을 확인한다. 기준 예: `/{center}/grade-system`(Tailwind 우선), `/{center}/faq`(의미 클래스 + top-offset), `/{center}/starcard`.
4. 구현한다. 새 토큰·클래스·파일을 만들기 전에 기존 것으로 해결 가능한지 먼저 확인한다("적게 만들기").
5. 검증한다:
   ```bash
   npm run check:design   # 디자인 룰 정적 검사
   npm run typecheck
   npm run lint
   ```
6. 결과 보고에 적용한 페이지 루트 클래스, 컨테이너, 섹션 의미 클래스를 명시한다.

## 완료 전 자가 점검

- [ ] design.md / design-rules.md 관련 섹션을 실제로 읽었다
- [ ] 페이지 루트에 `page` + 톤 + 식별자 (+ 필요 시 `page-top-offset`)를 붙였다
- [ ] `dark:` variant 없음, top-offset 페이지에 고정 `pt-*` 없음
- [ ] 텍스트 UI 기호 없음 (lucide-react 사용)
- [ ] 브랜드 색은 `data-center` + `*-brand`만 사용
- [ ] 새 CSS/SCSS 파일이 있다면 design-rules.md §5 허용 범위에 해당함을 한 줄로 설명할 수 있다
- [ ] `npm run check:design` 통과
