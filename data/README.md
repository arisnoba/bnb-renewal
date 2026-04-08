# data 디렉터리 안내

이 디렉터리는 레거시 사이트 DB 검토와 단계별 마이그레이션 작업을 위한 산출물을 보관한다.

## 구성

- `baewoo.sql`
  - 원본 MariaDB 전체 덤프다.
  - 로컬 보관 전용이며 Git에는 포함하지 않는다.
- `baewoo-split/`
  - 원본 덤프를 테이블 단위 SQL 파일로 분리한 작업본이다.
  - 전체 구조를 참조하거나 필요한 테이블만 선별할 때 사용한다.
- `baewoo-curated/`
  - 실제 프로젝트 이관 우선순위 기준으로 다시 추린 선별본이다.
  - P0, P1, P2, reference 순서로 나뉘어 있다.

## 작업 흐름

1. `baewoo.sql`을 로컬에 보관한다.
2. `scripts/split_baewoo_sql.py`로 `baewoo-split/`을 생성한다.
3. `scripts/curate_baewoo_tables.py`로 `baewoo-curated/`를 구성한다.
4. 실제 변환과 적재는 `baewoo-curated/`의 우선순위 테이블부터 진행한다.
