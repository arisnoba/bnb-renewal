# 레거시 DB 마이그레이션 진행판

> 기준 문서: [docs/레거시-DB-전환-방향.md](../docs/레거시-DB-전환-방향.md), [docs/레거시-테이블-분류-초안.md](../docs/레거시-테이블-분류-초안.md), [plan/c0-migration-plan.md](./c0-migration-plan.md)  
> 마지막 갱신: 2026-04-22
> 현재 진행 기준: **센터별 MariaDB dump 기반 통합으로 전환 중, 기존 c0 진행 기록은 하단에 보존**

## 센터별 dump 기반 통합 진행판

### 현재 기준

- 정본 입력은 `data/legacy_dumps`의 센터별 원본 SQL dump다.
- 로컬 MariaDB의 원본 DB(`baewoo`, `bnbuniv`, `kidscenter`, `bnbhighteen`)는 직접 최종 구조로 바꾸지 않는다.
- 통합/정리 결과는 `bnb_legacy_work` DB에 만든다.
- 작업 테이블명은 `_unified` 같은 임시 접미사를 붙이지 않고 최종 컬렉션에 가까운 이름을 쓴다.
- 각 통합 작업은 `scripts/legacy-mariadb/build-work-*.sql`로 반복 실행 가능하게 만든다.
- `package.json`에는 `legacy:work:*` 명령을 추가한다.
- 대표 row만 고르더라도 탈락한 원본 출처는 `legacy_meta.sources`에 보존한다.
- 동일 인물로 판단되는 row가 여러 개 있으면 데이터가 더 많은 row를 대표로 살리고, 서로 다른 인물로 중복 생성하지 않는다.
- 강사는 여러 센터에 동시에 노출될 수 있으므로 중복 row를 만들지 않고 `center`에 복수 센터를 기록한다.

### 원본 ID / 관계 키 원칙

- 레거시 숫자 ID(`wr_id`, `bn_id` 등)는 센터 DB와 테이블마다 재사용되므로 단독 식별자로 쓰지 않는다.
- 모든 work table의 원본 식별자는 `source_db + source_table + source_id` 복합 키를 기준으로 한다.
- slug도 숫자 ID만 쓰지 않고 `collection-source_db-source_id` 또는 `collection-source_db-source_table-source_id`처럼 출처가 드러나게 만든다.
- 첨부파일, 댓글, 레슨, 갤러리처럼 부모 row에 붙는 데이터는 원본 숫자 ID만으로 join하지 않는다. 최소 `source_db + source_table/bo_table + parent_source_id`를 함께 사용한다.
- 통합 과정에서 대표 row 하나만 남기더라도 병합된 모든 원본 row의 `source_db`, `source_table`, `source_id`, 필요 시 `bo_table`/`bf_no`를 `legacy_meta.sources`에 남긴다.
- 중복 판정 키와 원본 식별 키를 분리한다. 예를 들어 동일 인물 판단은 이름/역할/센터 기준으로 하더라도 추적과 재연결은 항상 복합 원본 키로 한다.

### 반복 작업 절차

1. 후보 테이블의 4개 DB row 수, schema 차이, 대표 샘플을 확인한다.
2. 중복 제거 기준을 정한다. 예: `TRIM(subject)`, 정규화 이름, 제목+날짜. 이 기준은 원본 식별 키와 분리한다.
3. 동일 인물/동일 콘텐츠로 판단되는 중복은 데이터 완성도가 높은 row를 대표로 선택한다.
4. 강사 통합은 `data/teacher-list.md`의 공개 강사 목록을 참고해 `center` 열에 복수 센터를 기록한다.
5. 최종 컬렉션에 가까운 `bnb_legacy_work` 테이블 구조를 만든다.
6. 원본 출처 필드(`source_db`, `source_table`, `source_id`)와 `legacy_meta.sources`를 반드시 남긴다. 관계 테이블은 숫자 ID 단독 join 없이 `source_db + source_table/bo_table + source_id` 계열 복합 키로 연결한다.
7. 통합 SQL을 `scripts/legacy-mariadb/build-work-*.sql`에 작성한다.
8. `npm run legacy:work:*` 명령을 추가한다.
9. 통합 결과를 검증한다: 원본 합계, 고유 키 수, 결과 row 수, 중복 키 0건, 대표 출처 분포.
10. `docs/레거시-DB-전환-방향.md`와 이 TODO에 결정/검증 결과를 기록한다.
11. 관련 파일만 골라 커밋한다. 사용자 작업으로 보이는 다른 변경은 건드리지 않는다.

### 완료

- [x] 로컬 MariaDB dump 복원 환경 구성
- [x] `data/legacy_dumps` gitignore 처리
- [x] 폐기 후보 테이블 삭제
- [x] 추가 폐기 승인 테이블 삭제
- [x] `g5_agency` -> `bnb_legacy_work.agencies` 통합
  - 원본 합계: 245건
  - 고유 `TRIM(subject)`: 78건
  - 통합 결과: 78건
  - 중복 `subject`: 0건
  - 대표 출처: `baewoo=63`, `kidscenter=13`, `bnbuniv=2`, `bnbhighteen=0`
  - 재생성 명령: `npm run legacy:work:agencies`
- [x] 티쳐: `g5_teacher`, `g5_teacher2`, `g5_teacher_file`, `g5_lesson_teacher` 통합
  - `g5_teacher`, `g5_teacher2` 원본 합계: 388건
  - 통합 `teachers`: 205건
  - 중복 `normalized_name`: 0건
  - 공개 상태: `data/teacher-list.md` 포함 85건 `published`, 나머지 120건 `draft`
  - 대표 출처: `baewoo.g5_teacher=24`, `baewoo.g5_teacher2=65`, `bnbuniv.g5_teacher2=56`, `kidscenter.g5_teacher2=25`, `bnbhighteen.g5_teacher2=35`
  - `teacher_files`: 원본/결과 1643건, 연결 1632건, 미연결 11건
  - `teacher_files` 연결 기준: `source_db + bn_id`, `g5_teacher` 우선 후 `g5_teacher2` fallback
  - `teacher_files` 미연결 11건: `bn_id=0` 더미 3건 + `baewoo.bn_id=126` 빈 row 8건
  - `teacher_lessons`: `g5_lesson_teacher` 별도 구성, 결과 322건, 연결 254건, 미연결 68건
  - 센터 기준: 통합 티쳐 리스트 우선 85건, source DB fallback 120건
  - 정렬 기준: 하나의 `display_order`를 전역 순서로 사용하고, 센터 필터는 해당 센터에 없는 강사만 제외
  - 재생성 명령: `npm run legacy:work:teachers`
- [x] 프로필 1차: `g5_write_new_profile` 아트/키즈/하이틴 통합
  - 입력: `baewoo.g5_write_new_profile`, `kidscenter.g5_write_new_profile`, `bnbhighteen.g5_write_new_profile`
  - 제외: 입시 `g5_write_new_profile`, 키즈 `g5_write_new_profile2/3`, 아트 `HIGH-TEEN`, 키즈 `공지`
  - 통합 `profiles`: 1466건
  - 센터 분포: `art=610`, `kids=617`, `highteen=239`
  - 필터 분포: `art/men=305`, `art/women=305`, `highteen/men=132`, `highteen/women=107`, `kids/베이비=22`, `kids/주니어=371`, `kids/시니어=224`
  - 컬럼 정리: `ca_name -> filter`, `wr_subject -> name`, `wr_1 -> height`, `wr_2 -> weight`, `wr_3 -> english_name`
  - 날짜 기준: `created_at`/`published_at`은 원본 `wr_datetime` 우선, 없으면 현재 시각 fallback. `updated_at`은 생성 시각
  - slug 중복: 0건
  - 재생성 명령: `npm run legacy:work:profiles`
- [x] 오디션 스케줄: `g5_write_new_calendar02`, `g5_write_new_calendar` 통합
  - 입력: `baewoo.g5_write_new_calendar02`, `bnbhighteen.g5_write_new_calendar02`, `kidscenter.g5_write_new_calendar`
  - 제외: 입시 `bnbuniv.g5_write_new_calendar02`
  - 결과 테이블: `bnb_legacy_work.audition_schedules`
  - 원본 합계: 5136건
  - 통합 결과: 3782건
  - 중복 기준: 정규화한 제목 + `wr_1` 시작일 + `wr_2` 종료일
  - 센터 저장: 중복 일정은 `centers` JSON 배열로 통합, 원본 출처는 `legacy_meta.sources` 보존
  - 센터 분포: `["art"]=1430`, `["art","highteen"]=1250`, `["kids"]=1015`, `["highteen","kids"]=71`, `["highteen"]=13`, `["art","kids"]=3`
  - 유형 분포: `shooting=3081`, `audition=197`, `schedule=504`
  - 날짜 범위: `2018-12-12` ~ `2026-01-24`
  - dedupe key 중복: 0건
  - 재생성 명령: `npm run legacy:work:audition-schedules`
- [x] 캐스팅 담당자: `g5_write_new_casting*`, `g5_write_new_casting_*` 통합
  - 결과 테이블: `bnb_legacy_work.castings`
  - 지정 인물만 포함: 오재동, 양형서, 신주현, 김건보, 홍진희, 표미희, 이덕화, 김하나, 최길홍, 박소현
  - 통합 결과: 10건
  - 소속 분포: `BNN CASTING=3`, `U CASTING=2`, `IMGround=1`, `BX Model Agency=2`, `라인업=2`
  - 대표 테이블: `g5_write_new_casting=2`, `g5_write_new_casting_enm=3`, `g5_write_new_casting2=2`, `g5_write_new_casting_img=1`, `g5_write_new_casting_bx=2`
  - 중복 기준: `person_name`
  - 센터 저장: 중복 출처의 center를 `centers` JSON 배열로 통합, 원본 출처는 `legacy_meta.sources` 보존
  - slug 중복: 0건
  - 재생성 명령: `npm run legacy:work:castings`
- [x] 입시 합격영상: `bnbuniv.g5_write_new_shoot` 통합
  - 결과 테이블: `bnb_legacy_work.exam_passed_videos`
  - 입시 전용 테이블 규칙: `exam_*` 접두사 사용
  - 통합 결과: 32건
  - 컬럼 정리: `wr_subject -> title`, `wr_content -> body_html`, `wr_2 -> youtube_code`
  - `youtube_url`: `https://www.youtube.com/watch?v={wr_2}`
  - YouTube 코드 중복: 0건
  - slug 중복: 0건
  - 날짜 범위: `2021-01-05 15:31:14` ~ `2026-02-12 10:12:48`
  - 재생성 명령: `npm run legacy:work:exam-passed-videos`
- [x] 입시 수강생 합격후기: `bnbuniv.g5_write_new_hoogi` 통합
  - 결과 테이블: `bnb_legacy_work.exam_passed_reviews`, `bnb_legacy_work.exam_school_logos`
  - 원본: 166건
  - 통합 결과: 165건
  - 학교별 로고: 50건
  - 제외: `wr_subject`에 `합격`이 없는 `스타카드 발급` 1건
  - 컬럼 정리: `wr_subject -> title`, `wr_content -> body_html`
  - 이미지 기준: `g5_board_file`의 `bf_no=0 -> school_logo_url`, `bf_no=1 -> student_image_url`
  - 로고 마스터 연결: 후기 row에 `school_name`, `school_logo_slug` 저장
  - 로고 URL 누락: 0건
  - 학생 이미지 URL 누락: 0건
  - slug 중복: 0건
  - 날짜 범위: `2021-06-08 17:22:08` ~ `2026-02-10 12:53:25`
  - 재생성 명령: `npm run legacy:work:exam-passed-reviews`
- [x] 입시 합격현황: `bnbuniv.g5_write_victory10`, `bnbuniv.g5_write_victory30` 통합
  - 결과 테이블: `bnb_legacy_work.exam_results`
  - 통합 결과: 177건
  - 구분 기준: `g5_write_victory10 -> university`, `g5_write_victory30 -> arts_high_school`
  - 구분별 건수: `university=152`, `arts_high_school=25`
  - 썸네일 기준: `g5_board_file`의 `bf_no=0` 첨부를 우선 사용, 예외만 본문 첫 이미지 URL fallback
  - 썸네일 URL 누락: 0건
  - slug 중복: 0건
  - 날짜 범위: 대학교 `2019-01-10 14:24:00` ~ `2026-01-09 11:22:17`, 예술고등학교 `2022-03-17 09:35:41` ~ `2026-01-09 11:36:51`
  - 재생성 명령: `npm run legacy:work:exam-results`
- [x] 진행중인 캐스팅 출연현황: `g5_write_new_appear` 통합
  - 결과 테이블: `bnb_legacy_work.casting_appearances`
  - 입력: `baewoo.g5_write_new_appear`, `bnbhighteen.g5_write_new_appear`, `kidscenter.g5_write_new_appear`
  - 제외: 입시 `bnbuniv.g5_write_new_appear`
  - 통합 `casting_appearances`: 414건
  - 센터 분포: `art=153`, `highteen=129`, `kids=132`
  - 필드 정리: `wr_1 -> broadcaster`, `wr_2 -> production_company`, `wr_3 -> directors`, `wr_4 -> writers`, `wr_5 -> casting_status`, `wr_6 -> casting_company`
  - 썸네일 기준: `g5_board_file.bo_table=new_appear`, `bf_no=0`
  - 썸네일 URL: 373건
  - slug 중복: 0건
  - 날짜 범위: `2010-08-20 16:39:43` ~ `2026-04-13 13:07:11`
  - 재생성 명령: `npm run legacy:work:casting-appearances`
- [x] `g5_board_file`, `g5_menu`, `g5_menu2`는 통합 대상에서 제외

### 다음 통합 후보

- [ ] 공지/뉴스: `g5_write_new_notice`, `g5_write_notice`, 하이틴 뉴스 계열
- [ ] 프로필/합격자 후속: `g5_write_profile`, `g5_write_portfolio_profile`, `g5_write_qr_profile`, 필요 시 제외한 `g5_write_new_profile*`
- [ ] 캐스팅 후속: `g5_casting`, 필요 시 제외한 `g5_write_new_casting*`
- [ ] 제휴/에이전시 게시판: `g5_write_agency*`
- [ ] 배너: `g5_banner`, `g5_banner2`, `g5_banner_new`
- [ ] 라인업/영상: `g5_write_lineup*`, `g5_write_new_youtube`, `g5_write_new_main_youtube`, `g5_write_wmv`
- [ ] 작품/활동 후속: `g5_write_movie`, `g5_write_new_drama*`, `g5_write_new_direct*`, 필요 시 `g5_write_new_appear2`와 다른 센터의 `g5_write_new_shoot`
- [ ] 후기/스타카드: `g5_write_after`, `g5_write_new_hoogi`, `g5_star`, `g5_write_starcard`, `g5_write_new_starcard`

### 보류 결정 필요

- [ ] `g5_class`, `g5_class2`, `g5_timetable*`, `g5_month_plan`, `g5_plan`은 현재 사이트 범위에 포함할지 결정
- [ ] `g5_write_reservation`, `sm_customer`, `g5_member`는 개인정보 가능성이 있어 공개 콘텐츠 이관에서 제외할지 확정
- [x] 강사 통합 시 Payload의 `center` 복수 기재 방식과 `data/baewoo-curated/exam/teacher.md` 기준이 일치하는지 검증

## 기존 c0 기준 마이그레이션 기록

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
- [x] `scripts/payload-migration/parse.ts` 추가
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
- [x] `scripts/payload-migration/seed-teachers.ts`
- [x] `scripts/payload-migration/seed-agencies.ts`
- [x] Teachers / Agencies dry-run 검증
- [x] Teachers / Agencies 실시드

### Phase 2 — Profiles / Castings / News

- [x] `scripts/payload-migration/seed-profiles.ts`
- [x] `scripts/payload-migration/diff-castings.ts`
- [x] `data/baewoo-curated/c0/castings-diff-report.md`
- [x] Castings 승인 게이트 통과 여부 기록
- [x] `scripts/payload-migration/seed-castings.ts`
- [x] `scripts/payload-migration/seed-news.ts`
- [x] News 대용량 파싱 시간/메모리 기록

### Phase 3 — 신규 컬렉션 12개

- [x] Batch 3A 완료
- [x] Batch 3B 완료
- [x] Batch 3C 완료
- [x] 신규 컬렉션 12개 admin 그룹화 확인

### Phase 4 — 이미지 업로드 및 URL 치환

- [x] `scripts/payload-migration/scan-legacy-urls.ts`
- [ ] `data/baewoo-curated/c0/legacy-urls.json`
- [x] 구조화 이미지 FTP dry-run
- [x] 구조화 이미지 다운로드 및 용량 보고
- [x] 이미지 업로드 매니페스트
- [ ] `scripts/payload-migration/replace-image-paths.ts`
- [ ] 잔존 legacy URL 0건 확인

### Phase 5 — 검증 및 정리

- [ ] `scripts/payload-migration/verify.ts`
- [ ] `data/baewoo-curated/c0/verify-report.md`
- [ ] `p0~p2` 의존 스크립트 제거
- [ ] `data/baewoo-curated/p0`, `p1`, `p2` 제거
- [ ] `data/baewoo-curated/README.md`, `summary.json` 갱신
- [ ] `npm run build`

## 이번 세션에서 바뀐 것

- `Pages` 컬렉션 제거 시작
- `scripts/payload-migration/parse.ts` 추가
- `data/baewoo-curated/c0/SCHEMA.md` 추가
- `src/migrations/20260416_111020_c0_phase0_baseline.ts` 생성
- `scripts/payload-migration/runtime.ts` 추가
- `scripts/payload-migration/snapshot-pre-c0.ts`, `backup-pre-c0.ts`, `export-castings-pre-c0.ts` 추가
- `scripts/payload-migration/seed-teachers.ts`, `scripts/payload-migration/seed-agencies.ts` 추가
- `scripts/payload-migration/seed-profiles.ts`, `scripts/payload-migration/diff-castings.ts`, `scripts/payload-migration/seed-castings.ts`, `scripts/payload-migration/seed-news.ts` 추가
- `src/migrations/20260420_090000_c0_phase1_core_reset.ts` 추가
- `tmp/c0/snapshot-pre-c0.json`, `tmp/c0/castings-pre-c0.json`, `tmp/c0/backup/pre-c0.json` 생성
- `data/baewoo-curated/c0/castings-diff-report.md` 생성
- Neon DB Phase 2 실시드 완료 (`profiles=660`, `news=2908`, `castings=22`)
- Phase 3 Batch 3A 스캐폴딩 추가
  - `video-castings`, `banners`, `teacher-files`, `lineups` 컬렉션 정의
  - `scripts/payload-migration/seed-video-castings.ts`, `seed-banners.ts`, `seed-teacher-files.ts`, `seed-lineups.ts`
  - `src/migrations/20260420_190000_c0_phase3_batch3a.ts` 생성
- Phase 3 Batch 3A dry-run 검증 완료 (`video-castings=71`, `banners=74`, `teacher-files=577`, `lineups=53`)
- Neon DB Phase 3 Batch 3A 적용 완료
  - migration 기록: `20260420_190000_c0_phase3_batch3a`
  - 실제 카운트: `video-castings=71`, `banners=74`, `teacher-files=577`, `lineups=53`
  - slug 중복: `0 / 0 / 0 / 0`
- Phase 3 Batch 3B 스캐폴딩 추가
  - `movies`, `appearances`, `appearances-extra`, `star-cards` 컬렉션 정의
  - `scripts/payload-migration/seed-movies.ts`, `seed-appearances.ts`, `seed-appearances-extra.ts`, `seed-star-cards.ts`
  - `src/migrations/20260420_200000_c0_phase3_batch3b.ts` 생성
- Phase 3 Batch 3B dry-run 검증 완료 (`movies=107`, `appearances=153`, `appearances-extra=38`, `star-cards=35`)
- Neon DB Phase 3 Batch 3B 적용 완료
  - migration 기록: `20260420_200000_c0_phase3_batch3b`
  - 실제 카운트: `movies=107`, `appearances=153`, `appearances-extra=38`, `star-cards=35`
  - slug 중복: `0 / 0 / 0 / 0`
- Phase 3 Batch 3C 스캐폴딩 추가
  - `shoots`, `dramas`, `directings`, `reviews` 컬렉션 정의
  - `scripts/payload-migration/seed-legacy-board.ts`, `seed-shoots.ts`, `seed-dramas.ts`, `seed-directings.ts`, `seed-reviews.ts`
  - `src/migrations/20260420_210000_c0_phase3_batch3c.ts` 생성
- Phase 3 Batch 3C dry-run 검증 완료 (`shoots=804`, `dramas=509`, `directings=442`, `reviews=198`)
- Neon DB Phase 3 Batch 3C 적용 완료
  - migration 기록: `20260420_210000_c0_phase3_batch3c`
  - 실제 카운트: `shoots=804`, `dramas=509`, `directings=442`, `reviews=198`
  - slug 중복: `0 / 0 / 0 / 0`
  - source 중복: `0 / 0 / 0 / 0`
- 진행판을 phase 단위 체크리스트로 재작성

## 다음 작업 우선순위

1. teacher 다운로드 실패 10건 경로 확인
2. teacher 샘플 2명 이미지 치환 dry-run
3. 다운로드 성공 파일만 Vercel Blob 업로드 및 치환 dry-run
4. 필요 시 `news/profiles/castings`의 2020년 이전 데이터 컷오프를 별도 후속 작업으로 분리 검토

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
  - `npm run db:seed:c0-movies:dry-run` → `107`
  - `npm run db:seed:c0-appearances:dry-run` → `153`
  - `npm run db:seed:c0-appearances-extra:dry-run` → `38`
  - `npm run db:seed:c0-star-cards:dry-run` → `35`
  - `npm run db:seed:c0-shoots:dry-run` → `804`
  - `npm run db:seed:c0-dramas:dry-run` → `509`
  - `npm run db:seed:c0-directings:dry-run` → `442`
  - `npm run db:seed:c0-reviews:dry-run` → `198`
  - `npm run db:c0:scan-legacy-urls -- --collection directings --ids 48,50 --output tmp/c0/legacy-urls-directings-sample.json` → 문서 `2`, unique URL `8`, occurrence `8`
  - legacy image HEAD 샘플 확인 → `200 OK`, `Content-Type: image/jpeg`
  - `npm run db:c0:upload-images -- --input tmp/c0/legacy-urls-directings-sample.json --output tmp/c0/blob-manifest-directings-sample.json --prefix c0/directings/sample` → uploaded `8`, failed `0`
  - Blob image HEAD 샘플 확인 → `200 OK`, `Content-Type: image/jpeg`
  - `npm run db:c0:replace-image-paths -- --dry-run --collection directings --ids 48,50 --manifest tmp/c0/blob-manifest-directings-sample.json --output tmp/c0/replace-directings-sample-dry-run.json` → rows `2`, replacements `8`, unused manifest URLs `0`
  - Neon 실시드 후 카운트 검증 → `teachers=109`, `agencies=63`, `agencies_actors=185`, `profiles=660`, `news=2908`, `castings=22`
  - Neon Phase 3 Batch 3B 후 카운트 검증 → `movies=107`, `appearances=153`, `appearances_extra=38`, `star_cards=35`
  - Neon Phase 3 Batch 3C 후 카운트 검증 → `shoots=804`, `dramas=509`, `directings=442`, `reviews=198`
  - `castings` source 분포 → `g5_write_new_casting=5`, `g5_write_new_casting2=4`, `g5_write_new_casting3=5`, `g5_write_new_casting_abio=6`, `g5_write_new_casting_bx=2`
  - `directings` source 분포 → `g5_write_new_direct=138`, `g5_write_new_direct2=51`, `g5_write_new_direct3=105`, `g5_write_new_direct_abio=17`, `g5_write_new_direct_bx=131`
  - slug 중복 검사 → `profiles=0`, `news=0`, `castings=0`, `movies=0`, `appearances=0`, `appearances_extra=0`, `star_cards=0`, `shoots=0`, `dramas=0`, `directings=0`, `reviews=0`
  - source 중복 검사 → `shoots=0`, `dramas=0`, `directings=0`, `reviews=0`
- 참고:
  - 생성된 migration은 `pages`만 drop하는 diff가 아니라, **현재 컬렉션 기준 첫 베이스라인 스냅샷**이다.
  - 신규 컬렉션 12개 admin 그룹/화면 렌더링은 사용자가 수동 확인했다.
  - `.env.local`의 기본 `DATABASE_URL`은 현재 Neon 원격 DB를 가리킨다. Phase 1 destructive migration은 로컬 DB 또는 `ALLOW_DESTRUCTIVE_C0=1` 명시 시에만 통과하도록 막아두었다.
  - `pg_dump`는 로컬 설치 버전(14)과 Neon 서버 버전(17) 불일치로 사용할 수 없어, backup은 `pg` 직접 조회 기반 JSON export(`tmp/c0/backup/pre-c0.json`)로 대체했다.
  - `news.body_html`에는 아직 legacy URL이 남아 있다. 현재 잔존 카운트는 `/data/=2869`, `/web/img/=3`, `http://www.baewoo.co.kr/=810`, `http://baewoobaewoo.cafe24.com/=27`, `https://baewoo.co.kr:443/=1274` 이다.
  - Phase 4 샘플은 `reviews`가 아니라 `directings`의 `id=48`(`리콜라`), `id=50`(`too cool for school`) 2건으로 제한했다.
  - `BLOB_READ_WRITE_TOKEN` 추가 후 `directings` 샘플 이미지 8개를 Vercel Blob에 업로드했다. 실제 DB 본문 치환은 아직 dry-run까지만 진행했다.
  - Phase 4 다운로드 전략은 본문 HTML 이미지는 HTTP, `teachers`/`agencies` 같은 구조화 이미지 필드는 FTP로 분리한다. 구조화 이미지는 `ftp dry-run → 다운로드/용량 보고 → Blob 업로드 → 치환 dry-run` 순서로 진행한다.
  - teacher 이미지 스캔은 `teachers.profile_image_path`, `teachers.photo_image1~6`, `teachers.bio_html`, `teachers_gallery.path` 기준으로 수행했고, 현재 `teachers=338 unique`, `teachers_gallery=713 unique`, 전체 `1051 unique / 1119 occurrences`이다.
  - teacher 샘플 `id=1,2` 이미지 매니페스트 생성 → entries `18`, unique source paths `18`
  - teacher 샘플 FTP dry-run → planned `18`, failed `0`, total `0.99 MiB`
  - teacher 샘플 다운로드 → downloaded `18`, failed `0`, total `0.99 MiB`
  - teacher 샘플 Blob 업로드 → uploaded `18`, failed `0`
  - teacher 샘플 Blob image HEAD 확인 → `200 OK`, `Content-Type: image/png`
  - teacher 전체 매니페스트 생성 → entries `1119`, unique source paths `1051`
  - teacher 전체 FTP 다운로드 → downloaded `1109`, failed `10`, report `tmp/c0/teacher-image-download.json`
  - teacher 전체 로컬 파일 위치 → `tmp/c0/images/teachers/` (`1041` files, `du -sh` 기준 `118M`)
  - 구조화 이미지 Blob 경로 기준은 원본 공개 URL prefix 없이 `teachers/{sourcePath}`로 정리했다. 예: `teachers/1/teacher_img01.png`
  - 사용자가 원하면 `2020년 이전 데이터 제외`는 rollback이 아니라 별도 정리 phase로 다루는 편이 안전하다.
  - `npm run db:migrate`는 현재 Neon 대상에서 Payload의 dev-mode 경고로 중단된다. 메시지는 "If you'd like to run migrations, data loss will occur." 이며, 명시적 승인 없이 진행하지 않았다.
  - 위 dev-mode 경고는 승인 후 진행했고, Neon에는 3A 스키마가 일부 선반영된 상태라 migration을 idempotent하게 수정한 뒤 기록을 정상화했다.
  - 이번 세션의 3B도 dev 서버 동적 반영으로 테이블이 먼저 생성된 상태였고, read-only 확인 후 `20260420_200000_c0_phase3_batch3b` migration 기록을 정상화했다.
  - `appearances` / `appearances_extra`는 초기 스캐폴딩에서 남은 빈 컬럼 `extra_notes`를 `cast_list_label`로 안전하게 rename한 뒤 seed를 진행했다.
