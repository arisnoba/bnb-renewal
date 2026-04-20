# C0 기준 마이그레이션 진행판

> 기준 문서: [plan/c0-migration-plan.md](./c0-migration-plan.md)  
> 마지막 갱신: 2026-04-20  
> 현재 진행 기준: **Phase 0 완료, Phase 1 완료, Phase 2 완료**

## 현재 상태

- 새 정본 입력은 `data/baewoo-curated/c0/*.sql` 23개다.
- Phase 0에서 먼저 `Pages` 컬렉션 제거와 c0 공통 파서/스키마 문서화를 끝낸다.
- `p0~p2` 기반 시드는 아직 비교 근거로 남겨두되, `seed-p0.ts`는 pages 없는 deprecated 상태로 축소했다.

## 전체 체크리스트

### Phase 0 — 철거 및 c0 스키마 분석

- [x] `plan/c0-migration-plan.md`를 현재 저장소 기준으로 보완
- [x] `payload.config.ts`에서 `Pages` 컬렉션 제거
- [x] `src/collections/Pages.ts` 삭제
- [x] 홈 화면의 `pages`/`p0` 안내 문구 제거
- [x] `.gitignore`에 `tmp/c0/` runtime 산출물 경로 추가
- [x] `scripts/seed-p0.ts`를 pages 없는 deprecated 상태로 축소
- [x] `scripts/c0/parse.ts` 추가
- [x] `data/baewoo-curated/c0/SCHEMA.md` 작성
- [x] Pages 제거 기준 migration 생성
- [x] `seed-p1.ts` / `profile-images.ts` deprecated 표기
- [x] `npm run payload:generate-types`로 타입 재생성
- [x] `rg -n 'pages|Pages' payload.config.ts src scripts` 기준 잔존 참조 최종 확인
- [x] `npm run typecheck`
- [x] `npm run lint`

### Phase 1 — Clean Slate + Teachers / Agencies

- [x] `tmp/c0/snapshot-pre-c0.json` 생성
- [x] `tmp/c0/backup/pre-c0.json` 생성
- [x] `tmp/c0/castings-pre-c0.json` 생성
- [x] destructive guard 설계 반영
- [x] `scripts/c0/seed-teachers.ts`
- [x] `scripts/c0/seed-agencies.ts`
- [x] Teachers / Agencies dry-run 검증
- [x] Teachers / Agencies 실시드

### Phase 2 — Profiles / Castings / News

- [x] `scripts/c0/seed-profiles.ts`
- [x] `scripts/c0/diff-castings.ts`
- [x] `data/baewoo-curated/c0/castings-diff-report.md`
- [x] Castings 승인 게이트 통과 여부 기록
- [x] `scripts/c0/seed-castings.ts`
- [x] `scripts/c0/seed-news.ts`
- [x] News 대용량 파싱 시간/메모리 기록

### Phase 3 — 신규 컬렉션 12개

- [ ] Batch 3A 완료
- [ ] Batch 3B 완료
- [ ] Batch 3C 완료
- [ ] 신규 컬렉션 12개 admin 그룹화 확인

### Phase 4 — 이미지 업로드 및 URL 치환

- [ ] `scripts/c0/scan-legacy-urls.ts`
- [ ] `data/baewoo-curated/c0/legacy-urls.json`
- [ ] 이미지 다운로드 / 업로드 매니페스트
- [ ] `scripts/c0/replace-image-paths.ts`
- [ ] 잔존 legacy URL 0건 확인

### Phase 5 — 검증 및 정리

- [ ] `scripts/c0/verify.ts`
- [ ] `data/baewoo-curated/c0/verify-report.md`
- [ ] `p0~p2` 의존 스크립트 제거
- [ ] `data/baewoo-curated/p0`, `p1`, `p2` 제거
- [ ] `data/baewoo-curated/README.md`, `summary.json` 갱신
- [ ] `npm run build`

## 이번 세션에서 바뀐 것

- `Pages` 컬렉션 제거 시작
- `scripts/c0/parse.ts` 추가
- `data/baewoo-curated/c0/SCHEMA.md` 추가
- `src/migrations/20260416_111020_c0_phase0_baseline.ts` 생성
- `scripts/c0/runtime.ts` 추가
- `scripts/c0/snapshot-pre-c0.ts`, `backup-pre-c0.ts`, `export-castings-pre-c0.ts` 추가
- `scripts/c0/seed-teachers.ts`, `scripts/c0/seed-agencies.ts` 추가
- `scripts/c0/seed-profiles.ts`, `scripts/c0/diff-castings.ts`, `scripts/c0/seed-castings.ts`, `scripts/c0/seed-news.ts` 추가
- `src/migrations/20260420_090000_c0_phase1_core_reset.ts` 추가
- `tmp/c0/snapshot-pre-c0.json`, `tmp/c0/castings-pre-c0.json`, `tmp/c0/backup/pre-c0.json` 생성
- `data/baewoo-curated/c0/castings-diff-report.md` 생성
- Neon DB Phase 2 실시드 완료 (`profiles=660`, `news=2908`, `castings=22`)
- 진행판을 phase 단위 체크리스트로 재작성

## 다음 작업 우선순위

1. Phase 3 신규 컬렉션 12개를 3A/3B/3C 배치로 진행
2. Phase 4 이미지 업로드 및 legacy URL 치환 준비
3. 필요 시 `news/profiles/castings`의 2020년 이전 데이터 컷오프를 별도 후속 작업으로 분리 검토

## 검증 메모

- 완료:
  - `npm run payload:generate-types`
  - `npm run typecheck`
  - `npm run lint`
  - `rg -n 'pages|Pages' payload.config.ts src scripts` → 잔존 참조 없음
  - `npm run db:seed:c0-profiles:dry-run` → `660`
  - `npm run db:c0:diff-castings` → baseline `10`, candidate `22`, exact match `10`, new only `12`
  - `npm run db:seed:c0-castings:dry-run` → `22`
  - `npm run db:seed:c0-news:dry-run` → `2908`, parse 약 `1470ms`, RSS delta 약 `554.6MB`
  - Neon 실시드 후 카운트 검증 → `teachers=109`, `agencies=63`, `agencies_actors=185`, `profiles=660`, `news=2908`, `castings=22`
  - `castings` source 분포 → `g5_write_new_casting=5`, `g5_write_new_casting2=4`, `g5_write_new_casting3=5`, `g5_write_new_casting_abio=6`, `g5_write_new_casting_bx=2`
  - slug 중복 검사 → `profiles=0`, `news=0`, `castings=0`
- 참고:
  - 생성된 migration은 `pages`만 drop하는 diff가 아니라, **현재 컬렉션 기준 첫 베이스라인 스냅샷**이다.
  - admin 부팅 수동 확인은 이번 세션에서 실행하지 않았다.
  - `.env.local`의 기본 `DATABASE_URL`은 현재 Neon 원격 DB를 가리킨다. Phase 1 destructive migration은 로컬 DB 또는 `ALLOW_DESTRUCTIVE_C0=1` 명시 시에만 통과하도록 막아두었다.
  - `pg_dump`는 로컬 설치 버전(14)과 Neon 서버 버전(17) 불일치로 사용할 수 없어, backup은 `pg` 직접 조회 기반 JSON export(`tmp/c0/backup/pre-c0.json`)로 대체했다.
  - `news.body_html`에는 아직 legacy URL이 남아 있다. 현재 잔존 카운트는 `/data/=2869`, `/web/img/=3`, `http://www.baewoo.co.kr/=810`, `http://baewoobaewoo.cafe24.com/=27`, `https://baewoo.co.kr:443/=1274` 이다.
  - 사용자가 원하면 `2020년 이전 데이터 제외`는 rollback이 아니라 별도 정리 phase로 다루는 편이 안전하다.
