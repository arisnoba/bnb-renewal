# 배우앤배움 전체 분리본

이 폴더는 원본 덤프 `data/baewoo.sql`을 테이블 단위로 나눈 전체 작업본이다.

## 생성 방식

- 생성 스크립트: `scripts/split_baewoo_sql.py`
- 입력: `data/baewoo.sql`
- 출력: `_global.sql`, `manifest.tsv`, `summary.json`, `tables/*.sql`

## 파일 설명

- `_global.sql`
  - 데이터베이스 생성문, 세션 설정 등 전역 SQL을 모아둔 파일이다.
- `manifest.tsv`
  - 테이블별 파일 경로와 크기를 확인하는 목록이다.
- `summary.json`
  - 분리 결과 요약 정보다.
- `tables/`
  - 각 테이블을 독립적으로 검토할 수 있게 분리한 SQL 파일 모음이다.

## 사용 목적

- 전체 덤프를 직접 다루지 않고 테이블별로 구조와 데이터를 검토한다.
- 필요한 테이블만 골라 선별 이관용 세트를 만든다.
- 변환 규칙을 설계할 때 원본 테이블 단위 근거 자료로 사용한다.
