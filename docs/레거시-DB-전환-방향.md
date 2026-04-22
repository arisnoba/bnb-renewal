# 레거시 DB 전환 방향

## 결정

레거시 데이터 이관의 정본은 `data/legacy_dumps`의 센터별 MariaDB 원본 dump로 둔다.

기존 `data/baewoo-curated/c0`, `p0`, `p1`, `p2`는 과거 단일 dump 기반 작업 산출물이었다. 현재는 MariaDB work table 방식으로 대체했고, 보존할 문서성 자료만 `docs/archive/`로 이동했다.

## 로컬 기준 환경

- 레거시 원본 DB: Docker Compose의 `legacy-mariadb`
- 타깃 CMS DB: Docker Compose의 `postgres`
- 원격 운영 후보: Vercel Neon 호환 Postgres

레거시 dump는 먼저 로컬 MariaDB에 센터별 DB로 복원한다.

- `baewoo.sql` -> `baewoo`
- `bnbuniv.sql` -> `bnbuniv`
- `kidscenter.sql` -> `kidscenter`
- `bnbhighteen.sql` -> `bnbhighteen`

복원 명령은 아래를 기준으로 한다.

```bash
npm run legacy:db:up
npm run legacy:db:import
npm run legacy:db:verify
```

기존 로컬 복원본을 폐기하고 다시 넣을 때만 `npm run legacy:db:import:reset`을 사용한다.

## 작업 DB

센터별 원본 테이블을 직접 수정해 최종 구조로 바꾸지 않고, 통합/정리 결과는 `bnb_legacy_work` DB에 만든다. 테이블명은 임시 이름이나 `_unified` 접미사 대신 최종 컬렉션 구조에 가까운 이름을 사용한다.

### `g5_agency` 통합

`g5_agency`는 4개 센터 DB에 같은 성격으로 존재하지만 본문과 세부 필드가 완전히 같지는 않다. 따라서 `subject`를 기준으로 중복을 제거하고, 선택되지 않은 출처는 `legacy_meta.sources`에 보존한다.

- 결과 테이블: `bnb_legacy_work.agencies`
- 재생성 명령: `npm run legacy:work:agencies`
- 중복 기준: `TRIM(subject)`
- 대표 데이터 우선순위: `baewoo` -> `kidscenter` -> `bnbuniv` -> `bnbhighteen`
- 보존 출처: 대표 row의 `source_db`, `source_table`, `source_id`, 전체 출처 배열 `legacy_meta.sources`
- 배우/기수 정보: `wr_1~wr_43`, `pr_1~pr_9`를 `actors` JSON으로 정규화
- 검증일: 2026-04-21
- 검증 결과: 원본 합계 245건, 고유 `subject` 78건, 통합 결과 78건, 중복 `subject` 0건

### `g5_teacher` 계열 통합

`g5_teacher`와 `g5_teacher2`는 4개 센터 DB에 중복 노출된 row가 많다. `g5_teacher`는 4개 센터에 동일한 레거시 데이터가 반복되는 성격이 강하므로, source DB 존재만으로 센터를 확정하지 않고 기존 센터별 강사 확인 목록을 우선 적용한다.

- 결과 테이블: `bnb_legacy_work.teachers`, `bnb_legacy_work.teacher_files`, `bnb_legacy_work.teacher_lessons`
- 재생성 명령: `npm run legacy:work:teachers`
- `teachers` 입력: `g5_teacher`, `g5_teacher2`
- `teacher_files` 입력: `g5_teacher_file`
- `teacher_lessons` 입력: `g5_lesson_teacher`
- 중복 기준: 정규화한 강사명
- 대표 데이터 기준: 본문/요약/대표 이미지/추가 이미지 보유량을 점수화해 가장 완성도 높은 row 선택
- 센터 기준: `data/teacher-list.md`에서 정리한 공개 강사 목록 우선, 목록에 없는 강사는 source DB center fallback
- 공개 상태 기준: `data/teacher-list.md` 목록에 있는 강사만 `published`, 나머지는 `draft`
- `bnbuniv.g5_teacher2` 예외: `name`에 학교/학과명이 들어가고 `subject`에 `[역할] 이름`이 들어가므로, 이 경우 `subject`에서 역할과 강사명을 추출한다.
- `g5_teacher_file` 연결: `bn_id` 단독이 아니라 `source_db + bn_id`로 판단한다. 같은 source DB에서 `g5_teacher`와 `g5_teacher2`가 모두 같은 `bn_id`를 가지면 대표작은 `g5_teacher`에 우선 연결하고, 없을 때 `g5_teacher2`로 fallback한다.
- `g5_lesson_teacher`: 강좌/커리큘럼 성격이므로 강사 본체나 대표작에 섞지 않고 별도 `teacher_lessons` 테이블로 보존한다.
- 검증일: 2026-04-22
- 검증 결과: teacher 원본 388건, 통합 `teachers` 205건, 중복 강사명 0건, `published` 85건, `draft` 120건, `teacher_files` 1643건 중 1632건 연결, `teacher_lessons` 322건 중 254건 연결
- 노출 순서 기준: `data/teacher-list.md`를 통합 공개 대상/정렬 기준으로 사용한다. `display_order`는 하나의 전역 순서이며, 센터 필터는 해당 센터에 없는 강사만 제외하고 남은 상대 순서를 유지한다.
- `teacher_files` 미연결 11건은 빈 파일 row다. `bn_id=0` 더미 3건과 `baewoo.bn_id=126`의 제목/파일 경로 없는 8건이다.

### `g5_write_new_profile` 1차 통합

`g5_write_new_profile`은 4개 센터 DB에 모두 있지만 현재 사용 범위는 아트센터, 키즈센터, 하이틴센터로 제한한다. 입시센터의 같은 이름 테이블은 이번 work table에서 제외한다.

- 결과 테이블: `bnb_legacy_work.profiles`
- 재생성 명령: `npm run legacy:work:profiles`
- 입력 테이블: `baewoo.g5_write_new_profile`, `kidscenter.g5_write_new_profile`, `bnbhighteen.g5_write_new_profile`
- 제외 테이블: `bnbuniv.g5_write_new_profile`, `kidscenter.g5_write_new_profile2`, `kidscenter.g5_write_new_profile3`
- 제외 row: 댓글 row, 아트 `HIGH-TEEN`, 키즈 `공지`
- 센터 기준: `baewoo` -> `art`, `kidscenter` -> `kids`, `bnbhighteen` -> `highteen`
- 필드명 정리: `ca_name` -> `filter`, `wr_subject` -> `name`, `wr_1` -> `height`, `wr_2` -> `weight`, `wr_3` -> `english_name`
- `filter` 값 정리: 아트/하이틴 `MEN/WOMEN` -> `men/women`, 키즈 `베이비키즈/쥬니어키즈/시니어키즈` -> `베이비/주니어/시니어`
- 날짜 기준: `created_at`과 `published_at`은 원본 `wr_datetime` 우선, 없거나 잘못된 값이면 현재 시각 fallback. `updated_at`은 work table 생성 시각을 사용한다.
- 검증일: 2026-04-22
- 검증 결과: 통합 `profiles` 1466건, slug 중복 0건, 빈 이름 0건, 아트 610건, 키즈 617건, 하이틴 239건
- 필터 분포: `art/men=305`, `art/women=305`, `highteen/men=132`, `highteen/women=107`, `kids/베이비=22`, `kids/주니어=371`, `kids/시니어=224`

### 오디션 스케줄 통합

촬영/오디션 일정 게시판은 센터별 원본 테이블명이 다르므로 콘텐츠 이름에 맞춘 work table `audition_schedules`로 통합한다. 입시센터에도 `g5_write_new_calendar02`가 있지만 현재 사용하지 않는 콘텐츠로 보고 제외한다.

- 결과 테이블: `bnb_legacy_work.audition_schedules`
- 재생성 명령: `npm run legacy:work:audition-schedules`
- 입력 테이블: `baewoo.g5_write_new_calendar02`, `bnbhighteen.g5_write_new_calendar02`, `kidscenter.g5_write_new_calendar`
- 제외 테이블: `bnbuniv.g5_write_new_calendar02`
- 센터 기준: `baewoo` -> `art`, `bnbhighteen` -> `highteen`, `kidscenter` -> `kids`
- 중복 기준: 정규화한 제목 + `wr_1` 시작일 + `wr_2` 종료일
- 날짜 기준: `wr_1` -> `schedule_start_date`, `wr_2` -> `schedule_end_date`, 둘 다 `YYYYMMDD` 형식이다.
- 중복 일정의 센터는 `centers` JSON 배열로 합치고, 원본 출처는 `legacy_meta.sources`에 보존한다.
- 유형 기준: 제목/본문에 `오디션` 포함 시 `audition`, `촬영` 포함 시 `shooting`, 나머지는 `schedule`
- 검증일: 2026-04-22
- 검증 결과: 원본 5136건, 통합 `audition_schedules` 3782건, dedupe key 중복 0건, slug 중복 0건
- 센터 분포: `["art"]=1430`, `["art","highteen"]=1250`, `["kids"]=1015`, `["highteen","kids"]=71`, `["highteen"]=13`, `["art","kids"]=3`
- 유형 분포: `shooting=3081`, `audition=197`, `schedule=504`

### 캐스팅 담당자 통합

`g5_write_new_casting*` 계열은 센터별 중복이 많고, 실제 공개 대상은 지정한 담당자만 사용한다. 따라서 전체 row를 그대로 옮기지 않고 지정 인물 10명만 `castings`로 통합한다.

- 결과 테이블: `bnb_legacy_work.castings`
- 재생성 명령: `npm run legacy:work:castings`
- 입력 테이블: `g5_write_new_casting*`, `g5_write_new_casting_*`
- 필터 기준: `wr_subject`가 지정 인물명과 일치하는 row만 포함
- 소속 기준:
  - `BNN CASTING`: 오재동, 양형서, 신주현
  - `U CASTING`: 김건보, 홍진희
  - `IMGround`: 표미희
  - `BX Model Agency`: 이덕화, 김하나
  - `라인업`: 최길홍, 박소현
- 대표 row 기준: 소속에 맞는 테이블 우선. BNN은 `g5_write_new_casting_enm`, U는 `g5_write_new_casting2`, IMGround는 `g5_write_new_casting_img`, BX는 `g5_write_new_casting_bx`, 라인업은 `g5_write_new_casting`
- 센터 기준: 중복 출처의 센터를 `centers` JSON 배열로 합치고, 전체 원본 출처는 `legacy_meta.sources`에 보존한다.
- 날짜 기준: `created_at`과 `published_at`은 원본 `wr_datetime` 우선, 없으면 현재 시각 fallback. `updated_at`은 work table 생성 시각을 사용한다.
- 검증일: 2026-04-22
- 검증 결과: 통합 `castings` 10건, 지정 인물 10명 모두 포함, slug 중복 0건
- 소속 분포: `BNN CASTING=3`, `U CASTING=2`, `IMGround=1`, `BX Model Agency=2`, `라인업=2`
- 대표 테이블 분포: `g5_write_new_casting=2`, `g5_write_new_casting_enm=3`, `g5_write_new_casting2=2`, `g5_write_new_casting_img=1`, `g5_write_new_casting_bx=2`

### 입시 합격영상 통합

입시센터 전용 콘텐츠는 `exam_*` 접두사를 사용한다. `g5_write_new_shoot`은 다른 센터에도 있지만, 입시센터에서는 수강생 합격영상 콘텐츠이므로 `exam_passed_videos`로 분리한다.

- 결과 테이블: `bnb_legacy_work.exam_passed_videos`
- 재생성 명령: `npm run legacy:work:exam-passed-videos`
- 입력 테이블: `bnbuniv.g5_write_new_shoot`
- 제외 테이블: 다른 센터의 `g5_write_new_shoot`
- 필드 기준: `wr_subject` -> `title`, `wr_content` -> `body_html`, `wr_2` -> `youtube_code`
- YouTube URL: `https://www.youtube.com/watch?v={wr_2}` 형식으로 `youtube_url` 생성
- 날짜 기준: `created_at`과 `published_at`은 원본 `wr_datetime` 우선, 없으면 현재 시각 fallback. `updated_at`은 work table 생성 시각을 사용한다.
- 검증일: 2026-04-22
- 검증 결과: 통합 `exam_passed_videos` 32건, YouTube 코드 중복 0건, slug 중복 0건
- 날짜 범위: `2021-01-05 15:31:14` ~ `2026-02-12 10:12:48`

### 입시 수강생 합격후기 통합

입시센터의 `g5_write_new_hoogi`는 수강생 합격후기 콘텐츠이므로 `exam_passed_reviews`로 분리한다. 같은 테이블에 섞인 `스타카드 발급` 1건은 합격후기가 아니므로 제외한다.

- 결과 테이블: `bnb_legacy_work.exam_passed_reviews`, `bnb_legacy_work.exam_school_logos`
- 재생성 명령: `npm run legacy:work:exam-passed-reviews`
- 입력 테이블: `bnbuniv.g5_write_new_hoogi`
- 제외 row: `wr_subject`에 `합격`이 없는 1건, `스타카드 발급`
- 필드 기준: `wr_subject` -> `title`, `wr_content` -> `body_html`
- 센터 기준: 입시센터 전용 콘텐츠이므로 `center=exam`으로 저장한다.
- 이미지 기준: `bnbuniv.g5_board_file`의 `bo_table=new_hoogi`, `wr_id` 기준으로 `bf_no=0`은 학교 로고, `bf_no=1`은 학생 이미지로 저장한다.
- 학교 로고 기준: `bf_no=0`의 원본 파일명과 후기 제목을 기준으로 학교명을 매핑해 `exam_school_logos`에 학교별 1건으로 dedupe한다. 후기 row에는 `school_name`, `school_logo_slug`를 함께 저장한다.
- 이미지 URL: `https://www.baewoo.kr:443/web/data/file/new_hoogi/{bf_file}` 형식으로 생성한다.
- 날짜 기준: `created_at`과 `published_at`은 원본 `wr_datetime` 우선, 없으면 현재 시각 fallback. `updated_at`은 work table 생성 시각을 사용한다.
- 검증일: 2026-04-22
- 검증 결과: 원본 166건, 통합 `exam_passed_reviews` 165건, `exam_school_logos` 50건, 제외 1건, 로고 URL 누락 0건, 학생 이미지 URL 누락 0건, slug 중복 0건
- 날짜 범위: `2021-06-08 17:22:08` ~ `2026-02-10 12:53:25`

### 입시 합격현황 통합

입시센터의 대학교/예술고등학교 합격현황은 같은 성격의 콘텐츠이므로 짧고 명확한 work table `exam_results`로 통합한다. 구분은 `result_type`으로 저장한다.

- 결과 테이블: `bnb_legacy_work.exam_results`
- 재생성 명령: `npm run legacy:work:exam-results`
- 입력 테이블: `bnbuniv.g5_write_victory10`, `bnbuniv.g5_write_victory30`
- 구분 기준: `g5_write_victory10 -> university`, `g5_write_victory30 -> arts_high_school`
- 센터 기준: 입시센터 전용 콘텐츠이므로 `center=exam`으로 저장한다.
- 썸네일 기준: `bnbuniv.g5_board_file`의 `bo_table=victory10/victory30`, `wr_id`, `bf_no=0` 첨부를 우선 사용한다. 첨부가 없는 예외는 본문 첫 이미지 URL을 fallback으로 사용한다.
- 썸네일 URL: 첨부 기반은 `https://www.baewoo.kr:443/web/data/file/{bo_table}/{bf_file}` 형식으로 생성한다.
- 날짜 기준: `created_at`과 `published_at`은 원본 `wr_datetime` 우선, 없으면 현재 시각 fallback. `updated_at`은 work table 생성 시각을 사용한다.
- 검증일: 2026-04-22
- 검증 결과: 통합 `exam_results` 177건, `university=152`, `arts_high_school=25`, 썸네일 URL 누락 0건, slug 중복 0건
- 날짜 범위: 대학교 `2019-01-10 14:24:00` ~ `2026-01-09 11:22:17`, 예술고등학교 `2022-03-17 09:35:41` ~ `2026-01-09 11:36:51`

## 이관 방식

1. 원본 dump는 수정하지 않는다.
2. MariaDB에서 필요한 테이블을 조회해 센터 출처가 포함된 staging 데이터를 만든다.
3. staging 결과를 로컬 Postgres/Payload 구조에 적재한다.
4. 로컬에서 카운트, slug, 이미지 경로, 센터 매핑을 검증한다.
5. 검증된 Postgres 결과만 원격 Neon에 반영한다.

## 삭제 원칙

정적 SQL 선별본 삭제 조건은 2026-04-22 기준 충족했다.

- 새 MariaDB 기반 추출 스크립트가 기존 시드 대상 컬렉션을 대체했다.
- `package.json`에서 구 `db:seed:p0-*`, `db:seed:p1-*`, 구 `db:seed:c0-*` 명령을 제거했다.
- README와 활성 문서에서 구 경로 참조를 정리했다.
- 프론트 테스트 페이지에서 주요 MariaDB work table을 직접 확인한다.

삭제 후에도 원본 SQL은 `data/legacy_dumps`에 보존한다.
