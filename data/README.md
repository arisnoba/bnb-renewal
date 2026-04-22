# data 디렉터리 안내

이 디렉터리는 레거시 사이트 DB 검토와 단계별 마이그레이션 작업을 위한 산출물을 보관한다.

## 구성

- `legacy_dumps/`
  - 센터별 원본 MariaDB 전체 덤프 보관 위치다.
  - SQL dump 본문은 로컬 보관 전용이며 Git에는 포함하지 않는다.
  - 현재 기대 파일은 `baewoo.sql`, `bnbuniv.sql`, `kidscenter.sql`, `bnbhighteen.sql`이다.
- `teacher-list.md`
  - 강사 공개/정렬 기준으로 보존한 수기 검토 목록이다.

이전 `baewoo-curated/` 정적 SQL 선별본은 MariaDB work table 방식으로 대체되어 제거했다. 보존할 문서성 자료는 `docs/archive/`로 이동했다.

## 작업 흐름

1. 센터별 원본 dump를 `data/legacy_dumps/`에 보관한다.
2. `npm run legacy:db:import`로 로컬 MariaDB에 원본 DB를 복원한다.
3. 로컬 MariaDB에서 필요한 테이블을 조회해 `bnb_legacy_work`의 work table을 만든다.
4. work table과 테스트 라우트에서 카운트, 센터 매핑, 이미지 경로를 검증한 뒤 Postgres/Payload 적재 경로에 연결한다.
