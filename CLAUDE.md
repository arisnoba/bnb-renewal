# CLAUDE.md

프로젝트 규칙의 단일 기준은 `AGENTS.md`다. 아래 import로 전체를 로드한다.

@AGENTS.md

## 프론트 퍼블리싱 작업 시 (강제)

`src/app/(frontend)` 아래 페이지·섹션·마크업·스타일을 만들거나 수정할 때:

1. `frontend-publishing` 스킬을 먼저 호출한다.
2. `design-rules.md`와 `design.md`의 관련 섹션을 실제로 읽고 시작한다.
3. 완료 전 `npm run check:design`을 실행해 error 0건을 확인한다.
