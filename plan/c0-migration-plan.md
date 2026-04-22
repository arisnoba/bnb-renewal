# C0 기준 마이그레이션 재계획 (v2 — Codex 검토 반영)

> 작성일: 2026-04-16
> 위치: 프로젝트 내부 (다중 세션 참조용)
> 관련: [plan/todo.md](./todo.md) (진행 체크리스트), [docs/archive/c0-migration-context.md](../docs/archive/c0-migration-context.md) (기존 컨텍스트)
> 보존 상태: 이 문서는 과거 `data/baewoo-curated` 정적 SQL 기반 계획의 기록이다. 현재 이관 기준은 센터별 MariaDB dump와 `scripts/legacy-mariadb/build-work-*.sql`이다.

## Context

기존 `data/baewoo-curated/p0~p2` 기반 마이그레이션은 잘못 선별된 테이블을 포함했음 (특히 `g5_content`/`g5_content2` → Pages 컬렉션). 2026-04-16 새로 큐레이션한 `data/baewoo-curated/c0/` (**23개 SQL** + context.md 1개)를 단일 정본으로 삼아 마이그레이션 경로를 새로 만든다.

문제는 `c0/baewoo-migration-context.md`가 4-14에 작성된 후 4-16에 SQL **13개**가 추가되면서 **그 13개 테이블의 스키마와 분류는 문서화되지 않았다**. 또한 현재 `seed-p0.ts`/`seed-p1.ts`/`profile-images.ts`는 모두 `p0~p2` 입력에 의존하므로 그대로 둘 수 없다.

목표: c0 SQL 23개 중 **작업 대상 18개**(= 23 − 강좌 4 − 구공지 1)를 단일 입력으로 하는 새 시드 파이프라인을 phase별로 단계 구축하고, 잘못 들어간 컬렉션(Pages)을 정리하며, 이미지 Blob 업로드는 별도 phase로 분리한다.

> **Codex 검토 반영 사항**: ① Phase 0/1 분리 강화 ② SQL 실수량 정정 (22→23, 11→12) ③ Castings 통합본 차이 검토 게이트 추가 ④ 이미지 치환 대상 확장 (절대 URL/다중 호스트/`<a href>`) ⑤ admin labels 한국어 분리 + 검증 항목 보강 ⑥ truncate 전 baseline export 고정 ⑦ 백업/스냅샷은 gitignored runtime 산출물로 분리 ⑧ 실행 명령을 현재 저장소 기준 `npm`으로 정렬.

---

## 사용자 결정 요약

| 결정 사항 | 선택 |
|---|---|
| 추가 13개 게시판 테이블 분류 | **테이블당 1:1 컬렉션** (가벼운 것부터) |
| `g5_content`/`g5_content2` (Pages) | **폐기** — 잘못 추가된 데이터, 컬렉션도 제거 |
| 공지 중복 (`g5_write_notice` 구 / `g5_write_new_notice` 신) | **신버전만 사용** |
| 진행 방식 | **Phase별 단계 진행** |
| 강좌 시스템 (`g5_class`, `g5_class2`, `g5_lesson_teacher`, `g5_plan`) | **이번 생략** (추후 1:1 컬렉션으로 시작, 통합 여부는 추후) |
| Teachers (`g5_teacher` + `g5_teacher2`) | **현 통합 유지**, c0 기준 재시드 |
| 이미지 처리 시점 | **DB 변환 시 경로 문자열만 저장**, Blob 업로드는 별도 phase |

---

## c0 23개 SQL 인벤토리

> Codex가 실제 디렉토리 스캔으로 확인한 정확한 수: 23개 (context 제외). 아래 분류는 18 (작업) + 5 (제외).

### A. 기존 컬렉션에 재시드 (5개)

| 테이블 | 대상 컬렉션 | 비고 |
|---|---|---|
| `g5_teacher` | Teachers | sourceTable='g5_teacher' |
| `g5_teacher2` | Teachers | sourceTable='g5_teacher2' (photo_img1~6 추가 필드 수용) |
| `g5_agency` | Agencies | wr_1~43 페어 → actors 배열 정규화 |
| `g5_write_new_profile` | Profiles | 538KB. 현 seed-p1 로직 c0 입력으로 교체 |
| `g5_write_new_notice` | News | 18MB. 가장 큼 — Phase 끝 쪽에서 처리 |

### B. 기존 컬렉션 재구성 (1개) — **승인 게이트 필요**

| 테이블 | 대상 컬렉션 | 비고 |
|---|---|---|
| `g5_write_new_casting_all` | Castings | 현 Castings는 p1의 분리 변형(`casting/2/3/abio/bx`) 5개 흡수 중. **c0 통합본은 INSERT 22건뿐이라 단순 교체 시 데이터 축소 위험.** Phase 2에서 diff 리포트 후 사용자 승인. **파일명은 `casting_all`이지만 내부 CREATE TABLE/INSERT는 `g5_write_new_casting`** — 파서에서 처리 필요. |

### C. 신규 컬렉션 (12개, 가벼운 것부터)

| 테이블 | 컬렉션 slug | admin label (한국어) | 추정 용도 |
|---|---|---|---|
| `g5_casting` | `video-castings` | 영상 캐스팅 | YouTube URL 기반 (텍스트 캐스팅과 분리) |
| `g5_banner` | `banners` | 배너 | 기간/디바이스/포지션 |
| `g5_teacher_file` | `teacher-files` | 강사 첨부파일 | bn_id FK → Teachers, ~1010 레코드 |
| `g5_write_lineup` | `lineups` | 라인업 | |
| `g5_write_movie` | `movies` | 영화 | |
| `g5_write_new_appear` | `appearances` | 출연 | |
| `g5_write_new_appear2` | `appearances-extra` | 출연 (확장) | slug에 `2` 안 씀, 표시명에서도 숫자 제거. 스키마 비교 후 통합 여부 재검토 |
| `g5_write_new_direct_all` | `directings` | 연출 | |
| `g5_write_new_drama` | `dramas` | 드라마 | |
| `g5_write_new_hoogi` | `reviews` | 후기 | |
| `g5_write_new_shoot` | `shoots` | 촬영 | |
| `g5_write_new_starcard` | `star-cards` | 스타카드 | |

> 12개 신규. **slug는 영어 kebab-case 유지, admin labels(`labels.singular`/`labels.plural`)는 한국어로 분리** (Codex 권고). **Phase 3 시작 전에 SQL CREATE TABLE을 직접 열어 SCHEMA.md 작성 + 필드 매핑표 확정 필수.** context.md에는 `g5_banner`, `g5_casting`만 스키마가 있음.

### D. 이번 범위 제외 (5개)

| 테이블 | 사유 |
|---|---|
| `g5_class` | 강좌 시스템 — 이번 생략 |
| `g5_class2` | 강좌 시스템 — 이번 생략 |
| `g5_lesson_teacher` | 강좌 시스템 — 이번 생략 |
| `g5_plan` | 강좌 시스템 — 이번 생략 |
| `g5_write_notice` | 구 공지 — 신버전만 사용 결정에 따라 폐기 (참조용으로 c0에 보관만) |

### E. 폐기 대상 (현 시스템에 잘못 적재됨)

| 항목 | 사유 | 처리 Phase |
|---|---|---|
| Pages 컬렉션 자체 | `g5_content`/`g5_content2`가 c0에 없으며 사용자가 잘못된 추가로 확인. 정적 페이지는 Next.js로 작성. | Phase 0 |
| `seed-p0.ts` 의 pages 처리 로직 | Pages 폐기에 따라 함께 제거 | Phase 0 |
| `src/app/(site)/page.tsx` 등의 "pages 컬렉션" 안내 문구 | 홈/관리자 노출 메시지 정리 | Phase 0 |
| p0~p2 디렉토리 + 잔존 시드 스크립트 | c0 시드 파이프라인이 안정화된 후 폐기 (단, 비교 근거는 git 이력에 보존) | Phase 5 |

---

## 산출물 원칙

- **버전 관리 대상 문서**: `plan/c0-migration-plan.md`, `plan/todo.md`, `data/baewoo-curated/c0/SCHEMA.md`, `data/baewoo-curated/c0/castings-diff-report.md`, `data/baewoo-curated/c0/verify-report.md`
- **gitignored runtime 산출물**: `tmp/c0/**`
- `tmp/c0/`에는 DB 스냅샷/백업/사전 비교 JSON/대용량 스캔 결과를 둔다. 예: `tmp/c0/snapshot-pre-c0.json`, `tmp/c0/backup/pre-c0.sql`, `tmp/c0/castings-pre-c0.json`
- **원칙**: SQL dump, DB export, 운영 데이터 스냅샷은 `data/` 아래에 두지 않는다. 실수로 commit되는 비용이 너무 크다.
- **실행 명령 기준**: 현재 저장소는 `package-lock.json` 기준이므로 plan의 예시는 `npm run ...`으로 통일한다. 추후 `pnpm` 전환 시 그때 별도 갱신한다.

---

## Phase 구성

> **Codex 권고 반영**: Phase 0과 Phase 1의 결합을 분리. Phase 0은 "철거 + 기반 마련"으로 끝내고, Phase 1은 "clean slate 시작 조건 충족 + Teachers/Agencies 재시드"로 분리.

### Phase 0 — 철거 및 c0 스키마 분석 (선행 필수)

**목표**: Pages 컬렉션과 p0 시드 흐름을 깨끗이 제거. c0 SQL 23개의 실제 스키마를 모두 파악. c0 공통 SQL 파서 모듈 마련.

**작업**
1. c0 SQL 23개 각각에서 `CREATE TABLE` 추출 → `data/baewoo-curated/c0/SCHEMA.md` 작성 (context.md 미문서화 13개 + 기존 10개 모두 포함). **`g5_write_new_casting_all.sql`처럼 파일명/테이블명 불일치 케이스 별도 표기**
2. `payload.config.ts`에서 `Pages` 컬렉션 제거
3. `src/collections/Pages.ts` 삭제
4. Pages를 참조하는 라우트(`src/app/(site)/...`) + 홈/관리자 안내 문구 점검 및 정리
5. `tmp/c0/` runtime 산출물 경로를 `.gitignore`에 추가 (`tmp/c0/`)
6. Pages 컬렉션 제거 마이그레이션 SQL 생성 (`npm run db:migrate:create`)
7. `seed-p0.ts`의 pages 처리 로직만 제거 (teachers/news 처리는 Phase 5 일괄 제거 시까지 보존). 파일 상단에 `@deprecated — see scripts/payload-migration/` 표기
8. `seed-p1.ts`/`profile-images.ts`는 동일하게 deprecated 표기만 (제거는 Phase 5)
9. 신규 공통 모듈: `scripts/payload-migration/parse.ts`
   - phpMyAdmin 4.6.0 덤프 INSERT 파서
   - MySQL→PG 타입 변환
   - `0000-00-00` → null 처리
   - 백틱 제거
   - 파일명 vs 내부 테이블명 불일치 처리 (실제 INSERT 문의 테이블명을 신뢰)
   - 기존 `scripts/legacy-sql.ts` 재사용/확장 검토

**산출물**
- `data/baewoo-curated/c0/SCHEMA.md` (23개 테이블 스키마 + 컬렉션 매핑 표)
- `scripts/payload-migration/parse.ts`
- Pages 컬렉션 제거 마이그레이션 SQL (`src/migrations/`)

**검증**
- `npm run typecheck` / `npm run lint` 통과
- `npm run payload:generate-types` 후 Pages 타입이 사라졌는지 확인
- 개발 서버 띄워서 admin이 정상 부팅되는지 확인 (Pages 메뉴 사라졌는지)
- `rg -n 'pages|Pages' payload.config.ts src scripts` 로 잔존 참조 없음 확인

---

### Phase 1 — Clean Slate 검증 + 핵심 인물/조직 재시드 (Teachers, Agencies)

**목표**: 운영 데이터 백업 → clean slate 시작 조건 충족 → c0 기준으로 Teachers/Agencies 재시드. 이미지는 경로 문자열만 저장.

**Clean slate 시작 조건 (필수, 시드 전 완료)**
1. 현재 DB의 모든 컬렉션 카운트 스냅샷 → `tmp/c0/snapshot-pre-c0.json`
2. 기존 시드 데이터 export (Payload export API 또는 `pg_dump`) → `tmp/c0/backup/pre-c0.sql`
3. **Castings baseline export를 truncate 전에 별도 보존** → `tmp/c0/castings-pre-c0.json`
   - 최소 필드: `sourceTable`, `sourceId`, `slug`, `title`, `publishedAt`
   - 목적: Phase 2 diff 리포트의 비교 기준 고정
4. **destructive guard 추가**
   - truncate/replace 스크립트는 실행 전 resolved DB host / dbname / NODE_ENV를 출력
   - 기본값은 **로컬 DB만 허용**
   - 비로컬 DB에서 실행하려면 `ALLOW_DESTRUCTIVE_C0=1` 같은 명시적 unlock 필요
5. 운영 환경 DB 상태 확인 (운영에 이미 시드된 데이터 있는지 — 있으면 별도 협의)
6. 기존 데이터 truncate 마이그레이션 작성 + 적용 (**Phase 1에서는 `Teachers`, `Agencies`, `Profiles`, `News`만**)
7. 홈/관리자 안내 문구가 Phase 0에서 정리됐는지 재확인

> **중요**: `Castings`는 Phase 2 승인 게이트 전까지 truncate 하지 않는다. clean slate보다 기준 데이터 보존이 우선이다.

**시드 작업**
1. `scripts/payload-migration/seed-teachers.ts` 신규
   - 입력: `c0/g5_teacher.sql` + `c0/g5_teacher2.sql`
   - 출력: Teachers 컬렉션 upsert (`sourceTable`로 둘 구분)
   - teacher2의 `photo_img1~6` 필드를 Teachers 스키마에 추가
   - dry-run / limit / only 옵션 (seed-p0 패턴 차용)
2. `scripts/payload-migration/seed-agencies.ts` 신규
   - 입력: `c0/g5_agency.sql`
   - `wr_1~43` 페어를 `actors: [{name, generation}]` 배열로 정규화
   - `pr_1~9` 프로필 이미지 경로 보존 (Phase 4에서 Blob URL로 일괄 치환)
3. `package.json` 스크립트 추가: `db:seed:c0-teachers`, `db:seed:c0-agencies` (각각 dry-run 변형 포함)

**검증**
- dry-run 출력 카운트 = SQL INSERT 카운트
- admin UI에서 Teachers/Agencies 목록 렌더링 확인
- sourceTable 필터 카운트 = SQL 카운트
- legacy 이미지 경로 sample 5개 보존 확인
- slug 충돌 없음 (PG `SELECT slug, count(*) GROUP BY HAVING count > 1`)
- `0000-00-00` 잔존 없음 (`SELECT * WHERE created_at IS NULL` 등)
- pre-c0 스냅샷 대비 카운트 변화 리포트
- destructive guard가 비로컬 DB에서 실제로 중단되는지 dry-run 수준으로 확인

---

### Phase 2 — 핵심 콘텐츠 재시드 (Profiles, Castings, News)

**목표**: Profiles/Castings를 c0 기준으로 교체하고 News를 처음으로 시드.

**작업**
1. `scripts/payload-migration/seed-profiles.ts` 신규
   - 입력: `c0/g5_write_new_profile.sql`
   - 현 `seed-p1.ts`의 profiles 로직 c0 입력으로 이식
   - 프로필 이미지 URL 매핑은 Phase 4로 분리 (현 `loadLegacyProfileImageUrlMap` 의존 제거 또는 stub)
2. **Castings diff 리포트 + 승인 게이트** (`scripts/payload-migration/diff-castings.ts`)
   - `tmp/c0/castings-pre-c0.json` baseline vs `c0/g5_write_new_casting_all.sql` (INSERT 22건) 비교
   - 카운트 차이, sourceId 일치/불일치, 제목 일치/불일치 sample 비교
   - 출력: `data/baewoo-curated/c0/castings-diff-report.md`
   - **사용자 승인 후에만 `seed-castings.ts` 실행**
3. `scripts/payload-migration/seed-castings.ts` 신규
   - 입력: `c0/g5_write_new_casting_all.sql` (내부 테이블명은 `g5_write_new_casting` — 파서에서 처리)
   - 승인된 경우에만 **그 시점에** Castings 정리 후 재시드
   - 승인 거부 시 기존 Castings 유지
4. `scripts/payload-migration/seed-news.ts` 신규
   - 입력: `c0/g5_write_new_notice.sql` (18MB)
   - **메모리 주의**: `readline` + 라인 단위 INSERT 파싱 또는 청크 처리
   - **Phase 2 마지막에 실행, dry-run으로 시간/메모리 먼저 측정**
5. `package.json` 스크립트 추가

**검증**
- 각 컬렉션 레코드 수 일치
- News 18MB 처리 시간/메모리 측정 결과 기록
- 본문 HTML(`wr_content`, `bodyHtml`)에 `/data/`, `/web/img/`, `http://www.baewoo.co.kr/`, `http://baewoobaewoo.cafe24.com/` 경로가 살아 있는지 sample 확인 (Phase 4에서 치환)
- slug 충돌 / null date 검사
- Castings diff 보고서가 사용자 승인됨

---

### Phase 3 — 신규 컬렉션 12개 추가 (3개 배치, 가벼운 것부터)

**목표**: c0 신규 12개 테이블에 1:1 컬렉션을 만들고 시드. 4개씩 3개 배치로 분할.

> **Phase 0의 SCHEMA.md 완료 후에만 진행.** 각 컬렉션은 slug=영어, labels=한국어로 정의.

**Batch 3A — 가장 가벼운 인프라/부속 (4개)**
1. `g5_casting` (18KB) → `video-castings` 컬렉션 ("영상 캐스팅")
2. `g5_banner` → `banners` ("배너")
3. `g5_teacher_file` → `teacher-files` ("강사 첨부파일") — Teachers.files 임베드 vs 별도 컬렉션은 SCHEMA.md 본 후 결정
4. `g5_write_lineup` → `lineups` ("라인업")

**Batch 3B — 출연/콘텐츠 (4개)**
5. `g5_write_movie` → `movies` ("영화")
6. `g5_write_new_appear` → `appearances` ("출연")
7. `g5_write_new_appear2` → `appearances-extra` ("출연 확장") — appear와 스키마 비교 후 통합 여부 재검토
8. `g5_write_new_starcard` → `star-cards` ("스타카드")

**Batch 3C — 큰 콘텐츠 (4개)**
9. `g5_write_new_shoot` → `shoots` ("촬영")
10. `g5_write_new_drama` → `dramas` ("드라마")
11. `g5_write_new_direct_all` → `directings` ("연출")
12. `g5_write_new_hoogi` → `reviews` ("후기")

**각 테이블당 사이클**
- 컬렉션 정의 (`src/collections/{Name}.ts`) 작성 — `slug`, `labels.singular`, `labels.plural`, `admin.group: '레거시 콘텐츠'` 분류
- `payload.config.ts`에 등록
- 마이그레이션 생성 (`npm run db:migrate:create`)
- `scripts/payload-migration/seed-{name}.ts` 작성
- dry-run → 실시드 → admin 확인
- 한 테이블 끝나야 다음 테이블 진행 (atomic commit 단위)

**Batch별 검증**
- Batch 종료 시 누적 컬렉션 카운트가 SQL과 일치
- admin 사이드바 그룹화가 정상 (`레거시 콘텐츠` 그룹 안에 묶임)
- 각 컬렉션 sample 5건 admin 상세 화면 렌더링 확인
- `sourceTable`/`sourceId` 중복 없음

---

### Phase 4 — 이미지 Blob 업로드 및 본문 URL 치환

**목표**: 레거시 이미지 파일을 Vercel Blob에 올리고, DB의 경로 컬럼 + 본문 HTML의 모든 legacy URL 패턴을 일괄 업데이트.

**작업**
1. **legacy URL 패턴 수집** (사전 작업, `scripts/payload-migration/scan-legacy-urls.ts`)
   - 모든 컬렉션 본문 HTML/필드를 스캔
   - 추출 대상 패턴:
     - 상대경로: `/data/...`, `/web/img/...`, `/data/file/...`, `/data/editor/...`
     - 절대 URL: `http://www.baewoo.co.kr/...`, `https://www.baewoo.co.kr/...`
     - 다중 호스트: `http://baewoobaewoo.cafe24.com/...`, `http://baewoo.co.kr/...`, `http://baewoo.kr/...`, `http://baewoo.me/...`, `http://baewoo.net/...`
     - 서브도메인: `http://baewoorun.baewoo.co.kr/...`, `http://academy.baewoo.co.kr/...`, `http://bnbplay.baewoo.co.kr/...`
   - HTML 태그 대상: `<img src>`, `<a href>` (이미지 링크), `background-image: url(...)`
   - 출력: `data/baewoo-curated/c0/legacy-urls.json` (전체 분포 + 호스트별 카운트)
2. 다운로드 경로 분리
   - **본문 HTML 이미지**: HTML에 들어 있는 절대/상대 URL을 HTTP로 다운로드한다.
   - **구조화 이미지 필드**: `profileImagePath`, `gallery.path`, `photoImage*`, 첨부파일 경로처럼 DB에 파일 경로만 저장된 항목은 FTP로 다운로드한다.
   - FTP는 기존 `download_profile_images_ftp.py`의 source 설정/비밀번호 환경변수 패턴을 C0 전용 스크립트로 이관해서 사용한다.
3. 구조화 이미지 실행 순서
   - `ftp dry-run`: FTP 접속, 후보 remote path 존재 여부, 성공/실패 예상치를 먼저 보고한다.
   - 실제 다운로드: Blob 업로드 전에 `tmp/c0/images/...`로 내려받고 총 파일 수/총 용량/실패 수를 보고한다.
   - 용량 확인: 사용자가 스토리지 사용량을 판단할 수 있게 다운로드 결과의 bytes 합계와 컬렉션별 분포를 기록한다.
   - Blob 업로드: 다운로드 성공 파일만 업로드하고 `legacy_path → blob_url` 매니페스트를 생성한다.
4. Blob 업로드 스크립트: `scripts/payload-migration/upload-images.ts`
   - 디렉토리 구조: `agency/{bn_id}/`, `teacher/{bn_id}/`, `class/`, `static/`, `editor/{date}/`, `bbs/{board}/{bn_id}/`
   - 구조화 이미지의 Blob 경로는 원본 공개 URL 경로가 아니라 DB source path 기준으로 둔다. 예: `teachers/1/teacher_img01.png`
   - 매니페스트(`legacy_url|legacy_path → blob_url`) JSON 생성
5. DB 치환 스크립트: `scripts/payload-migration/replace-image-paths.ts`
   - 컬럼 대상: 모든 컬렉션의 `profileImagePath`, `gallery`, `bodyHtml`, `wr_content`, `legacyMeta` 안의 본문/이미지 필드 등
   - HTML 안의 `<img src>` + `<a href>` (이미지 확장자만) + `style="background-image: url(...)"` 패턴 모두 치환
   - dry-run으로 치환될 항목 수 + 매니페스트 미스 카운트 확인 후 실행
   - 기존 매니페스트 export 스크립트(`export-profile-image-manifest.ts`) 패턴 재사용

**검증**
- admin에서 sample 30개 이미지 실제 렌더링 확인 (Teachers/Agencies/Profiles/News 본문 포함)
- 매니페스트 미스(404) 카운트 보고
- **잔존 legacy URL grep 검사**: 모든 본문/필드에서 `baewoo.co.kr`, `baewoo.kr`, `baewoo.me`, `baewoo.net`, `baewoobaewoo.cafe24.com`, `/data/`, `/web/img/` 패턴 0건이어야 함
- 이미지 404 비율 < 5% (5% 초과 시 사용자 보고)
- 매니페스트와 실제 Blob 객체 일치 확인 (Vercel Blob list API)

---

### Phase 5 — 검증 및 정리

**목표**: 전체 마이그레이션 정합성 점검 + p0~p2 폐기.

**작업**
1. `scripts/payload-migration/verify.ts` (전체 검증 리포트)
   - 컬렉션별 레코드 수 vs c0 SQL INSERT 카운트
   - sourceTable/sourceId 중복 검사
   - slug 충돌
   - null date / 빈 필수 필드
   - 잔존 legacy URL (Phase 4 검증 재실행)
   - 이미지 매니페스트 일치율
   - 출력: `data/baewoo-curated/c0/verify-report.md`
2. `seed-p0.ts`/`seed-p1.ts`/`profile-images.ts`/`download-profile-images.ts`/`export-profile-image-manifest.ts`/`download_profile_images_ftp.py` 등 p0~p2 의존 스크립트 제거 (또는 c0/ 하위로 이관)
3. `package.json`의 `db:seed:p0-*`, `db:seed:p1-*`, `profiles:images:*` 스크립트 제거
4. `data/baewoo-curated/p0/`, `p1/`, `p2/` 디렉토리 제거 (git 이력에 보존됨)
5. `data/baewoo-curated/README.md`, `summary.json` c0 기준으로 갱신
6. `plan/todo.md` "C0 기준 마이그레이션 재계획" 항목 모두 체크 + 완료 메모

**검증**
- 전체 verify 리포트에서 갭 없음
- `npm run typecheck` / `npm run lint` / `npm run build` 통과
- admin에서 모든 컬렉션 정상 표시 + 그룹화 확인
- 운영 도메인(예정)별 라우트 sanity check
- `rg -i 'p0|p1|p2' scripts/ src/` 잔존 참조 없음

---

## Critical Files

**수정/제거 대상**
- `payload.config.ts` (Phase 0: Pages 제거 / Phase 1~3: 신규 12개 추가)
- `src/collections/Pages.ts` (Phase 0 삭제)
- `src/collections/Teachers.ts` (Phase 1: photo_img1~6 + admin labels)
- `src/collections/Agencies.ts` (Phase 1: actors 배열 + admin labels)
- `src/collections/Profiles.ts` / `Castings.ts` / `News.ts` (Phase 2: admin labels 정비)
- `src/app/(site)/page.tsx` (Phase 0: pages 안내 문구 제거)
- `scripts/seed-p0.ts` (Phase 0: pages 처리만 제거 / Phase 5: 전체 제거)
- `scripts/seed-p1.ts` (Phase 5에서 제거)
- `scripts/profile-images.ts` (Phase 5에서 제거 또는 c0/ 하위 이관)
- `scripts/legacy-sql.ts` (Phase 0: 재사용/확장)
- `package.json` (Phase별로 스크립트 추가/교체)
- `plan/todo.md` (Phase별 진행 상황 갱신)

**신규**
- `data/baewoo-curated/c0/SCHEMA.md` (Phase 0)
- `tmp/c0/snapshot-pre-c0.json` (Phase 1, gitignored)
- `tmp/c0/backup/pre-c0.sql` (Phase 1, gitignored)
- `tmp/c0/castings-pre-c0.json` (Phase 1, gitignored)
- `data/baewoo-curated/c0/castings-diff-report.md` (Phase 2)
- `data/baewoo-curated/c0/legacy-urls.json` (Phase 4)
- `data/baewoo-curated/c0/verify-report.md` (Phase 5)
- `scripts/payload-migration/parse.ts` (Phase 0)
- `scripts/payload-migration/seed-teachers.ts` (Phase 1)
- `scripts/payload-migration/seed-agencies.ts` (Phase 1)
- `scripts/payload-migration/diff-castings.ts` (Phase 2)
- `scripts/payload-migration/seed-profiles.ts` / `seed-castings.ts` / `seed-news.ts` (Phase 2)
- `scripts/payload-migration/seed-{video-castings,banners,teacher-files,lineups,movies,appearances,appearances-extra,star-cards,shoots,dramas,directings,reviews}.ts` (Phase 3, 12개)
- `scripts/payload-migration/scan-legacy-urls.ts` (Phase 4)
- `scripts/payload-migration/upload-images.ts` (Phase 4)
- `scripts/payload-migration/replace-image-paths.ts` (Phase 4)
- `scripts/payload-migration/verify.ts` (Phase 5)
- `src/collections/{VideoCastings,Banners,TeacherFiles,Lineups,Movies,Appearances,AppearancesExtra,StarCards,Shoots,Dramas,Directings,Reviews}.ts` (Phase 3, 12개)

> 모든 경로는 프로젝트 루트(`/Users/arisnoba/Documents/GitHub/bnb-renewal/`) 기준 상대경로.

---

## 재사용 자산

- `scripts/legacy-sql.ts` — 기존 SQL 파서. Phase 0에서 c0/parse.ts의 베이스로 활용
- `scripts/seed-p1.ts`의 profiles/castings upsert 로직 — Phase 2 시드 스크립트의 골격으로 차용 (입력 소스만 c0로 교체)
- `scripts/seed-p0.ts`의 teachers upsert + dry-run/limit/only 옵션 패턴 — Phase 1~3 시드 CLI 표준
- `scripts/download_profile_images_ftp.py` — Phase 4 FTP 다운로드 베이스
- `scripts/export-profile-image-manifest.ts` — Phase 4 매니페스트 생성 패턴

---

## 검증 전략 (전체 공통)

각 Phase 종료 시 (필수):
1. `npm run typecheck` 통과
2. `npm run lint` 통과
3. dry-run 출력 vs 실시드 결과 카운트 일치
4. admin UI 부팅 + 해당 컬렉션 목록/상세 렌더링 확인
5. **slug 충돌 검사**: `SELECT slug, count(*) FROM <collection> GROUP BY slug HAVING count > 1`
6. **null date 검사**: `0000-00-00`이 NULL로 들어갔는지 + 필수 date 필드 NULL 없음
7. **잔존 legacy URL grep**: Phase 4 이후엔 0건이어야 함
8. **이미지 404 비율**: Phase 4 이후 < 5%
9. `sourceTable`/`sourceId` 중복 없음
10. destructive step이 있으면 resolved DB / environment guard 로그를 남김

전체 종료 시 (Phase 5):
- 23개 c0 SQL 중 작업 대상 18개(= 23 − 강좌 4 − 구공지 1) 모두 컬렉션화 또는 명시적 제외 처리됨
- 12개 신규 컬렉션 + 5개 재시드 + 1개 재구성 = 18개 처리 확인
- p0~p2 잔존물 없음 (`rg`로 확인)
- `npm run build` 성공
- 이미지 Blob URL이 모든 본문 HTML/필드에 적용됨 (잔존 legacy URL 0건)

---

## 위험 요소

- **18MB `g5_write_new_notice` 파싱**: tsx의 메모리 한계 가능. Phase 2에서 readline 스트리밍 파싱 필요할 수 있음. dry-run으로 시간/메모리 먼저 측정.
- **추가 13개 테이블 스키마 미문서화**: Phase 0의 SCHEMA.md 작성이 늦어지면 Phase 3 전체 지연. 우선 작업 항목.
- **이미지 FTP 가용성**: 현재 phpMyAdmin 오류 상황과 별개로 FTP 접근 상태 확인 필요. Phase 4 시작 전 사전 점검.
- **운영 데이터 처리**: Phase 1 clean slate 시작 조건에서 운영 DB 상태 확인 필수. 운영에 시드된 데이터가 있다면 별도 협의로 분리.
- **파괴적 작업 오실행 위험**: 현재 repo는 `.env.local` 기반으로 DB를 잡는다. truncate/replace는 resolved DB 출력 + 로컬 기본 허용 + `ALLOW_DESTRUCTIVE_C0=1` unlock 없으면 중단해야 함.
- **Castings 데이터 축소 위험**: c0 통합본 INSERT 22건 vs 현 5개 변형 흡수본의 카운트 차이. **Phase 2 diff 리포트 + 사용자 승인 게이트로 통제.**
- **파일명 vs 내부 테이블명 불일치**: `g5_write_new_casting_all.sql`의 INSERT는 `g5_write_new_casting`. 파서가 INSERT의 실제 테이블명을 신뢰해야 함.
- **legacy URL 호스트 다양성**: `baewoo.co.kr`, `baewoo.kr`, `baewoo.me`, `baewoo.net`, `baewoobaewoo.cafe24.com`, 서브도메인까지. Phase 4의 `scan-legacy-urls.ts`가 정확히 모두 잡아야 함.
- **컬렉션 12개 추가의 admin UX**: 사이드바가 길어짐. Phase 3 컬렉션은 모두 `admin.group: '레거시 콘텐츠'`로 묶음. 핵심 컬렉션(Teachers/Agencies/Profiles/Castings/News)은 그룹 없이 상단 노출.
- **`appear` vs `appear2` 중복 가능성**: 두 테이블 스키마가 거의 같으면 통합 가치 검토. Phase 3 Batch 3B에서 결정.

---

## 후속 (이번 범위 외)

- 강좌 시스템 4개 테이블 (`g5_class`, `g5_class2`, `g5_lesson_teacher`, `g5_plan`) 별도 phase 편성 (1:1 컬렉션 시작 → 추후 통합 검토)
- p2의 상담/CRM 데이터 (`g5_write_new_counsel*`, `sm_customer`) — 개인정보 마스킹 정책 확정 후 별도 phase
- 정적 페이지를 Next.js로 새로 작성 (Pages 컬렉션 폐기에 따른 후속)
- 도메인 4개(`baewoo.co.kr`, `.kr`, `.me`, `.net`) + 서브도메인 라우팅 정책

---

## 변경 이력

- v1 (초안, 2026-04-16): 초기 plan 작성
- v2 (Codex 검토 반영, 2026-04-16):
  - SQL 수량 정정 (22→23, 신규 11→12)
  - Phase 0/1 분리 강화 (clean slate 시작 조건 신설)
  - Phase 2 Castings diff 리포트 + 승인 게이트 추가
  - 파일명 vs 내부 테이블명 불일치 처리 명시
  - Phase 3 12개 컬렉션을 4+4+4 배치로 분할
  - 컬렉션 명명 규칙: slug=영어 kebab-case, labels=한국어
  - Phase 4 이미지 치환 대상 확장 (절대 URL/다중 호스트/`<a href>`)
  - Phase 5 검증 항목 보강 (slug 충돌, null date, 잔존 URL grep, 404 비율)
  - 위험 요소에 호스트 다양성 / 파일명 불일치 / Castings 축소 추가
- v2.1 (프로젝트 내부 저장, 2026-04-16): 다중 세션 참조용으로 `plan/c0-migration-plan.md`에 복사. 경로 참조를 프로젝트 루트 상대경로로 정리.
- v2.2 (실행 안전성 보강, 2026-04-16):
  - Castings baseline export를 Phase 1 truncate 전에 고정
  - `Castings` truncate 시점을 Phase 2 승인 이후로 이동
  - pre-c0 snapshot / backup 경로를 `tmp/c0/` gitignored runtime 산출물로 변경
  - `.env.local` 오실행 방지용 destructive guard 요구사항 추가
  - 실행 명령을 현재 저장소 기준 `npm run ...`으로 정렬

---

## 다음 세션 시작 가이드

이 plan을 다음 세션에서 이어 작업할 때:

1. 먼저 `plan/todo.md`의 "C0 기준 마이그레이션 재계획" 섹션에서 마지막 체크 항목 확인
2. 이 문서의 "Phase 구성" 중 해당 Phase로 점프
3. **Phase 0이 미완료 상태라면** (SCHEMA.md 없음 / Pages 컬렉션 잔존) Phase 0부터 진행
4. 각 Phase는 atomic commit 단위로 진행 — 한 batch 또는 한 컬렉션 끝날 때마다 커밋
5. dry-run 결과를 commit 메시지에 포함 권장 (예: "feat(c0): seed teachers — 124 records, sourceTable counts: teacher=80, teacher2=44")
6. destructive 작업 전에는 반드시 resolved DB / `ALLOW_DESTRUCTIVE_C0` 가드부터 확인
