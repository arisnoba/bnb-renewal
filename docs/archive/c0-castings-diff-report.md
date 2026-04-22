# C0 Castings Diff Report

> 생성 시각: 2026-04-20T08:56:06.559Z
> 기준 baseline: `tmp/c0/castings-pre-c0.json`
> 원래 대상 SQL: `data/baewoo-curated/c0/g5_write_new_casting_all.sql` (제거됨)

## Summary

| 항목 | 값 |
|---|---:|
| 현재 Castings baseline 수 | 10 |
| c0 후보 수 | 22 |
| 증감 | 12 |
| sourceTable+sourceId exact match 수 | 10 |
| 제목 겹침 수 | 0 |
| baseline에만 있는 항목 수 | 0 |
| c0에만 있는 항목 수 | 12 |
| 겹치는 제목 key 수 | 9 |

## Baseline Context

- baseline 생성 시각: 2026-04-20T08:19:07.916Z
- DB host: ep-still-dawn-a1sbp5uu.ap-southeast-1.aws.neon.tech
- DB name: neondb
- isLocal: false
- NODE_ENV: development

## Source Counts

### Baseline

| sourceTable | count |
|---|---:|
| g5_write_new_casting_abio | 6 |
| g5_write_new_casting_bx | 1 |
| g5_write_new_casting2 | 1 |
| g5_write_new_casting3 | 2 |

### c0 Candidate

| sourceTable | count |
|---|---:|
| g5_write_new_casting | 5 |
| g5_write_new_casting_abio | 6 |
| g5_write_new_casting_bx | 2 |
| g5_write_new_casting2 | 4 |
| g5_write_new_casting3 | 5 |

## Exact Matches

| sourceTable | sourceId | baseline 제목 | c0 제목 |
|---|---:|---|---|
| g5_write_new_casting2 | 14 | 홍진희 | 홍진희 |
| g5_write_new_casting3 | 13 | 김하나 | 김하나 |
| g5_write_new_casting3 | 14 | 권이혁 | 권이혁 |
| g5_write_new_casting_abio | 1 | 노창환 | 노창환 |
| g5_write_new_casting_abio | 2 | 박정훈 | 박정훈 |
| g5_write_new_casting_abio | 3 | 김남우 | 김남우 |
| g5_write_new_casting_abio | 4 | 이재희 | 이재희 |
| g5_write_new_casting_abio | 5 | 배태원 | 배태원 |
| g5_write_new_casting_abio | 6 | 박가인 | 박가인 |
| g5_write_new_casting_bx | 13 | 김하나 | 김하나 |

## Title Overlaps

- 없음

## Baseline Only

- 없음

## c0 Only

| sourceTable | sourceId | title | publishedAt |
|---|---:|---|---|
| g5_write_new_casting | 1 | 최길홍 | 2018-12-15T04:36:43.000Z |
| g5_write_new_casting | 2 | 이민호 | 2018-12-22T06:06:02.000Z |
| g5_write_new_casting | 3 | 박소현 | 2018-12-22T06:07:01.000Z |
| g5_write_new_casting | 7 | 오재동 | 2020-05-12T08:43:16.000Z |
| g5_write_new_casting | 6 | 김재윤 | 2020-03-04T04:36:33.000Z |
| g5_write_new_casting2 | 1 | 김건보 | 2018-12-15T04:36:43.000Z |
| g5_write_new_casting2 | 3 | 권주연 | 2018-12-22T06:07:01.000Z |
| g5_write_new_casting2 | 11 | 이누리 | 2022-11-24T01:17:58.000Z |
| g5_write_new_casting3 | 1 | 이덕화 | 2022-12-12T15:00:00.000Z |
| g5_write_new_casting3 | 10 | 류정선 | 2022-12-13T06:00:57.000Z |
| g5_write_new_casting3 | 11 | 박수현 | 2022-12-13T06:03:02.000Z |
| g5_write_new_casting_bx | 1 | 이덕화 | 2022-12-12T15:00:00.000Z |

## Approval Gate

- 상태: 승인
- 승인 근거: 2026-04-20 사용자 요청으로 Phase 2와 castings diff 승인 게이트까지 함께 진행
- 실행 메모: 위 diff 리포트 생성 직후 기존 Castings를 교체 대상으로 간주
