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
- 레거시 데이터 선별 이관 파이프라인

### 현재 기준 아키텍처

- 프레임워크: `Next.js App Router`
- CMS: `Payload CMS`
- DB: `Postgres`
- 주요 데이터 소스: `data/baewoo.sql`를 분리·정제한 산출물

권장 운영 방향은 `Vercel 기반 단일 앱 + Postgres + 파일 스토리지`다. 자세한 배포 판단 근거는 [docs/배포-운영-전략.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/배포-운영-전략.md:1)에 정리되어 있다.

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

- `scripts/seed-p0.ts`
- `scripts/seed-p1.ts`
- `scripts/legacy-sql.ts`
- `scripts/split_baewoo_sql.py`
- `scripts/curate_baewoo_tables.py`

현재 코드는 "전체 완성본"이 아니라, `P0 이관 검증 + 라우트 골격 + 관리자 컬렉션 정리` 단계로 보는 것이 맞다.

## 3. 디렉터리 가이드

- [src/app](/Users/arisnoba/Documents/GitHub/bnb-renewal/src/app:1): 공개 사이트와 Payload 라우트
- [src/collections](/Users/arisnoba/Documents/GitHub/bnb-renewal/src/collections:1): Payload 컬렉션 정의
- [src/lib](/Users/arisnoba/Documents/GitHub/bnb-renewal/src/lib:1): 공용 유틸리티와 센터 매핑
- [scripts](/Users/arisnoba/Documents/GitHub/bnb-renewal/scripts:1): 레거시 데이터 분리/정제/시드 스크립트
- [data](/Users/arisnoba/Documents/GitHub/bnb-renewal/data:1): 원본 SQL, 분리본, 정제본, 요약 파일
- [docs](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs:1): IA, DB, SEO, 배포, 운영 관련 의사결정 문서
- [deliverables](/Users/arisnoba/Documents/GitHub/bnb-renewal/deliverables:1): SEO 관련 산출물
- [plan](/Users/arisnoba/Documents/GitHub/bnb-renewal/plan:1): 견적 및 기획성 문서

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
npm run db:seed:p0-dry-run
```

## 5. 작업 원칙

이 저장소는 "한 번에 전부 이관"보다 "작은 범위 선별 이관 + 검증 후 확장" 원칙을 따른다.

- 기존 패턴을 우선 따르고, 불필요한 재설계는 피한다.
- 공개 사이트 핵심 콘텐츠부터 옮긴다.
- 개인정보가 포함된 상담 데이터는 후순위로 다룬다.
- 구현 전에 관련 문서와 현재 코드를 먼저 읽는다.
- 완료 전에는 가능한 검증을 수행하고, 못 한 검증은 명시한다.

상세 규칙은 [docs/프로젝트-작업-규칙.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/프로젝트-작업-규칙.md:1)를 기준 문서로 사용한다.

## 6. 참고 문서

- [docs/IA-사이트구조분석.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/IA-사이트구조분석.md:1): 기존 5개 사이트 구조 분석
- [docs/통합-사이트-메뉴-구조도.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/통합-사이트-메뉴-구조도.md:1): 통합 IA 방향
- [docs/SEO-URL-전략.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/SEO-URL-전략.md:1): URL, SEO, 이전 전략
- [docs/DB-마이그레이션-우선순위-계획.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/DB-마이그레이션-우선순위-계획.md:1): 단계별 데이터 이관 원칙
- [docs/배포-운영-전략.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/배포-운영-전략.md:1): 배포 구조와 비용/운영 판단

## 7. 지금 먼저 보면 좋은 순서

새로 합류한 사람이면 아래 순서가 가장 빠르다.

1. 이 `README.md`
2. [docs/프로젝트-작업-규칙.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/프로젝트-작업-규칙.md:1)
3. [docs/IA-사이트구조분석.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/IA-사이트구조분석.md:1)
4. [docs/DB-마이그레이션-우선순위-계획.md](/Users/arisnoba/Documents/GitHub/bnb-renewal/docs/DB-마이그레이션-우선순위-계획.md:1)
5. [payload.config.ts](/Users/arisnoba/Documents/GitHub/bnb-renewal/payload.config.ts:1)
