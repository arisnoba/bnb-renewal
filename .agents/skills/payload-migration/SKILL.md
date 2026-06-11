---
name: payload-migration
description: PayloadCMS 마이그레이션 파일 생성 및 적용. 컬렉션 스키마 변경 후 실행.
---

## PayloadCMS 마이그레이션 워크플로우

컬렉션(`.ts`) 파일을 변경한 뒤 반드시 아래 순서대로 실행하세요.

### 1단계: 마이그레이션 파일 생성
```bash
npm run db:local:migrate:create
```
→ `src/migrations/` 에 새 파일이 생성됩니다.

### 2단계: `src/migrations/index.ts` 등록 확인
생성된 파일이 `index.ts`에 자동 등록됐는지 확인하세요. 없으면 수동으로 추가합니다.

### 3단계: 마이그레이션 실행
```bash
npm run db:local:migrate
```

### 4단계: Payload 타입 재생성
```bash
npm run payload:generate-types
```

### 5단계: importMap 재생성 (새 커스텀 컴포넌트 추가 시만)
```bash
npm run payload:generate-importmap
```

---

### 주의 사항
- `required: true` 추가는 DB `NOT NULL` 변경을 유발할 수 있으므로, 기존 데이터가 있는 컬렉션에서는 field-level `validate`를 우선 사용하세요 (AGENTS.md 참고).
- 마이그레이션 파일은 직접 편집하지 않는 것을 권장합니다. 필요하면 파일 안에 raw SQL을 추가하세요.
- 원격 DB에 적용할 때는 `npm run db:remote:migrate`를 사용합니다.
