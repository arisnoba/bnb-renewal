# 프로필 이미지 FTP 수집 가이드

> 작성일: 2026-04-14  
> 목적: `profiles` 이미지 수집 작업을 다음에도 같은 방식으로 재실행할 수 있게 절차와 입력값을 고정한다.

이 문서는 `g5_write_new_profile` 기반 프로필 이미지를 4개 브랜드 FTP에서 필요한 파일만 내려받고, 성공한 파일만 `profiles.profileImagePath`에 반영하는 운영 가이드다.

현재 기준 흐름은 아래 4단계다.

1. SQL에서 실제 참조 중인 이미지 manifest 생성
2. 4개 브랜드 FTP를 fallback 체인으로 돌며 필요한 파일만 다운로드
3. 성공한 다운로드만 상태 파일에 기록
4. 상태 파일 기준으로 `profiles.profileImagePath`를 로컬 공개 경로로 반영

## 1. 현재 기준 구조

관련 파일:

- [config/profile-image-ftp-sources.template.json](/Users/arisnoba/Documents/GitHub/bnb-renewal/config/profile-image-ftp-sources.template.json:1)
- [scripts/profile-images.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/profile-images.ts:1)
- [scripts/export-profile-image-manifest.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/export-profile-image-manifest.ts:1)
- [scripts/download_profile_images_ftp.py](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/download_profile_images_ftp.py:1)
- [scripts/download-profile-images.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts/download-profile-images.ts:1)

현재 확인된 FTP 기준:

- 프로토콜: `FTP`
- Passive mode: `true`
- 루트 경로: `/www/web/`
- 실제 이미지 경로: `/www/web/data/file/new_profile`

브랜드 FTP는 아래 4개를 fallback 순서로 사용한다.

- `art`
- `exam`
- `kids`
- `highteen`

## 2. 입력값 준비

### 2-1. FTP 설정 파일

템플릿을 실제 설정 파일로 복사한다.

```bash
cp config/profile-image-ftp-sources.template.json config/profile-image-ftp-sources.json
```

입력해야 하는 값:

- `host`
- `username`
- `passwordEnv`
- `rootDir`
- `candidateDirs`

주의:

- 실제 작업에서는 `config/profile-image-ftp-sources.json`을 우선 읽는다.
- 템플릿 파일은 예시이자 백업 용도로만 둔다.
- 비밀번호는 파일에 직접 넣지 않는다.

### 2-2. 환경 변수

`.env.local`에 브랜드별 FTP 비밀번호를 넣는다.

```bash
PROFILE_IMAGE_FTP_ART_PASSWORD=...
PROFILE_IMAGE_FTP_EXAM_PASSWORD=...
PROFILE_IMAGE_FTP_KIDS_PASSWORD=...
PROFILE_IMAGE_FTP_HIGHTEEN_PASSWORD=...
```

## 3. 실행 순서

### 3-1. 타입/시드 기본 확인

```bash
npm run payload:generate-types
npm run typecheck
npm run db:seed:p1-profiles:dry-run
```

### 3-2. manifest 생성

SQL 기준으로 실제 필요한 이미지 파일 목록을 만든다.

```bash
npm run profiles:images:manifest
```

생성 파일:

- `tmp/profile-image-manifest.json`

현재 기준 건수:

- `660`건

### 3-3. FTP dry-run

실제 다운로드 전에 FTP에서 파일을 찾을 수 있는지 확인한다.

```bash
npm run profiles:images:dry-run
```

소량 샘플만 보고 싶으면:

```bash
python3 scripts/download_profile_images_ftp.py --dry-run --limit 5
```

결과 파일:

- `tmp/profile-image-download-report.json`

### 3-4. 실제 다운로드

필요한 파일만 `public/legacy/profiles/<sourceId>/...`로 내려받는다.

```bash
npm run profiles:images:sync
```

소량 샘플 다운로드:

```bash
python3 scripts/download_profile_images_ftp.py --limit 3
```

성공 상태 파일:

- `tmp/profile-image-download-success.json`

### 3-5. DB 반영

다운로드 성공 상태 파일 기준으로 `profiles.profileImagePath`를 반영한다.

```bash
npm run profiles:images:apply
```

샘플 드라이런:

```bash
node --env-file=.env.local --import tsx scripts/download-profile-images.ts --dry-run --limit 5
```

## 4. 결과물 위치

다운로드 파일:

- `public/legacy/profiles/<sourceId>/<filename>`

중간 산출물:

- `tmp/profile-image-manifest.json`
- `tmp/profile-image-download-report.json`
- `tmp/profile-image-download-success.json`

이 파일들은 로컬 실행 산출물이므로 Git 추적 대상이 아니다.

## 5. 검증 포인트

정상 흐름이면 아래를 확인한다.

- `npm run profiles:images:manifest` 후 `tmp/profile-image-manifest.json` 생성
- `npm run profiles:images:dry-run` 후 `failed = 0` 또는 허용 가능한 실패만 존재
- `npm run profiles:images:sync` 후 `public/legacy/profiles/...` 파일 생성
- `npm run profiles:images:apply` 후 관리자에서 `profiles.profileImagePath` 확인

추가 수동 확인:

- `/admin`에서 해당 `sourceId` 프로필 문서 조회
- `profileImagePath`가 `/legacy/profiles/...` 형식인지 확인
- 실제 공개 경로에서 이미지가 열리는지 확인

## 6. 자주 막히는 지점

### 6-1. FTP 로그인 실패

확인 순서:

- `host`, `username` 오타
- `.env.local` 비밀번호 키 누락
- `passwordEnv` 이름 불일치
- `Passive mode` 설정 차이

현재 기준으로는 `FTP + Passive mode` 조합이 맞다.

### 6-2. 다운로드는 됐는데 DB 반영이 안 됨

대표 원인:

- MariaDB work table 또는 Payload `profiles` 컬렉션에 해당 원본 문서가 아직 없음

이 경우 먼저 MariaDB work table을 다시 만들고, 현재 연결 중인 Payload 적재 경로를 다시 실행해야 한다.

```bash
npm run legacy:work:profiles
```

그 뒤 `npm run db:c0:profile-images:download`를 다시 실행한다.

### 6-3. 같은 파일을 반복 다운로드함

방지 기준:

- `tmp/profile-image-download-success.json`
- 이미 존재하는 `public/legacy/profiles/...` 파일

강제 재다운로드가 필요하면 Python 스크립트에 `--force`를 준다.

## 7. 운영 판단 기준

이 작업은 현재 기준으로 "Codex skill"보다 "저장소 문서 + 스크립트"가 더 적합하다.

이유:

- FTP 경로, 브랜드 수, `g5_board_file` 규칙이 이 저장소에 강하게 묶여 있다.
- 반복 가능성은 높지만 범용 자동화보다 repo-local 운영 절차 성격이 강하다.
- 지금은 실행 스크립트와 설정 파일만으로도 재현 가능하다.

아래 조건이 생기면 그때 skill 또는 더 높은 추상화 검토가 가능하다.

- `new_profile` 말고 다른 게시판 자산도 같은 방식으로 계속 수집할 때
- 여러 저장소에서 같은 FTP fallback 패턴을 재사용할 때
- 비개발자도 같은 작업을 반복해야 해서 입력/실행 UI가 필요할 때

현재 권장안:

- 당장은 이 문서와 스크립트로 운영
- 같은 패턴의 수집 작업이 2~3개 이상 추가되면 그때 skill 대신 먼저 공용 repo 스크립트로 추상화 검토
