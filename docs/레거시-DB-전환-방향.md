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
