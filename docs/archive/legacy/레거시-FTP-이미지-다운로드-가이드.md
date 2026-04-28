# 레거시 FTP 이미지 다운로드 가이드

## 목적

MariaDB work table 기준으로 FTP 이미지 원본을 `public/legacy/` 아래에 내려받는다. 실제 다운로드 전에는 `ftp-dry-run`으로 원격 파일 존재와 크기만 확인한다.

## 기본 전제

- FTP 접속 설정: `config/profile-image-ftp-sources.template.json`
- FTP 비밀번호: `.env.local`의 각 `passwordEnv` 값
- 로컬 MariaDB: `npm run legacy:db:up`, `npm run legacy:db:import`
- work table 재생성: 필요한 `npm run legacy:work:*` 명령 선행
- 리포트 위치: `tmp/legacy-assets/*-image-download-report.json`
- 다운로드 위치: `public/legacy/{collection}/...`

`tmp/`와 `public/legacy/`는 로컬 산출물이므로 Git에 올리지 않는다.

## 진행상황 확인

공용 스크립트는 기본적으로 25건마다 진행 로그를 출력한다.

```bash
[screen-appearances] 125/2462 planned=125 downloaded=0 skipped=0 failed=0
```

간격을 바꾸려면 npm 명령 뒤에 인자를 넘긴다.

```bash
npm run legacy:assets:news:dry-run -- --sample-size 25 --progress-every 5
```

## 샘플 검증

대량 컬렉션은 전체 dry-run 대신 균등 샘플을 먼저 검증한다. `--sample-size 25`는 앞 25건이 아니라 전체 entry 중 첫/중간/끝을 포함하도록 균등 간격으로 고른다.

```bash
npm run legacy:assets:news:dry-run -- --sample-size 25 --progress-every 5
npm run legacy:assets:artist-press:dry-run -- --sample-size 25 --progress-every 5
```

전체 확인이 필요하면 `--sample-size`를 빼고 실행한다.

## Dry-run 명령

테이블별 검증 명령이다. 뉴스처럼 대상이 큰 경우에는 샘플 검증을 먼저 한다.

```bash
npm run legacy:assets:agencies:dry-run
npm run legacy:assets:artist-press:dry-run -- --sample-size 25 --progress-every 5
npm run legacy:assets:audition-schedules:dry-run
npm run legacy:assets:casting-appearances:dry-run
npm run legacy:assets:screen-appearances:dry-run
npm run legacy:assets:exam-passed-reviews:dry-run
npm run legacy:assets:exam-school-logos:dry-run
npm run legacy:assets:exam-results:dry-run
npm run legacy:assets:news:dry-run -- --sample-size 25 --progress-every 5
```

## 다운로드 상태

아래 항목은 다운로드 완료 상태다. 리포트는 `tmp/legacy-assets/`로 정리했다.

| 대상 | 상태 | 리포트 |
| --- | --- | --- |
| Agencies | 완료 | `tmp/legacy-assets/agencies-image-download-report.json` |
| Artist Press | 완료 | `tmp/legacy-assets/artist-press-image-download-report.json` |
| Audition Schedules | 완료 | `tmp/legacy-assets/audition-schedules-image-download-report.json` |
| Casting Appearances | 완료 | `tmp/legacy-assets/casting-appearances-image-download-report.json` |
| Screen Appearances | 완료 | `tmp/legacy-assets/screen-appearances-image-download-report.json` |
| Exam Passed Reviews | 완료 | `tmp/legacy-assets/exam-passed-reviews-image-download-report.json` |
| Exam School Logos | 완료 | `tmp/legacy-assets/exam-school-logos-image-download-report.json` |
| Exam Results | 완료 | `tmp/legacy-assets/exam-results-image-download-report.json` |
| News | 미완료 | `tmp/legacy-assets/news-image-download-report.json` |

뉴스만 아직 실제 다운로드 대상이다.

```bash
npm run legacy:assets:news:download -- --progress-every 100
```

이미 받은 파일은 다시 받지 않고 `skipped`로 처리한다.

## 테이블별 실행 순서

### Agencies

```bash
npm run legacy:work:agencies
npm run legacy:assets:agencies:dry-run
npm run legacy:assets:agencies:download
```

### Artist Press

전체 대상이 1552건이므로 먼저 샘플 검증을 권장한다.

```bash
npm run legacy:work:artist-press
npm run legacy:assets:artist-press:dry-run -- --sample-size 25 --progress-every 5
npm run legacy:assets:artist-press:download -- --progress-every 100
```

### Audition Schedules

현재 work table에는 이미지 필드가 없으므로 dry-run 결과가 0건이면 정상이다.

```bash
npm run legacy:work:audition-schedules
npm run legacy:assets:audition-schedules:dry-run
npm run legacy:assets:audition-schedules:download
```

### Casting Appearances

```bash
npm run legacy:work:casting-appearances
npm run legacy:assets:casting-appearances:dry-run
npm run legacy:assets:casting-appearances:download -- --progress-every 50
```

### Screen Appearances

전체 대상이 2462건이다. 전체 dry-run은 가능하지만 시간이 걸리므로 필요하면 먼저 샘플 검증을 한다.

```bash
npm run legacy:work:screen-appearances
npm run legacy:assets:screen-appearances:dry-run -- --sample-size 50 --progress-every 10
npm run legacy:assets:screen-appearances:download -- --progress-every 100
```

전체 dry-run을 하려면:

```bash
npm run legacy:assets:screen-appearances:dry-run -- --progress-every 100
```

### Exam Passed Reviews

```bash
npm run legacy:work:exam-passed-reviews
npm run legacy:assets:exam-passed-reviews:dry-run
npm run legacy:assets:exam-passed-reviews:download -- --progress-every 50
```

현재 dry-run에서는 330건 중 1건이 실패했다. 실패 항목은 아래 “현재 dry-run 결과”에 기록했다.

### Exam School Logos

```bash
npm run legacy:work:exam-passed-reviews
npm run legacy:assets:exam-school-logos:dry-run
npm run legacy:assets:exam-school-logos:download
```

`Exam School Logos`는 `Exam Passed Reviews` work table 생성 스크립트에서 같이 만들어진다.

### Exam Results

```bash
npm run legacy:work:exam-results
npm run legacy:assets:exam-results:dry-run
npm run legacy:assets:exam-results:download -- --progress-every 50
```

### News

뉴스는 전체 다운로드 대상이 12499건이다. 한 번에 실행할 수는 있지만 오래 걸리고, FTP 연결 상태에 따라 중간 실패가 섞일 수 있다. 스크립트는 기존 파일을 `skipped`로 처리하므로 재실행은 가능하다.

권장 절차:

```bash
npm run legacy:work:news
npm run legacy:assets:news:dry-run -- --sample-size 100 --progress-every 10
npm run legacy:assets:news:download -- --progress-every 100
```

더 보수적으로 검증하려면 샘플 수를 늘린다.

```bash
npm run legacy:assets:news:dry-run -- --sample-size 300 --progress-every 25
```

전체 dry-run도 가능하지만, 뉴스는 실다운로드 전 샘플 검증만으로 경로 규칙을 확인하는 것을 우선 권장한다.

```bash
npm run legacy:assets:news:dry-run -- --progress-every 250
```

다운로드가 중간에 끊기면 같은 명령을 다시 실행한다.

```bash
npm run legacy:assets:news:download -- --progress-every 100
```

## 현재 dry-run 결과

2026-04-22 기준 로컬 dry-run 결과다.

| 대상                |                검증 방식 | 결과                       |
| ------------------- | -----------------------: | -------------------------- |
| Agencies            |                전체 78건 | planned 78, failed 0       |
| Artist Press        |  샘플 25건 / 전체 1552건 | planned 25, failed 0       |
| Audition Schedules  |                 전체 0건 | 이미지 필드 없음, failed 0 |
| Casting Appearances |               전체 373건 | planned 373, failed 0      |
| Screen Appearances  |              전체 2462건 | planned 2462, failed 0     |
| Exam Passed Reviews |               전체 330건 | planned 329, failed 1      |
| Exam School Logos   |                전체 50건 | planned 50, failed 0       |
| Exam Results        |               전체 177건 | planned 177, failed 0      |
| News                | 샘플 25건 / 전체 12499건 | planned 25, failed 0       |

`Exam Passed Reviews` 실패 1건:

- 제목: `한국예술종합학교 연극원 연기과 최종합격 주현서`
- 역할: `school-logo`
- 원격 경로: `web/data/file/new_hoogi/3717534017_uMX5mopd_aebcc4a19b41f6b00e14a11f71c22e8c30098f87.png`

학교 로고 마스터(`Exam School Logos`)는 별도 대표 로고 50건이 모두 검증됐으므로, 이 1건은 개별 후기 row의 과거 첨부 누락으로 보고 후속 확인한다.
