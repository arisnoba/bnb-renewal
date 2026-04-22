# C0 SQL 스키마 기준서

> 작성일: 2026-04-16  
> 보존 위치: `docs/archive/c0-schema.md`  
> 원래 기준 경로: `data/baewoo-curated/c0/*.sql`  
> 생성 기준: `CREATE TABLE` 헤더와 실제 `INSERT INTO` 대상 테이블을 함께 확인  
> 참고 파서: `scripts/c0/parse.ts` (제거됨)

## 요약

- SQL 파일 수: 23
- 처리 대상: 18
- 제외 대상: 5 (`g5_class`, `g5_class2`, `g5_lesson_teacher`, `g5_plan`, `g5_write_notice`)
- 파일명과 내부 테이블명이 불일치하는 파일:
  - `g5_write_new_casting_all.sql`
  - `g5_write_new_direct_all.sql`

## 파일 인벤토리

| SQL | CREATE TABLE | INSERT 대상 | INSERT 수 | 컬럼 수 | 분류 |
|---|---|---|---:|---:|---|
| `g5_agency.sql` | `g5_agency` | `g5_agency` | 63 | 84 | 재시드 / `Agencies` |
| `g5_banner.sql` | `g5_banner` | `g5_banner` | 74 | 12 | 신규 / `banners` |
| `g5_casting.sql` | `g5_casting` | `g5_casting` | 71 | 14 | 신규 / `video-castings` |
| `g5_class.sql` | `g5_class` | `g5_class` | 47 | 68 | 제외 / 강좌 |
| `g5_class2.sql` | `g5_class2` | `g5_class2` | 42 | 28 | 제외 / 강좌 |
| `g5_lesson_teacher.sql` | `g5_lesson_teacher` | `g5_lesson_teacher` | 322 | 6 | 제외 / 강좌 |
| `g5_plan.sql` | `g5_plan` | `g5_plan` | 177 | 30 | 제외 / 강좌 |
| `g5_teacher.sql` | `g5_teacher` | `g5_teacher` | 37 | 41 | 재시드 / `Teachers` |
| `g5_teacher2.sql` | `g5_teacher2` | `g5_teacher2` | 72 | 48 | 재시드 / `Teachers` |
| `g5_teacher_file.sql` | `g5_teacher_file` | `g5_teacher_file` | 577 | 6 | 신규 / `teacher-files` |
| `g5_write_lineup.sql` | `g5_write_lineup` | `g5_write_lineup` | 53 | 39 | 신규 / `lineups` |
| `g5_write_movie.sql` | `g5_write_movie` | `g5_write_movie` | 107 | 39 | 신규 / `movies` |
| `g5_write_new_appear.sql` | `g5_write_new_appear` | `g5_write_new_appear` | 153 | 40 | 신규 / `appearances` |
| `g5_write_new_appear2.sql` | `g5_write_new_appear2` | `g5_write_new_appear2` | 38 | 40 | 신규 / `appearances-extra` |
| `g5_write_new_casting_all.sql` | `g5_write_new_casting` | `g5_write_new_casting`, `g5_write_new_casting2`, `g5_write_new_casting3`, `g5_write_new_casting_abio`, `g5_write_new_casting_bx` | 22 | 40 | 재구성 / `Castings` |
| `g5_write_new_direct_all.sql` | `g5_write_new_direct` | `g5_write_new_direct`, `g5_write_new_direct2`, `g5_write_new_direct3`, `g5_write_new_direct_abio`, `g5_write_new_direct_bx` | 442 | 40 | 신규 / `directings` |
| `g5_write_new_drama.sql` | `g5_write_new_drama` | `g5_write_new_drama` | 509 | 62 | 신규 / `dramas` |
| `g5_write_new_hoogi.sql` | `g5_write_new_hoogi` | `g5_write_new_hoogi` | 198 | 40 | 신규 / `reviews` |
| `g5_write_new_notice.sql` | `g5_write_new_notice` | `g5_write_new_notice` | 2908 | 40 | 재시드 / `News` |
| `g5_write_new_profile.sql` | `g5_write_new_profile` | `g5_write_new_profile` | 660 | 39 | 재시드 / `Profiles` |
| `g5_write_new_shoot.sql` | `g5_write_new_shoot` | `g5_write_new_shoot` | 804 | 40 | 신규 / `shoots` |
| `g5_write_new_starcard.sql` | `g5_write_new_starcard` | `g5_write_new_starcard` | 35 | 40 | 신규 / `star-cards` |
| `g5_write_notice.sql` | `g5_write_notice` | `g5_write_notice` | 57 | 39 | 제외 / 구공지 |

## 공통 게시판 스키마 패밀리

### Family A, 39컬럼 게시판

대상 파일:

- `g5_write_lineup.sql`
- `g5_write_movie.sql`
- `g5_write_new_profile.sql`
- `g5_write_notice.sql`

공통 컬럼:

```text
wr_id, wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
ca_name, wr_option, wr_subject, wr_content, wr_link1, wr_link2,
wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood,
mb_id, wr_password, wr_name, wr_email, wr_homepage, wr_datetime,
wr_file, wr_last, wr_ip, wr_facebook_user, wr_twitter_user,
wr_1, wr_2, wr_3, wr_4, wr_5, wr_6, wr_7, wr_8, wr_9, wr_10
```

메모:

- `wr_content` 타입
  - `g5_write_lineup`: `longtext`
  - `g5_write_movie`: `text`
  - `g5_write_new_profile`: `text`
  - `g5_write_notice`: `longtext`
- `public` 컬럼이 없다.
- `Profiles`는 이 family를 그대로 쓰되, 현재 컬렉션 필드로는 `wr_subject`, `wr_content`, `ca_name`, `wr_datetime` 위주로 매핑하면 된다.

### Family B, 40컬럼 게시판 (`public` 추가)

대상 파일:

- `g5_write_new_appear.sql`
- `g5_write_new_appear2.sql`
- `g5_write_new_casting_all.sql`
- `g5_write_new_direct_all.sql`
- `g5_write_new_hoogi.sql`
- `g5_write_new_notice.sql`
- `g5_write_new_shoot.sql`
- `g5_write_new_starcard.sql`

공통 컬럼:

```text
wr_id, wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
ca_name, wr_option, wr_subject, wr_content, wr_link1, wr_link2,
wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood,
mb_id, wr_password, wr_name, wr_email, wr_homepage, wr_datetime,
wr_file, wr_last, wr_ip, wr_facebook_user, wr_twitter_user,
wr_1, wr_2, wr_3, wr_4, wr_5, wr_6, wr_7, wr_8, wr_9, wr_10,
public
```

메모:

- `public`은 공개 여부로 보이며 현재 `News`, `Castings` 구현이 이미 같은 해석을 사용한다.
- `wr_content` 타입
  - `text`: `g5_write_new_casting_all`, `g5_write_new_direct_all`, `g5_write_new_notice`, `g5_write_new_shoot`, `g5_write_new_starcard`
  - `longtext`: `g5_write_new_appear`, `g5_write_new_appear2`, `g5_write_new_hoogi`
- `wr_7~wr_10`이 `text`로 확장된 경우:
  - `g5_write_new_appear`
  - `g5_write_new_appear2`

### Family C, 62컬럼 게시판 (`drama` 확장형)

대상 파일:

- `g5_write_new_drama.sql`

기준 컬럼:

- Family B 전체
- 추가 컬럼: `wr_11` ~ `wr_32`

메모:

- `drama`는 Family B의 확장형으로 보면 된다.
- Phase 3에서 1:1 컬렉션으로 만들 때 `wr_11~wr_32`를 먼저 `legacyMeta`에 보존하고, 노출 필드 분리는 이후 검토가 안전하다.

## 구조화 테이블

### `g5_agency`

컬럼 수: 84

핵심 컬럼:

```text
bn_id, name, subject,
wr_1 ~ wr_43,
summary, message, piece,
pr_1 ~ pr_9,
bn_bimg,
it_img1 ~ it_img8,
it_img_title1 ~ it_img_title8,
it_img_desc1 ~ it_img_desc8,
bn_order
```

해석:

- `wr_1~wr_43`: 배우 이름/기수 페어
- `pr_1~pr_9`: 프로필/아이콘 경로
- `bn_bimg`: 대표 이미지 경로
- `it_img*`: 추가 갤러리

### `g5_banner`

컬럼 수: 12

```text
bn_id, bn_alt, bn_url, bn_device, bn_position,
bn_border, bn_new_win,
bn_begin_time, bn_end_time, bn_time,
bn_hit, bn_order
```

해석:

- 기간, 위치, 디바이스 중심 관리 테이블
- 별도 이미지 경로 컬럼은 없다

### `g5_casting`

컬럼 수: 14

```text
bn_id, subject, youtube, message,
pr_1 ~ pr_9,
bn_order
```

해석:

- 영상 캐스팅 전용
- `youtube`와 `message`가 핵심

### `g5_class`

컬럼 수: 68

```text
wr_id, wr_subject, wr_subject2, wr_count2, category, wr_view,
wr_date, wr_count, wr_time,
it_img1 ~ it_img10,
wr_1 ~ wr_7,
wr_content, regDate, updateDate, wr_sort,
wr_jang, wr_bujang,
curr_title01, curr_title02,
curr_subject1, curr_content1, curr_subject2, curr_content2,
wr_9 ~ wr_38
```

해석:

- 강좌 본체
- 커리큘럼과 강사, 다수 이미지/보조 필드가 섞여 있어 이번 범위 제외가 맞다

### `g5_class2`

컬럼 수: 28

```text
wr_id, wr_subject, category, wr_view, wr_date, wr_count, wr_time,
it_img1 ~ it_img10,
wr_1 ~ wr_7,
wr_content, regDate, updateDate, wr_sort
```

해석:

- `g5_class` 경량형
- 커리큘럼/강사 세부 필드가 빠져 있다

### `g5_lesson_teacher`

컬럼 수: 6

```text
lt_idx, lt_category, lt_name, lt_subject, lt_title, lt_content
```

해석:

- 강좌-강사 연결 보조 테이블

### `g5_plan`

컬럼 수: 30

```text
bn_id, category, subject, teacher, s_teacher, period,
ps_1 ~ ps_10,
pc_1 ~ pc_10,
notice_title, notice_cont,
is_view, regdate
```

해석:

- 주차별 계획 테이블
- `ps_*`, `pc_*` 쌍 구조

### `g5_teacher`

컬럼 수: 41

```text
bn_id, name, subject, summary, message, piece,
pr_1 ~ pr_9,
bn_bimg,
it_img1 ~ it_img8,
it_img_title1 ~ it_img_title8,
it_img_desc1 ~ it_img_desc8,
bn_order
```

### `g5_teacher2`

컬럼 수: 48

`g5_teacher` 기준 추가 컬럼:

```text
photo_img1 ~ photo_img6,
it_img_sort
```

해석:

- `Teachers` 통합 유지 시 `photo_img1~6` 수용이 필요하다
- `it_img_sort` 처리 방식은 아직 미정, 우선 `legacyMeta` 보존이 안전하다

### `g5_teacher_file`

컬럼 수: 6

```text
wr_id, wr_file, wr_subject, wr_desc, bn_id, wr_sort
```

해석:

- `bn_id` 기준으로 `Teachers`와 연결 가능
- 별도 컬렉션으로 두는 게 초기 구현은 단순하다

## 파일명/테이블명 불일치 메모

### `g5_write_new_casting_all.sql`

- 파일명: `g5_write_new_casting_all.sql`
- `CREATE TABLE`: `g5_write_new_casting`
- 실제 `INSERT INTO` 대상:
  - `g5_write_new_casting`
  - `g5_write_new_casting2`
  - `g5_write_new_casting3`
  - `g5_write_new_casting_abio`
  - `g5_write_new_casting_bx`

결론:

- 파서는 파일명이 아니라 실제 `INSERT INTO` 대상을 신뢰해야 한다
- Phase 2의 diff 리포트는 이 5개 source 분리를 유지해야 한다

### `g5_write_new_direct_all.sql`

- 파일명: `g5_write_new_direct_all.sql`
- `CREATE TABLE`: `g5_write_new_direct`
- 실제 `INSERT INTO` 대상:
  - `g5_write_new_direct`
  - `g5_write_new_direct2`
  - `g5_write_new_direct3`
  - `g5_write_new_direct_abio`
  - `g5_write_new_direct_bx`

결론:

- `directings`도 `Castings`와 같은 방식으로 source 분리를 유지하는 쪽이 안전하다

## Phase 0 매핑 결론

- Pages 제거는 확정
- 다음 phase에서 바로 필요한 입력:
  - `Teachers`: `g5_teacher`, `g5_teacher2`
  - `Agencies`: `g5_agency`
  - `Profiles`: `g5_write_new_profile`
  - `News`: `g5_write_new_notice`
  - `Castings`: `g5_write_new_casting_all.sql` 내부 5 source
- 신규 컬렉션 후보 12개는 모두 1:1 시작이 가능하다
- 강좌 4개 테이블은 이번 phase 범위 밖으로 두는 게 맞다
