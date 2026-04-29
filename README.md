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

권장 운영 방향은 `Vercel 기반 단일 앱 + Postgres + Cloudflare R2`다. 현재 기준은 [docs/01-프로젝트-운영-정책.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/01-프로젝트-운영-정책.md:1)에 정리되어 있다.

## 2. 현재 구현 범위

### 공개 라우트 골격

- `/`
- `/news`
- `/<center>`
- `/<center>/faculty`
- `/<center>/casting`
- `/<center>/contact`

### Payload 컬렉션

- `users`
- `pages`
- `teachers`
- `news`
- `profiles`
- `castings`
- `agencies`

### 마이그레이션 스크립트

- `scripts/legacy-mariadb/import-dumps.sh`
- `scripts/legacy-mariadb/verify-dumps.sh`
- `scripts/legacy-mariadb/build-work-*.sql`
- `scripts/legacy-mariadb/asset-downloads/*.py`
- `scripts/payload-migration/*.ts`

현재 데이터 이전 기준은 `data/legacy_dumps -> 로컬 MariaDB -> 로컬 Postgres/Payload DB 정제 -> Vercel Neon` 흐름이다. 이전 P0/P1/P2/C0 기준과 `seed-p0.ts`, `seed-p1.ts`, `baewoo-curated/` 기반 정적 SQL 시드 경로는 폐기된 과거 방향이며 현재 판단 기준으로 사용하지 않는다.

## 3. 디렉터리 가이드

- [src/app](/Users/arisnoba/Documents/GitHub/bnb-renewal/src/app:1): 공개 사이트와 Payload 라우트
- [src/collections](/Users/arisnoba/Documents/GitHub/bnb-renewal/src/collections:1): Payload 컬렉션 정의
- [src/lib](/Users/arisnoba/Documents/GitHub/bnb-renewal/src/lib:1): 공용 유틸리티와 센터 매핑
- [scripts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts:1): 레거시 데이터 분리/정제/시드 스크립트
- [data](/Users/arisnoba/Documents/GitHub/bnb-renewal/data:1): 원본 SQL, 분리본, 정제본, 요약 파일
- [docs](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs:1): 현재 기준 정책 문서와 archive
- [deliverables](/Users/arisnoba/Documents/GitHub/bnb-renewal/deliverables:1): SEO 관련 산출물
- [plan](/Users/arisnoba/Documents/GitHub/bnb-renewal/plan:1): 현재 작업 기록과 archive

## 4. 빠른 시작

### 1. 환경 변수 준비

`.env.example`를 기준으로 `.env.local`을 만든다.

필수 값:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SITE_URL`

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
npm run db:migrate
```

### 5. 개발 서버 실행

```bash
npm run dev
```

### 6. 선택 검증

```bash
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

상세 규칙은 [docs/05-작업-규칙.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/05-작업-규칙.md:1)를 기준 문서로 사용한다.

## 6. 참고 문서

- [docs/00-문서-인덱스.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/00-문서-인덱스.md:1): 문서 진입점과 archive 맵
- [docs/01-프로젝트-운영-정책.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/01-프로젝트-운영-정책.md:1): 배포, DB, R2, 환경변수 기준
- [docs/02-레거시-마이그레이션-정책.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/02-레거시-마이그레이션-정책.md:1): 레거시 DB/이미지 이관 기준
- [docs/03-Payload-admin-운영-UX.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/03-Payload-admin-운영-UX.md:1): 관리자 작성 UX, Lexical, media, SEO 기준
- [docs/04-IA-SEO-URL-정책.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/04-IA-SEO-URL-정책.md:1): IA, URL, SEO 기준
- [docs/05-작업-규칙.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/05-작업-규칙.md:1): 작업 방식과 검증 규칙
- [plan/현재작업.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/plan/현재작업.md:1): 현재 진행 상황과 검증 기록

## 7. 지금 먼저 보면 좋은 순서

새로 합류한 사람이면 아래 순서가 가장 빠르다.

1. 이 `README.md`
2. [docs/00-문서-인덱스.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/00-문서-인덱스.md:1)
3. [plan/현재작업.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/plan/현재작업.md:1)
4. 이번 작업에 해당하는 `docs/01~05` 기준 문서
5. [payload.config.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/payload.config.ts:1)
