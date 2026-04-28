# 로컬 Postgres와 Neon 기준 개발 환경

## 목적

MariaDB 마이그레이션이 끝나면 검증된 데이터를 PostgreSQL/Payload에 적재해야 한다. 원격 Neon에 바로 쓰기 전에 로컬 Postgres에서 마이그레이션과 시드 작업을 반복 검증한다.

## 기준

- 원격 운영 후보: Neon Postgres
- 로컬 검증 DB: Docker Compose `postgres:16-alpine`
- 로컬 DB명: `bnb_renewal`
- 로컬 사용자: `postgres`
- 로컬 포트: `5432`
- 로컬 env 파일: `config/env/local-postgres.env`

Neon은 관리형 Postgres이므로 로컬에서는 같은 Postgres 계열을 사용하되, Neon 전용 pooler/SSL 설정은 사용하지 않는다.

## 왜 별도 env 파일을 쓰는가

현재 `.env.local`은 원격 Neon을 가리킬 수 있다. Payload 설정은 `DATABASE_URL_UNPOOLED`를 `DATABASE_URL`보다 먼저 읽기 때문에, `.env.local`에서 `DATABASE_URL`만 로컬로 바꿔도 `DATABASE_URL_UNPOOLED`가 남아 있으면 원격 DB에 붙을 수 있다.

그래서 로컬 DB 작업은 `.env.local`을 직접 수정하지 않고 `config/env/local-postgres.env`를 사용한다.

Next dev 서버는 내부 재실행 과정에서 `node --env-file` 플래그와 충돌할 수 있으므로 `scripts/run-with-env.mjs`로 로컬 env를 주입한다.

## 로컬 DB 실행

```bash
npm run db:local:up
```

상태 확인:

```bash
docker compose ps postgres
```

psql 접속:

```bash
npm run db:local:psql
```

## Payload 마이그레이션

로컬 DB에 Payload 마이그레이션 적용:

```bash
npm run db:local:migrate
```

새 마이그레이션 생성이 필요할 때:

```bash
npm run db:local:migrate:create
```

관리자/앱을 로컬 DB 기준으로 실행:

```bash
npm run dev
```

Payload CLI를 로컬 DB 기준으로 실행:

```bash
npm run payload
```

`dev:local`, `payload:local`, `db:local:migrate`도 같은 로컬 DB를 가리키는 명시적 별칭으로 유지한다.

## 원격 Neon 작업과 구분

기존 명령은 `.env.local`을 사용한다.

```bash
npm run db:remote:migrate
npm run payload:remote
npm run dev:remote
```

따라서 원격 Neon에 붙어야 할 때만 `remote` 접미사가 붙은 명령을 사용한다. 관리자 UI 구축이 끝나기 전까지 기본 명령은 로컬 Postgres를 기준으로 둔다.

## 브라우저 확인 방법

로컬 DB와 앱을 실행한다.

```bash
npm run db:local:up
npm run db:migrate
npm run dev
```

브라우저에서 아래 주소를 연다.

```text
http://localhost:3000/admin
```

로컬 DB가 비어 있으면 Payload가 첫 관리자 계정 생성 화면을 보여준다. 여기서 만든 계정은 로컬 Postgres에만 저장된다.

기본 확인 URL:

```text
http://localhost:3000
http://localhost:3000/admin
http://localhost:3000/test
http://localhost:3000/test/teachers
```

MariaDB work table 확인 URL:

```text
http://localhost:3000/test/mariadb
http://localhost:3000/test/mariadb/news
http://localhost:3000/test/mariadb/teachers
http://localhost:3000/test/mariadb/profiles
```

`/admin`과 `/test/teachers`는 로컬 Postgres/Payload를 본다. `/test/mariadb/*`는 로컬 MariaDB를 본다.

## 데이터 적재 순서

```text
센터별 MariaDB 원본
  -> bnb_legacy_work.* work table
  -> FTP dry-run / download
  -> public/legacy/* 로컬 캐시
  -> 로컬 Postgres/Payload 마이그레이션
  -> 로컬 Payload 시드 검증
  -> R2 업로드 검증
  -> 원격 Neon 반영
```

## 주의사항

- 로컬 Postgres 볼륨은 `postgres-data`에 저장된다.
- 로컬 DB를 초기화해야 할 때는 먼저 백업 필요 여부를 확인한다.
- 원격 Neon에 destructive migration을 적용하기 전에는 반드시 로컬에서 같은 명령을 먼저 통과시킨다.
- `.env.local`에 원격 Neon 비밀번호가 들어 있다면 커밋하지 않는다.

## 현재 검증 상태

2026-04-22 기준으로 아래 명령을 확인했다.

```bash
npm run db:local:up
npm run db:migrate
npm run typecheck
npm run lint
```

로컬 DB 확인 결과:

- PostgreSQL `16.13`
- `payload_migrations`: `8`
- public schema table count: `28`
