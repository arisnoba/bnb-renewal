# 프로젝트 개발 가이드

## 프로젝트 개요

- **스택**: Next.js App Router + PayloadCMS + PostgreSQL + TypeScript
- **스토리지**: Cloudflare R2 (AWS S3 호환)
- **배포**: Vercel
- **로컬 인프라**: Docker (PostgreSQL + legacy MariaDB)

---

## 핵심 워크플로우

### 로컬 개발 환경 시작

```bash
npm run db:local:up   # PostgreSQL 컨테이너 시작
npm run dev           # Next.js dev server (http://localhost:3000)
```

레거시 MariaDB 필요 시: `npm run legacy:db:up`

### PayloadCMS 컬렉션 변경 후 필수 절차

컬렉션(`.ts`) 파일을 수정하면 반드시 아래 순서대로 실행하세요:

```bash
npm run db:local:migrate:create   # 마이그레이션 파일 생성
# → src/migrations/index.ts에 등록 확인
npm run db:local:migrate          # 마이그레이션 실행
npm run payload:generate-types    # 타입 재생성
# 새 커스텀 컴포넌트 추가 시에만:
npm run payload:generate-importmap
```

### 타입 체크 / 린트

```bash
npm run typecheck   # TypeScript 타입 오류 확인
npm run lint        # ESLint 검사
```

---

## 프론트 퍼블리싱 규칙 (필수)

공개 프론트엔드(`src/app/(frontend)`)의 페이지·섹션·컴포넌트를 만들거나 마크업/스타일을 수정할 때는 아래를 반드시 따른다.

1. **신뢰 기준 문서를 먼저 읽는다**: `design-rules.md`(코딩 디자인 룰)와 `design.md`(사이트 구조·피그마 매핑). 기억에 의존하지 말고 작업 전에 관련 섹션을 실제로 연다.
2. **프로젝트 스킬 `frontend-publishing`을 사용한다** (`.agents/skills/frontend-publishing/SKILL.md`). 절대 규칙 12와 자가 점검 체크리스트가 정리되어 있다.
3. **작업 후 정적 검사를 돌린다**: `npm run check:design` (error 0건이어야 완료).

요약 절대 규칙: 라이트 모드 고정(`dark:` 금지) · Tailwind 우선 · 페이지 루트 4축(`page` + `page-light|dark` + 식별 클래스 + 필요 시 `page-top-offset`) · top-offset 페이지에 고정 `pt-*` 금지 · 브랜드 컬러는 `data-center` + `*-brand` · UI 기호는 lucide-react 아이콘.

---

## 에이전트 스킬 운영 기준

- 프로젝트 스킬의 정본은 `.agents/skills/<name>/SKILL.md` 하나다 (Codex가 직접 읽는 위치).
- `.claude/skills/<name>`은 정본을 가리키는 심볼릭 링크다 (Claude Code가 읽는 위치). **두 곳에 내용을 복사하지 말고, 스킬 추가/수정은 항상 `.agents/skills/`에서 한다.**
- 새 스킬 추가 절차: `.agents/skills/<name>/SKILL.md` 작성 → `ln -s ../../.agents/skills/<name> .claude/skills/<name>`.

---

## 코드 리뷰 체크리스트 (PayloadCMS 컬렉션)

컬렉션 변경 시 검토 항목:

1. **마이그레이션 필요 여부**: 필드 추가/삭제/타입 변경 → 마이그레이션 필요
2. **required 처리**: `required: true`는 DB NOT NULL 유발 → `validate` 함수 우선
3. **Array RowLabel**: 배열 필드는 `admin.components.RowLabel`로 항목 식별 텍스트 설정
4. **미디어 prefix**: R2 object key는 `/`로 구분된 폴더 구조 (`media/컬렉션/역할/...`)
5. **한국어 label**: 모든 필드에 `label` 명시
6. **Access Control**: `read/create/update/delete` 권한 명시

---

## 개인 작업 규칙

## 명령 실행

- 사용자가 작업을 맡긴 경우 필요한 커맨드와 쉘 명령 실행 여부를 따로 묻지 않고 바로 실행한다.
- 명령 실행 자체에 대한 확인 질문은 하지 않는다. 대신 실행 후 어떤 명령으로 무엇을 확인했는지 결과에 짧게 남긴다.
- 작업에 필요한 로컬 개발 서버, 빌드 프로세스, 점유 포트 프로세스 종료도 별도 확인 없이 실행한다.
- 파일이나 디렉터리를 삭제하는 명령은 예외로 둔다. `rm`, `find -delete`, 정리 스크립트, 생성물 일괄 삭제처럼 파일 삭제가 포함된 작업은 실행 전에 삭제 대상과 이유를 짧게 설명하고 사용자 확인을 받는다.
- 삭제 대신 되돌리기 쉬운 이동, 백업, 미추적 파일 무시로 해결할 수 있으면 삭제하지 않는 쪽을 우선한다.

## Payload 관리자 검증 UI

- Payload 관리자에서 필수값 에러가 필드 UI에 보여야 하는 경우, 컬렉션 `beforeValidate`에서 `throw new Error(...)`로 처리하지 않는다. 이 방식은 필드별 빨간 border, tooltip, 탭 에러 카운트 같은 기본 validation UI에 붙지 않는다.
- 커스텀 UI라도 validation UI가 필요하면 `type: "ui"`만 쓰지 않는다. `text`, `select`, `relationship` 등 실제 form state를 가진 필드에 `validate`를 붙이고, 필요한 경우 `virtual: true`와 custom `Field` 컴포넌트를 조합한다.
- 기존 데이터에 빈 값이 있을 수 있는 컬렉션에서 단순히 `required: true`를 추가하면 DB `NOT NULL` 변경이 발생할 수 있다. 관리자 UI 검증만 필요한 경우 field-level `validate`를 우선 사용한다.
- 커스텀 필드 컴포넌트는 `useField`로 해당 필드 path의 `showError`, `errorMessage`, `setValue`를 연결하고, `FieldError`/`FieldLabel` 등 Payload 기본 UI 컴포넌트를 재사용한다.
- 숨겨진 보조 필드 값을 조작하는 커스텀 UI는 사용자가 조작할 때 대표 필드의 값도 함께 갱신해서 validation state가 최신 상태로 다시 계산되게 한다.

## Payload 배열 필드 제목

- Payload `array` 필드에 제목 역할을 할 수 있는 중요한 `text` 필드가 있으면 그 필드를 필수 입력으로 두고, 배열 row title/row label에 반드시 사용한다.
- 새 배열을 만들거나 기존 배열을 수정할 때는 관리자가 접힌 row만 보고도 항목을 구분할 수 있는 대표 텍스트 필드를 먼저 정하고, `admin.components.RowLabel` 또는 동등한 설정으로 그 값을 실제 row 제목에 연결한다.
- `Actor 01`, `Item 01`처럼 Payload 기본 인덱스 라벨이 보이면 미완료 상태로 보고, 한국어 `labels`와 대표 필드 기반 `RowLabel`을 추가한다.
- 대표 텍스트가 없는 배열은 가능한 한 `RowLabel` 컴포넌트나 동등한 관리자 표시 방식을 추가해 항목 식별이 되게 한다.

## Payload media / R2 object key

- 레거시 이미지를 Payload `media`로 생성하거나 R2에 올릴 때는 최종 R2 object key가 반드시 `/`로 구분된 폴더 구조를 가져야 한다.
- `prefix`만 넣고 파일명을 `direct-castings-body-11-874bfd79b6-...jpg`처럼 평탄하게 만드는 방식은 불완전한 처리로 본다. 최종 key 샘플이 `media/direct-castings/body-images/{sourceDb}/{sourceTable}/{sourceId}/{role-or-index}/{filename}`처럼 보이는지 확인한다.
- media 생성 스크립트를 작성하거나 수정할 때는 dry-run/write 결과에 `prefix`, `filename`, 최종 `objectKey` 또는 `prefix + filename` 샘플을 출력하고, 샘플 key에 `/` 구분이 남아 있는지 검증한다.
- 원본 추적을 위해 원본 파일명은 보존하되, R2에서 관리하기 쉬운 폴더 구분은 object key에 반영한다. 같은 컬렉션 안에서도 대표 이미지, 본문 이미지, 갤러리, 로고는 서로 다른 경로 세그먼트를 사용한다.
