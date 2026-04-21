# data 디렉터리 안내

이 디렉터리는 레거시 사이트 DB 검토와 단계별 마이그레이션 작업을 위한 산출물을 보관한다.

## 구성

- `legacy_dumps/`
  - 센터별 원본 MariaDB 전체 덤프 보관 위치다.
  - SQL dump 본문은 로컬 보관 전용이며 Git에는 포함하지 않는다.
  - 현재 기대 파일은 `baewoo.sql`, `bnbuniv.sql`, `kidscenter.sql`, `bnbhighteen.sql`이다.
- `baewoo-split/`
  - 이전 단일 dump 기반 테이블 분리 산출물이다.
  - 새 작업에서는 정본으로 보지 않고, 기존 스크립트 호환이 끝나면 제거한다.
- `baewoo-curated/`
  - 이전 우선순위 선별본이다.
  - `c0`, `p0`, `p1`, `p2` 입력을 읽는 구 시드 스크립트가 남아 있어 당장 삭제하지 않는다.

## 작업 흐름

1. 센터별 원본 dump를 `data/legacy_dumps/`에 보관한다.
2. `npm run legacy:db:import`로 로컬 MariaDB에 원본 DB를 복원한다.
3. 로컬 MariaDB에서 필요한 테이블을 조회해 Postgres/Payload 적재용 staging 데이터를 만든다.
4. 새 DB 기반 추출 경로가 검증되면 기존 `baewoo-split/`, `baewoo-curated/c0`, `p0`, `p1`, `p2` 산출물을 제거한다.
