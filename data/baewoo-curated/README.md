# 배우앤배움 선별 이관 세트

이 폴더는 `data/baewoo-split/tables`에서 실제 프로젝트에 필요한 테이블만 우선순위별로 다시 모아둔 작업본이다.

## 생성 방식

- 생성 스크립트: `scripts/curate_baewoo_tables.py`
- 입력: `data/baewoo-split/tables`
- 출력: `p0/`, `p1/`, `p2/`, `reference/`, `summary.json`

## 우선순위 설명

- `p0/`
  - 가장 먼저 테스트 이관할 공개 콘텐츠다.
  - 정적 페이지, 강사진, 공지사항처럼 사이트 오픈에 바로 필요한 데이터가 들어 있다.
- `p1/`
  - 공개 사이트 확장용 콘텐츠다.
  - 프로필, 캐스팅, 에이전시, 성과성 데이터가 포함된다.
- `p2/`
  - 상담 등 운영 데이터다.
  - 개인정보 검토와 새 운영 정책 확정 후 이관하는 것을 전제로 한다.
- `reference/`
  - 메뉴 구조처럼 직접 적재보다 구조 참고용으로 보는 자료다.

## 현재 선별 대상

### P0

- `g5_content`
- `g5_content2`
- `g5_teacher`
- `g5_teacher2`
- `g5_write_new_notice`

### P1

- `g5_write_new_profile`
- `g5_write_new_casting`
- `g5_write_new_casting2`
- `g5_write_new_casting3`
- `g5_write_new_casting_abio`
- `g5_write_new_casting_bx`
- `g5_agency`
- `g5_plan`

### P2

- `g5_write_new_counsel`
- `g5_write_new_counsel_2`
- `sm_customer`

### Reference

- `g5_menu`
- `g5_menu2`
