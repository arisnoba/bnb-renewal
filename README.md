# BNB Renewal

배우앤배움 기존 5개 사이트를 하나의 `Next.js + Payload CMS + Postgres` 구조로 통합하는 프로젝트다.

현재 목표는 아래 3가지를 동시에 만족하는 것이다.

- 센터별 공개 사이트를 하나의 코드베이스로 운영한다.
- 관리자에서 콘텐츠를 직접 수정할 수 있는 CMS를 만든다.
- 기존 그누보드 기반 사이트의 핵심 데이터를 단계적으로 이관한다.

## 1. 프로젝트 한눈에 보기

### 대상 센터

- 아트센터 `art`
- 애비뉴센터 `avenue`
- 입시센터 `exam`
- 하이틴센터 `highteen`
- 키즈센터 `kids`

### 통합 대상

- 공개 사이트
- Payload 관리자 `/admin`
- 센터별 소개/강사진/캐스팅/상담 라우트
- 레거시 dump 기반 DB 이전 파이프라인

### 현재 기준 아키텍처

- 프레임워크: `Next.js App Router`
- CMS: `Payload CMS`
- 로컬 DB: MariaDB 원본 복원, Postgres 정제/검증
- 운영 DB: Vercel Neon Postgres
- 레거시 원본 DB: `data/legacy_dumps`의 센터별 MariaDB dump
- 파일/이미지 스토리지: `Cloudflare R2`

권장 운영 방향은 `Vercel 기반 단일 앱 + Postgres + Cloudflare R2`다. 현재 기준은 [프로젝트 운영 정책](docs/02-프로젝트-운영-정책.md)에 정리되어 있다.

## 2. 현재 구현 범위

### 공개 라우트 골격

`<center>`에는 `art`, `avenue`, `exam`, `highteen`, `kids`가 들어간다. 실제 노출 센터는 각 페이지의 센터 guard와 메뉴 설정을 따른다.

- 전역: `/`, `/news`, `/artist-press`, `/profiles/<slug>`, `/consult`, `/privacy`, `/terms`
- 센터 기본: `/<center>`, `/<center>/about`, `company`, `consult`, `facilities`, `faq`, `management`, `map`, `privacy`, `terms`
- 센터 콘텐츠: `artist-press`, `casting-status`, `curriculum`, `direct-castings`, `news`, `profiles`, `rookies`, `schedule`, `screen-appearances`, `starcard`, `teachers`
- 입시 결과: `/exam/university-results`, `/exam/arts-high-results`, `/exam/exam-passed-reviews`, `/exam/exam-passed-videos`
- 센터별 안내: `admission`, `casting`, `casting-system`, `entertainment`, `exam-management`, `grade-system`, `how-to-use`, `profile-production`, `special-lecture`, `special-system`
- 상세 URL은 목록 경로 아래 `<slug>`를 사용한다. 예: `/<center>/news/<slug>`, `/<center>/teachers/<slug>`.
- Payload 관리자: `/admin`

### Payload 컬렉션

현재 [payload.config.ts](payload.config.ts)에 등록된 컬렉션은 28개다.

- 메인/운영: `main-banners`, `social-links`, `histories`, `terms`, `inquiries`, `users`, `media`
- 교육: `teachers`, `curriculums`, `classrooms`, `highteen-special-classes`
- 캐스팅/프로필: `agencies`, `casting-directors`, `direct-castings`, `casting-appearances`, `profiles`
- 콘텐츠: `screen-appearances`, `broadcast-stations`, `artist-press`, `artist-press-agencies`, `news`, `faqs`, `star-cards`
- 입시: `audition-schedules`, `exam-passed-reviews`, `exam-passed-videos`, `exam-results`, `exam-school-logos`

글로벌 설정은 `main`, `main-statistics`, `footer`, `site-settings`다.

### 마이그레이션 스크립트

- `scripts/legacy-mariadb/import-dumps.sh`
- `scripts/legacy-mariadb/verify-dumps.sh`
- `scripts/legacy-mariadb/build-work-*.sql`
- `scripts/legacy-mariadb/asset-downloads/*.py`
- `scripts/payload-migration/*.ts`

현재 데이터 이전 기준은 `data/legacy_dumps -> 로컬 MariaDB -> 로컬 Postgres/Payload DB 정제 -> Vercel Neon` 흐름이다. 이전 P0/P1/P2/C0 기준과 `seed-p0.ts`, `seed-p1.ts`, `baewoo-curated/` 기반 정적 SQL 시드 경로는 폐기된 과거 방향이며 현재 판단 기준으로 사용하지 않는다.

## 3. 디렉터리 가이드

- [src/app](src/app): 공개 사이트와 Payload 라우트
- [src/collections](src/collections): Payload 컬렉션 정의
- [src/lib](src/lib): 공용 유틸리티와 센터 매핑
- [scripts](scripts): 레거시 데이터 분리/정제/시드 스크립트
- [data](data): 원본 SQL, 분리본, 정제본, 요약 파일
- [docs](docs): 현재 기준 정책 문서와 archive
- [deliverables](deliverables): SEO 관련 산출물
- [plan](plan): 현재 작업 기록과 archive

## 4. 빠른 시작

### 1. 환경 변수 준비

`.env.example`를 기준으로 `.env.local`을 만든다.

필수 값:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SITE_URL`

상담 폼과 R2를 사용하는 환경에서는 아래 값도 준비한다.

- Turnstile: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- 이메일: `RESEND_API_KEY`, `INQUIRY_NOTIFICATION_EMAIL` (센터별 주소가 없을 때 사용하는 기본 수신자)
- 공개 R2: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL`
- 비공개 문의 첨부: `R2_PRIVATE_ACCESS_KEY_ID`, `R2_PRIVATE_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`

문의 알림 메일은 `INQUIRY_NOTIFICATION_EMAIL`로 먼저 테스트한다. 운영에서 센터별 수신자를 분리할 때는
`INQUIRY_NOTIFICATION_EMAIL_ART`, `INQUIRY_NOTIFICATION_EMAIL_EXAM`, `INQUIRY_NOTIFICATION_EMAIL_KIDS`,
`INQUIRY_NOTIFICATION_EMAIL_HIGHTEEN`, `INQUIRY_NOTIFICATION_EMAIL_AVENUE`,
`INQUIRY_NOTIFICATION_EMAIL_PARTNERSHIP`을 설정하며, 센터별 주소가 기본 수신자보다 우선한다.
하나의 환경변수에 여러 수신자를 지정할 때는 `first@example.com,second@example.com`처럼 콤마로 구분한다.

운영·미리보기 환경은 각각 별도의 `PAYLOAD_SECRET`을 사용한다. 전체 기준은 [보안 운영 인수인계](docs/10-보안-운영-인수인계.md)를 따른다.

### 2. 로컬 DB 실행

```bash
docker compose up -d
```

Postgres만 띄우려면 아래 명령을 사용한다.

```bash
docker compose up -d postgres
```

Beekeeper Studio 같은 DB GUI에서 로컬 DB를 볼 때는 아래 값을 입력한다.

Payload 로컬 Postgres:

| 항목 | 값 |
| --- | --- |
| Connection Type | `Postgres` |
| Authentication Method | `Username / Password` |
| Connection Mode | `Host and Port` |
| Host | `127.0.0.1` |
| Port | `5432` |
| User | `postgres` |
| Password | `postgres` |
| Default Database | `bnb_renewal` |
| SSL | 꺼짐 |
| SSH Tunnel | 꺼짐 |
| Connection Name | `BNB Local Postgres` |

접속 URL로 입력할 수 있는 도구에서는 `postgresql://postgres:postgres@127.0.0.1:5432/bnb_renewal`을 사용한다. macOS 일부 DB GUI에서는 `localhost`가 IPv6 `::1`로 먼저 잡혀 다른 빈 DB처럼 보일 수 있으므로 `127.0.0.1`을 기본값으로 사용한다.

레거시 MariaDB:

| 항목 | 값 |
| --- | --- |
| Connection Type | `MariaDB` 또는 `MySQL` |
| Authentication Method | `Username / Password` |
| Connection Mode | `Host and Port` |
| Host | `127.0.0.1` |
| Port | `3307` |
| User | `root` |
| Password | `root` |
| Default Database | 복원 전에는 비워두고, 작업 테이블 확인 시 `bnb_legacy_work` |
| SSL | 꺼짐 |
| SSH Tunnel | 꺼짐 |
| Connection Name | `BNB Legacy MariaDB` |

접속 URL로 입력할 수 있는 도구에서는 작업 테이블 기준으로 `mysql://root:root@127.0.0.1:3307/bnb_legacy_work`을 사용한다. 원본 복원 DB를 직접 볼 때는 Default Database를 `baewoo`, `bnbhighteen`, `bnbuniv`, `kidscenter` 중 필요한 DB로 바꾼다.

센터별 레거시 dump를 로컬 MariaDB에 복원하려면 `data/legacy_dumps`에 dump 파일 4개를 둔 뒤 아래 명령을 실행한다.

```bash
npm run legacy:db:up
npm run legacy:db:import
npm run legacy:db:verify
```

기존 로컬 MariaDB 복원본을 버리고 다시 넣을 때만 아래 명령을 사용한다.

```bash
npm run legacy:db:import:reset
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 마이그레이션 적용

```bash
npm run db:local:migrate
```

### 5. 개발 서버 실행

```bash
npm run dev
```

### 6. 선택 검증

```bash
npm test
npm run lint
npm run typecheck
npm run legacy:db:verify
```

## 5. 작업 원칙

이 저장소는 "레거시 dump를 로컬에서 복원/정제/검증한 뒤 Neon으로 옮기는" 원칙을 따른다.

- 기존 패턴을 우선 따르고, 불필요한 재설계는 피한다.
- 공개 사이트 핵심 콘텐츠부터 옮긴다.
- 개인정보가 포함된 상담 데이터는 후순위로 다룬다.
- 구현 전에 관련 문서와 현재 코드를 먼저 읽는다.
- 완료 전에는 가능한 검증을 수행하고, 못 한 검증은 명시한다.

상세 규칙은 [작업 규칙](docs/01-작업-규칙.md)을 기준 문서로 사용한다.

## 6. 참고 문서

- [문서 인덱스](docs/00-문서-인덱스.md): 문서 진입점과 archive 맵
- [작업 규칙](docs/01-작업-규칙.md): 작업 방식과 검증 규칙
- [프로젝트 운영 정책](docs/02-프로젝트-운영-정책.md): 배포, DB, R2, 환경변수 기준
- [Payload R2 Vercel 운영 주의사항](docs/03-Payload-R2-Vercel-운영-주의사항.md): Payload + R2 + Vercel 운영 기준
- [레거시 마이그레이션 정책](docs/04-레거시-마이그레이션-정책.md): 레거시 DB/이미지 이관 기준
- [Payload admin 운영 UX](docs/05-Payload-admin-운영-UX.md): 관리자 작성 UX, Lexical, media, SEO 기준
- [IA SEO URL 정책](docs/06-IA-SEO-URL-정책.md): IA, URL, SEO 기준
- [마이그레이션 정제 체크리스트](docs/07-마이그레이션-정제-체크리스트.md): 로컬 정제 완료와 Neon 이전 전 게이트
- [R2 미디어 업로드 현황](docs/08-R2-미디어-업로드-현황.md): R2 업로드 완료/대기 현황
- [DB 백업 복구 운영 메모](docs/09-DB-백업-복구-운영-메모.md): 원격 Neon 복구와 위험 작업 전 백업 기준
- [보안 운영 인수인계](docs/10-보안-운영-인수인계.md): 보안 설정, 비공개 첨부 다운로드, 의존성 점검 절차
- [현재 작업](plan/현재작업.md): 현재 진행 상황과 검증 기록

## 7. 지금 먼저 보면 좋은 순서

새로 합류한 사람이면 아래 순서가 가장 빠르다.

1. 이 `README.md`
2. [문서 인덱스](docs/00-문서-인덱스.md)
3. [현재 작업](plan/현재작업.md)
4. 이번 작업에 해당하는 `docs/01~10` 기준 문서
5. [payload.config.ts](payload.config.ts)
