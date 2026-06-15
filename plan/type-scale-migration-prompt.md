# 타입 스케일 토큰 마이그레이션 프롬프트

> 새 에이전트 세션(Claude/Codex)에 그대로 붙여 넣어 사용한다.

---

기존에 퍼블리싱된 공개 프론트엔드 페이지의 텍스트 스타일을 `type-{role}-{size}` 토큰으로 마이그레이션해줘. **렌더링 결과가 픽셀 단위로 동일한 치환만 자동 적용하고, 조금이라도 애매한 것은 절대 임의로 바꾸지 말고 모아서 나에게 질문해.**

## 사전 숙지 (작업 전 반드시 읽기)

1. `src/app/(frontend)/type-scale.scss` — 토큰 정의(`$type-scale` 맵)와 피그마 매핑 주석 전체
2. `design-rules.md`의 "타입 스케일 토큰" 섹션과 "프론트 구현 스타일 원칙"
3. Claude Code라면 `frontend-publishing` 스킬을 먼저 호출

## 토큰 요약

| 클래스 | size / weight / line-height | 비고 |
|--------|------------------------------|------|
| `type-display-{xl,l,m,s}` | fluid 40~60 / 34~48 / 28~36 / 26~32px, 800 | clamp |
| `type-headline-{xl,l,m,s}` | fluid 30~42 / 26~32 / 22~28 / 20~24px, 700 | clamp |
| `type-title-{l,m,s}` | 고정 20 / 18 / 16px, 700, lh 1.35 | |
| `type-body-{l,m,s}` | 고정 18 / 16 / 14px, 400, lh 1.6 | |
| `type-label-{l,m,s}` | 고정 16 / 14 / 12px, 500, lh 1.35 | |
| `type-caption-{m,s}` | 고정 13 / 12px, 400, lh 1.4 | |

토큰은 `@layer components`라 Tailwind 유틸리티가 항상 디폴트를 덮는다. 즉 `type-title-m font-medium leading-normal`처럼 조합하면 크기만 토큰에서 오고 굵기·행간은 TW 값이 적용된다.

## 작업 범위

- 대상: `src/app/(frontend)` 아래 공개 페이지의 `.tsx`와 colocated `.scss`
- 제외: `src/app/(payload)` 등 Payload admin, `page-typography.scss`의 `page-title`/`page-eyebrow`/`page-desc` 체계(별도 토큰 체계이므로 건드리지 않음), `src/styles/_mixins.scss`, `type-scale.scss` 자체

## 절차

### 1단계 — 인벤토리

대상 범위에서 텍스트 크기 선언을 전부 수집한다:

- tsx: `text-[Npx]`, `text-xs`~`text-6xl`, `md:text-*` 반응형 쌍, `leading-*`, `font-*` 조합
- scss: `font-size:`, `fluid-type(`, `fluid-clamp(` 호출

파일:라인, 현재 값(크기/굵기/행간/반응형 여부), 텍스트의 역할(제목/문단/버튼/메타)을 표로 정리한다.

### 2단계 — 분류

**[자동 적용] 완벽 매치 — 아래 조건을 전부 만족할 때만:**

- 고정 크기(반응형 분기 없음)이고, px 값이 고정 슬롯(title/body/label/caption: 20/18/16/14/13/12px) 중 하나와 정확히 일치
- role 판정이 명확: heading 태그·카드 제목 → `title`, 문단 → `body`, 버튼·폼·네비·태그 → `label`, 날짜·메타·보조설명 → `caption`
- 치환 후에도 렌더링이 동일: 기존 굵기/행간이 토큰 디폴트와 같으면 해당 TW 클래스 제거, 다르면 `font-*`/`leading-*`을 남겨 덮어쓰기 (예: `text-[18px] font-medium leading-normal` → `type-title-m font-medium leading-normal`)

**[질문 수집] 다음은 절대 자동 적용하지 말 것:**

- px 값이 어느 슬롯과도 불일치 (15px, 17px, 22px 등)
- 반응형 쌍(`text-[28px] md:text-[40px]`)이나 기존 `fluid-type`/`fluid-clamp` 호출 — display/headline 토큰의 min 값은 임의 초안이라 기존 값과 일치할 가능성이 낮다. min/max가 정확히 일치하는 경우만 자동, 나머지는 전부 질문
- role 판정이 애매한 경우 (같은 16px이라도 title-s/body-m/label-l 중 무엇인지 문맥으로 불확실)
- 한 컴포넌트가 여러 화면에서 재사용되어 영향 범위가 불확실한 경우

### 3단계 — 자동 적용

- 페이지(라우트) 단위로 적용하고 페이지마다 atomic commit (`refactor: {페이지} 텍스트를 타입 스케일 토큰으로 치환`)
- 치환할 때 기존 의미 클래스(`section-*__*`)는 그대로 유지

### 4단계 — 질문 (일괄)

자동 적용이 끝나면 질문 대상을 **한 번에 표로** 제시하고 내 답을 기다린다. 형식:

| # | 파일:라인 | 현재 | 가장 가까운 슬롯 | 권장안 |
|---|----------|------|----------------|--------|
| 1 | .../page.tsx:42 | text-[22px] font-bold | type-headline-s(24) 또는 type-title-l(20) | headline-s로 통합 (디자인 ±2px) |

권장안에는 "슬롯으로 통합(값 변경됨)" / "토큰 min/max를 이 값으로 수정" / "예외로 유지 + 주석" 중 하나를 제시한다. 내 답변을 받은 항목만 반영한다.

### 5단계 — 검증

- `npm run typecheck`, `npm run lint`, `npm run check:design` 통과
- 자동 적용분은 치환 전후 크기/굵기/행간이 동일함을 항목별로 보고
- 가능하면 dev 서버로 변경 페이지 2~3개 육안 확인

## 보고 형식

- 자동 적용: N건 (페이지별 커밋 목록)
- 질문 대기: M건 (4단계 표)
- 검증 결과
