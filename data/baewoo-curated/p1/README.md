# P1 선별본

이 폴더는 P0 검증 후 순차적으로 확장 이관할 공개 콘텐츠 테이블을 모아둔 곳이다.

## 포함 테이블

- `g5_write_new_profile`
- `g5_write_new_casting`
- `g5_write_new_casting2`
- `g5_write_new_casting3`
- `g5_write_new_casting_abio`
- `g5_write_new_casting_bx`
- `g5_agency`
- `g5_plan`

## 사용 목적

- 배우 프로필, 캐스팅, 에이전시, 성과성 데이터를 단계적으로 옮긴다.
- P0에서 정리한 변환 규칙을 확장 적용한다.

## 현재 판단

- 현재 우선 검토 대상은 `g5_write_new_profile`, 캐스팅 계열 테이블, `g5_agency`다.
- 최신 샘플은 `profiles`, `castings`, `agencies` 컬렉션으로 적재해 관리자에서 검토 중이다.
- `g5_plan`은 현재 IA와 직접 연결되지 않아 우선 보류한다.
