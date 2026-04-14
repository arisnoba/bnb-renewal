# C0 기준 재검토 메모

> 작성일: 2026-04-14
> 목적: `data/baewoo-curated/c0/baewoo-migration-context.md`와 현재 `p0~p2` 기반 구현, 그리고 `profiles` FTP 복원 절차의 차이를 정리하고 다음 계획의 기준을 고정한다.

## 1. 결론

현재 저장소에는 서로 다른 두 개의 마이그레이션 기준이 공존한다.

1. `c0` 기준
   - 커스텀 테이블 10개를 중심으로 새 Payload 모델을 설계한다.
   - 대상은 `g5_teacher`, `g5_teacher2`, `g5_agency`, `g5_class`, `g5_class2`, `g5_plan`, `g5_lesson_teacher`, `g5_teacher_file`, `g5_casting`, `g5_banner`다.
   - 미디어는 최종적으로 Vercel Blob으로 옮기고 DB 경로도 Blob 기준으로 치환하는 계획이다.

2. 현재 구현 기준
   - `p0`, `p1`, `p2`에 선별한 SQL을 입력으로 삼는다.
   - `p0`는 정적 페이지, 강사진, 공지.
   - `p1`은 `g5_write_new_profile`, 캐스팅 게시판, `g5_agency`, `g5_plan`.
   - `profiles` 이미지는 `g5_board_file` + `new_profile` FTP 첨부 구조를 복원해 `public/legacy/profiles/...`에 저장한다.

이 둘은 범위와 전제가 다르다. 따라서 `p0~p2`를 지금 바로 삭제하면 `c0`로 전환되는 것이 아니라, 현재 입력 데이터와 검증 근거만 사라진다.

## 2. 범위 차이

### `c0`가 포함하는 것

- 강사: `g5_teacher`, `g5_teacher2`, `g5_teacher_file`
- 강좌: `g5_class`, `g5_class2`, `g5_plan`, `g5_lesson_teacher`
- 제휴사: `g5_agency`
- 기타: `g5_casting`, `g5_banner`

### 현재 `p0~p2`가 포함하는 것

- `p0`: `g5_content`, `g5_content2`, `g5_teacher`, `g5_teacher2`, `g5_write_new_notice`
- `p1`: `g5_write_new_profile`, 캐스팅 게시판 계열, `g5_agency`, `g5_plan`
- `p2`: 상담/고객 데이터

### 핵심 불일치

- `c0`에는 `g5_write_new_profile`이 없다.
- 반대로 현재 구현된 `profiles` 컬렉션과 FTP 복원은 거의 전부 `g5_write_new_profile`에 묶여 있다.
- `c0`는 `g5_teacher_file`과 `g5_lesson_teacher`를 포함하지만, 현재 선별 SQL과 시드 구현은 이 두 테이블을 아직 직접 다루지 않는다.

## 3. 이미지 전략 차이

### `c0`의 이미지 전략

문서 기준 경로 패턴:

- `/data/g5_agency/{bn_id}/파일명.png`
- `/data/g5_teacher/{bn_id}/파일명.png`
- `/data/g5_class/파일명.png`
- `/web/img/icon_boy.png`
- `/web/img/icon_girl.png`

계획:

- DB 필드값(`bn_bimg`, `it_img*`, `pr_*`)과 HTML 본문 경로를 Blob 기준으로 치환
- 최종 저장소는 Vercel Blob

### 현재 FTP 복원 전략

실제 구현된 흐름:

- 입력 SQL: `data/baewoo-curated/p1/g5_write_new_profile.sql`
- 참조 규칙: `g5_board_file`에서 `bo_table = new_profile`
- 원격 FTP 폴더: `/www/web/data/file/new_profile`
- 로컬 저장 경로: `public/legacy/profiles/<sourceId>/<filename>`
- DB 반영 필드: `profiles.profileImagePath`

### 의미

현재 FTP 복원은 `게시판 첨부파일` 복원이다.
`c0`는 `테이블 컬럼 기반 미디어 치환`이 중심이다.
즉 같은 “이미지 마이그레이션”처럼 보여도 대상 구조가 다르다.

## 4. 배우 리스트가 빠지는 이유

사용자가 말한 “배우들 리스트”는 현재 문맥상 두 가지 가능성이 있다.

1. `g5_write_new_profile`
   - 개별 프로필 게시판
   - 현재 `profiles` 컬렉션과 FTP 복원 대상
   - `c0` 기준 1차 목록에는 없음

2. `g5_agency.wr_1~wr_43`
   - 제휴사별 소속 배우/기수 페어
   - `c0` 문서는 이 구조를 `actors: [{ name, generation }]`로 정규화하자고 적고 있음

즉 `c0`만 따르면 개별 배우 프로필 게시판은 빠질 수 있다.
반면 에이전시 내부의 배우 리스트는 오히려 `c0`에서 더 명시적으로 다룬다.

## 5. 현재 코드 의존성

`p0~p2` 삭제가 바로 어려운 이유는 아래 코드가 직접 해당 경로를 읽기 때문이다.

- [scripts/seed-p0.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/seed-p0.ts:1)
- [scripts/seed-p1.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/seed-p1.ts:1)
- [scripts/profile-images.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/profile-images.ts:1)
- [docs/프로필-이미지-FTP-수집-가이드.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/프로필-이미지-FTP-수집-가이드.md:1)
- [data/baewoo-curated/summary.json](/Users/arisnoba/Documents/GitHub/bnb-renewal/data/baewoo-curated/summary.json:1)

즉 `p0~p2`는 단순 참고 폴더가 아니라 현재 구현의 입력 소스다.

## 6. 권장 재계획

### Phase 1. 기준 확정

- `c0`를 새 source of truth 문서로 채택한다.
- 다만 `c0`는 계획 문서일 뿐, 실제 SQL 입력 세트는 아니다.
- 따라서 `c0` 대상 테이블만 다시 추려 `data/baewoo-curated/c0/sql` 같은 실제 입력 세트를 만들어야 한다.

### Phase 2. 범위 재선언

- 1차 범위를 `teacher`, `agency`, `class`, `casting`, `banner`로 둘지 확정한다.
- `g5_write_new_profile`은 별도 phase로 분리할지 결정한다.
- 배우 리스트 요구가 강하면 `g5_write_new_profile`를 완전히 버리는 대신 “Phase B: 프로필 게시판 복원”으로 분리한다.

### Phase 3. 이미지 전략 분리

- `c0` 1차 범위용 이미지 수집:
  - `/data/g5_teacher`
  - `/data/g5_agency`
  - `/data/g5_class`
  - `/web/img`
- 별도 phase:
  - `/data/file/new_profile`
  - 현재 구현한 FTP fallback 절차 재사용 가능

### Phase 4. 삭제

아래가 준비된 뒤에만 `p0~p2`를 삭제한다.

- `c0` 기반 실제 SQL 입력 세트 완료
- `p0~p2` 경로를 읽는 스크립트 정리 완료
- 필요 데이터(`profiles` 포함 여부) 최종 확정

## 7. 지금 시점의 판단

현재 시점에서 맞는 행동은 `p0~p2` 즉시 삭제가 아니다.

먼저 해야 할 일:

1. `c0` 기준 실제 대상 테이블을 확정한다.
2. `g5_write_new_profile`를 1차 범위에서 제외할지 결정한다.
3. `c0` 대상 SQL 입력 세트를 새로 만든다.
4. 그 뒤 기존 `p0~p2` 스크립트와 문서를 걷어낸다.

즉 순서는 `비교 -> 기준 확정 -> 입력 재구성 -> 코드 전환 -> 삭제`가 맞다.
