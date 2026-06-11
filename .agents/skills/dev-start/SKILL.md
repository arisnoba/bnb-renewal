---
name: dev-start
description: 로컬 개발 환경 시작. Docker DB 컨테이너 기동 후 Next.js dev server를 실행합니다.
disable-model-invocation: true
---

## 로컬 개발 환경 시작

### 기본 시작 (PostgreSQL + Next.js)
```bash
npm run db:local:up && npm run dev
```

### 레거시 MariaDB도 필요한 경우
```bash
npm run db:local:up && npm run legacy:db:up && npm run dev
```

### 포트 안내
- Next.js: http://localhost:3000
- Payload Admin: http://localhost:3000/admin
- PostgreSQL: localhost:5432

### 환경변수
로컬 실행은 `config/env/local-postgres.env`를 자동으로 참조합니다.
원격 DB 연결이 필요하면 `.env.local`을 사용하고 `npm run dev:remote`를 실행하세요.

### 트러블슈팅
- 포트 충돌 시: `lsof -ti:3000 | xargs kill -9`
- DB 컨테이너 재시작: `docker compose restart postgres`
- DB 초기화 후 마이그레이션: `npm run db:local:migrate`
