# C0 기준 마이그레이션 재계획

## 현재 판단

- `data/baewoo-curated/c0/baewoo-migration-context.md`는 새 기준 문서다.
- `data/baewoo-curated/c0/*.sql`은 `data/baewoo-split/tables`로 분리하기 이전에 사용한 원본 SQL 기준이다.
- 현재 구현된 `p0~p2` 기반 시드와 `profiles` FTP 복원은 `c0` 기준과 범위가 다르다.
- `p0~p2`의 테이블 선별 기준은 현재 사용자가 원하는 마이그레이션 범위와 다르다.
- 특히 `g5_write_new_profile` 기반 `profiles` 작업은 현재 `c0` 기본 목록에는 없고, 필요하면 사용자가 이후 추가할 수 있다.
- `p0~p2`를 지금 바로 삭제하면 [scripts/seed-p0.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/seed-p0.ts:1), [scripts/seed-p1.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/seed-p1.ts:1), [scripts/profile-images.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/profile-images.ts:1) 입력이 사라져 재현성과 비교 근거도 함께 없어진다.

## 결정

- [x] `c0`와 현행 `p0~p2`/FTP 계획 차이 분석
- [x] `c0` 기준 재계획 문서 작성
- [x] `c0`를 새 기준으로 사용하기로 합의
- [ ] 사용자가 `c0`에 추가할 테이블 반영
- [ ] 최종 `c0` 테이블 목록 확정
- [ ] `c0` SQL 기준 변환 스크립트 작성
- [ ] `c0` 기준 컬렉션/필드 매핑표 작성
- [ ] 이미지 경로 규칙을 `c0` 기준으로 다시 검증
- [ ] 필요 시 `new_profile` FTP 복원 절차를 별도 phase로 편입
- [ ] `seed-p0.ts`, `seed-p1.ts`, `profile-images.ts` 등 `p0~p2` 의존 코드 정리 계획 수립
- [ ] `c0` 실행 경로가 준비된 뒤 `p0~p2` 폴더 제거

## 삭제 전 선행조건

- `c0` 기준 실제 입력 SQL 또는 source manifest가 준비돼 있어야 한다.
- `p0~p2`를 참조하는 스크립트와 문서를 먼저 대체하거나 폐기해야 한다.
- `배우 리스트`를 어디서 복원할지 결정돼야 한다.

## 내일 시작 순서

- [ ] 사용자가 `c0`에 추가한 테이블 확인
- [ ] 추가된 테이블 포함 전체 `c0` SQL 구조 재검토
- [ ] 변환 스크립트 대상 테이블과 출력 형식 확정
- [ ] 1차 변환 스크립트 구현
- [ ] 샘플 테이블로 변환 결과 검증

## 메모

- 현재 FTP 복원은 `new_profile` 게시판 첨부파일만 대상으로 하며, 이는 `c0`의 `/data/g5_teacher`, `/data/g5_agency`, `/data/g5_class` 이미지 전략과 다르다.
- 따라서 `profiles` FTP 작업은 재사용 가능한 하위 절차로 보관하되, `c0` 1차 범위에서는 기본 축이 아니다.
- `c0` 기준 작업의 핵심은 `p0~p2`를 고치는 것이 아니라, `c0` 원본 SQL 세트를 기준으로 새 변환 경로를 만드는 것이다.
