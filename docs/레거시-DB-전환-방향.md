# 레거시 DB 전환 방향

## 결정

레거시 데이터 이관의 정본은 `data/legacy_dumps`의 센터별 MariaDB 원본 dump로 둔다.

기존 `data/baewoo-split`, `data/baewoo-curated/c0`, `p0`, `p1`, `p2`는 과거 단일 dump 기반 작업 산출물이다. 현재 시드 스크립트가 아직 직접 참조하므로 즉시 삭제하지 않지만, 새 작업의 기준 입력으로 확장하지 않는다.

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

## 이관 방식

1. 원본 dump는 수정하지 않는다.
2. MariaDB에서 필요한 테이블을 조회해 센터 출처가 포함된 staging 데이터를 만든다.
3. staging 결과를 로컬 Postgres/Payload 구조에 적재한다.
4. 로컬에서 카운트, slug, 이미지 경로, 센터 매핑을 검증한다.
5. 검증된 Postgres 결과만 원격 Neon에 반영한다.

## 삭제 원칙

아래 조건을 만족하기 전까지 `baewoo-split`, `baewoo-curated/c0`, `p0`, `p1`, `p2`는 삭제하지 않는다.

- 새 MariaDB 기반 추출 스크립트가 기존 시드 대상 컬렉션을 대체한다.
- `package.json`에서 구 `db:seed:p0-*`, `db:seed:p1-*`, 구 `db:seed:c0-*` 명령이 제거되거나 새 명령으로 교체된다.
- README와 관련 문서에서 구 경로 참조가 정리된다.
- 프론트 테스트 페이지와 검증 스크립트에서 주요 컬렉션 카운트가 확인된다.

삭제 후에도 원본 SQL은 `data/legacy_dumps`에 보존한다.
