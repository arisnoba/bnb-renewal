# Payload R2 Vercel 운영 주의사항

> 목적: Payload CMS를 Vercel/Next.js Node 런타임에서 Cloudflare R2와 연결할 때의 어댑터 선택, 환경변수 이전, 삭제/정리 기준을 정리한다.
> 마지막 갱신: 2026-05-26

## 결론

이 프로젝트는 Vercel의 Node.js 런타임에서 Payload CMS를 실행하므로 Cloudflare R2는 S3-compatible API 방식으로 연결한다.

사용 기준:

- 사용: `@payloadcms/storage-s3` 또는 S3-compatible API 기반 custom adapter
- 미사용: `@payloadcms/storage-r2`
- 공개 URL: `R2_PUBLIC_BASE_URL + objectKey`
- 업로드 endpoint: `R2_ENDPOINT`
- DB/Payload 저장값: R2 완성 URL이 아니라 `prefix + filename`으로 재구성 가능한 object key

Payload 공식 문서 기준으로 `@payloadcms/storage-r2`는 beta이고 Cloudflare Workers의 native R2 bucket binding을 쓰는 환경용이다. Vercel, Netlify 같은 Node.js 환경에서 R2를 연결할 때는 `@payloadcms/storage-s3`로 R2 S3-compatible API를 쓰는 방식이 안내되어 있다.

참고:

- Payload Storage Adapters: https://payloadcms.com/docs/upload/storage-adapters
- 문서 내 "Using with Cloudflare R2 (via S3 API)" 섹션
- 문서 내 "R2 Storage" 섹션

## 왜 S3 API 방식인가

Cloudflare R2에는 두 가지 접근 방식이 있다.

| 방식 | 사용 환경 | 이 프로젝트 기준 |
| --- | --- | --- |
| Cloudflare Workers R2 binding | Payload가 Cloudflare Worker 안에서 실행되는 경우 | 사용하지 않음 |
| S3-compatible API | Vercel/Netlify/일반 Node.js 서버에서 R2에 접근하는 경우 | 사용 |

Vercel에서는 Cloudflare Worker의 `env.R2` bucket binding이 없다. 따라서 `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`을 사용해 S3 API로 업로드/삭제한다.

R2 S3 API endpoint는 파일을 공개 서빙하는 URL이 아니다. 공개 서빙은 R2.dev 공개 도메인 또는 Cloudflare에 연결한 커스텀 도메인을 `R2_PUBLIC_BASE_URL`로 사용한다.

## Vercel 환경변수 이전 기준

클라이언트 Cloudflare 계정으로 전환할 때는 Vercel 프로젝트의 R2 관련 환경변수를 클라이언트 계정 값으로 교체한다.

앱 런타임 필수:

```text
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_PUBLIC_BASE_URL=
```

운영 기록 또는 Cloudflare dashboard 확인용:

```text
R2_ACCOUNT_ID=
```

현재 코드의 R2 client는 `R2_ACCOUNT_ID`를 직접 사용하지 않는다. `R2_ENDPOINT`가 이미 account id를 포함하므로 런타임 필수값은 아니다. 다만 운영 문서와 계정 식별에는 남겨둔다.

전환 시 유지해야 하는 것:

- R2 object key 구조
- DB/Payload의 `media.prefix`
- DB/Payload의 `media.filename`
- Lexical 본문 upload relation

전환 시 바뀌는 것:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL`
- 필요한 경우 `R2_ACCOUNT_ID`

DB/Payload/본문에 개발자 계정의 `r2.dev` 전체 URL이 저장되어 있으면 안 된다. 계정 전환은 같은 object key를 클라이언트 계정 R2에 올린 뒤 환경변수만 바꾸는 방식이어야 한다.

## Vercel 변수 전환 전 체크

- 클라이언트 Cloudflare 계정에 운영 R2 bucket을 만든다.
- R2 bucket의 S3 API token을 발급한다.
- R2.dev 공개 접근 또는 커스텀 도메인을 준비한다.
- `R2_ENDPOINT`는 S3 API endpoint인지 확인한다.
- `R2_PUBLIC_BASE_URL`은 공개 파일 URL인지 확인한다.
- 개발자 계정 R2에 남은 필수 object를 같은 key로 클라이언트 계정 R2에 복사한다.
- 로컬 `.env.local` 또는 Vercel env가 어느 계정을 바라보는지 명확히 구분한다.

## Vercel 변수 전환 후 검증

환경변수 교체 후에는 추측하지 말고 실제 동작을 확인한다.

필수 검증:

- R2 prefix list 가능 여부
- 테스트 object upload 가능 여부
- 테스트 object public read 가능 여부
- 테스트 object delete 가능 여부
- Payload admin에서 새 media 업로드 가능 여부
- Payload admin에서 media 삭제 시 R2 object 삭제 여부
- 기존 media 공개 URL 200 응답 여부

검증 기준:

```text
R2_ENDPOINT: 업로드/삭제 API용
R2_PUBLIC_BASE_URL: 브라우저 공개 URL용
```

두 값을 혼동하면 업로드는 되지만 브라우저에서 이미지가 안 보이거나, 공개 URL을 DB에 저장하는 잘못된 구조가 생긴다.

## 삭제와 orphan 정리

정상 삭제의 1차 책임은 Payload media 삭제 훅이다. media 문서를 삭제할 때 R2 object도 같이 삭제되어야 한다.

주의점:

- Payload cloud storage delete hook은 삭제되는 media doc의 `filename`, `sizes`, `prefix` 정보를 필요로 한다.
- DELETE route나 local API에서 `select`를 너무 좁히면 삭제 훅이 object key를 계산하지 못할 수 있다.
- 다중 삭제는 완료 메시지 전에 모든 삭제가 끝나야 하며, 완료 후에도 R2 object가 남으면 삭제 훅 또는 delete handler 문제로 본다.

### orphan 발생 구조

orphan 미디어는 두 가지 경로로 발생한다. 접근 방식이 다르므로 구분한다.

**유형 A — 미참조 media 문서 (주된 orphan)**

Posts/News 등 게시글을 삭제해도 그 게시글이 참조하던 media 문서는 함께 삭제되지 않는다. `upload` relation은 cascade 삭제가 없기 때문이다. 게시글을 지웠다 다시 쓰면 새 media가 누적된다.

이 유형은 media DB 행이 멀쩡히 존재하므로 R2 object list로는 절대 탐지할 수 없다.

**유형 B — DB 행 없는 R2 object (보조 백스톱)**

업로드 실패, 계정 이전 잔여물 등으로 R2에는 object가 있지만 media DB 행이 없는 경우다.

**유형 C — `admin-images/` 직접 업로드 미참조 object**

`ImagePathField`와 강사/프로필 갤러리 커스텀 업로드 UI는 Payload `media` 문서를 만들지 않고 `/api/admin-images`를 통해 R2 `admin-images/YYYY/MM/...` object를 먼저 생성한 뒤, 완성 URL을 텍스트 필드에 저장한다. 관리자가 업로드 후 게시글을 저장하지 않고 이탈하면 DB 참조 없이 R2 object만 남을 수 있다.

### 정리 방법

**유형 A 정리 (DB 참조 그래프 스캔) — 구현 예정**

R2를 직접 건드리지 않고, DB의 참조 그래프를 스캔해 "어떤 문서에도 참조되지 않는 media 문서"를 찾아 `payload.delete()`로 삭제한다. 삭제는 storage adapter `handleDelete`(`src/plugins/index.ts:110`) 경로로 R2 원본까지 cascade된다.

구현 시 필수 보호 규칙:

- **유예기간**: `createdAt`이 `ORPHAN_GRACE_DAYS`(기본 30일) 이내 문서는 제외. 업로드 직후 DB 갱신 전 삭제 사고 방지.
- **`keepAlways` 플래그**: Media 문서에 boolean 필드를 추가해 SEO 이미지, 재사용 예정 자산 등을 영구 제외.
- **스캔 실패 감지**: 참조 ID 집합이 0이면 스캔 버그로 보고 즉시 중단. 전량 삭제 사고 방지.
- **config introspection**: 참조 컬렉션/필드를 하드코딩하지 말고 `payload.config.collections`를 재귀 탐색해 `type==='upload' && relationTo==='media'` 필드를 자동 수집. 신규 컬렉션 추가 시 자동 반영.
- Lexical 본문의 `MediaBlock`과 upload node도 반드시 포함.

실행 순서:

1. `scripts/payload-migration/plan-orphan-media-cleanup.ts` dry-run으로 후보 목록 확인.
2. 참조 중인 media가 후보에 없는지, 유예기간·`keepAlways` 보호가 작동하는지 검증.
3. `--write`로 실제 삭제 실행.
4. 검증 후 Vercel cron(`0 18 * * 0` 등)으로 주기적 자동화. 초기에는 report-only 모드로 운영해 오탐 없음을 확인한 뒤 삭제 활성화(`ORPHAN_SWEEP_DELETE=1`).

**유형 B 정리 (R2 object list 스캔) — 보조 백스톱**

`src/lib/r2.ts`의 R2 object list helper를 재사용해 구현한다.

권장 기준:

- R2 `media/` prefix 전체 object 목록을 조회한다.
- 로컬 Postgres/Payload DB의 현재 media object key 목록을 만든다.
- DB에 없는 R2 object만 orphan 후보로 분류한다.
- `LastModified`가 충분히 오래된 object만 삭제한다.
- 기본은 dry-run 리포트이고, `--write` 또는 환경변수 flag가 있을 때만 삭제한다.

**유형 C 정리 (`admin-images/` 전용 스캔) — 구현됨**

`scripts/payload-migration/plan-admin-images-cleanup.ts`는 Payload 컬렉션 설정에서 `ImagePathField`와 `TeacherAdditionalPhotosField` 계열 커스텀 필드를 자동 수집하고, 저장된 문서 값을 R2 object key로 정규화해 `admin-images/` 목록과 비교한다.

보호 규칙:

- 기본 유예기간은 7일이다. `--grace-days 0`처럼 명시하지 않는 한 최근 업로드는 삭제 후보에서 제외한다.
- 기본은 dry-run이다. `--write`가 있을 때만 R2 object를 삭제한다.
- 비로컬 DB/R2 삭제는 `ALLOW_DESTRUCTIVE_C0=1`이 없으면 중단한다.
- 참조 key가 0건인데 삭제 후보가 있으면 스캔 오류 가능성으로 중단한다. 정말 전체가 미참조라면 `--allow-empty-reference-set`을 명시한다.

실행:

```bash
npm run payload:plan-admin-images-cleanup
ALLOW_DESTRUCTIVE_C0=1 npm run payload:cleanup-admin-images:write
```

### 금지 기준

- 유형 A 정리에 R2 object list 방식을 쓰는 것 (유형 A orphan은 DB 행이 있어서 탐지 불가)
- 참조 컬렉션/필드를 하드코딩으로 나열하는 것 (신규 컬렉션 누락 시 참조 중인 media를 삭제하는 사고로 이어짐)
- 업로드 직후 DB 갱신 전 object 삭제
- `R2_PUBLIC_BASE_URL`이 포함된 완성 URL을 기준으로 DB 값을 갱신
- "게시글에 연결된 media가 없음"만으로 R2 object 삭제 (SEO 이미지, 재사용 예정 자산, 관리자 업로드 보관 등 의도적 미참조가 있음)

## orphan 정리 구현 계획

유형 A 정리를 3단계로 나눠 구현한다.

### Phase 1 — 미참조 미디어 스윕 스크립트

신규 파일: `scripts/payload-migration/plan-orphan-media-cleanup.ts`

**참조 ID 수집 (config introspection)**

`payload.config.collections`를 순회하며 각 컬렉션의 필드 트리를 재귀 탐색한다. group/array/row/collapsible/tabs/blocks 내부까지 포함해서 `type==='upload' && relationTo==='media'` 필드 경로를 자동 수집한다.

`type==='richText'` 필드는 별도 처리한다. 저장된 Lexical JSON을 재귀 walk하여 `MediaBlock` block 노드의 `fields.media`와 Lexical upload 노드(`type==='upload'`, `relationTo==='media'`)의 `value`에서 media id를 추출한다.

각 컬렉션을 `payload.find({ depth: 0, pagination: false, limit: 0 })`로 전수 조회하며 수집한 경로에서 media id를 모아 `referencedIds: Set<number>`를 구성한다.

**후보 판별**

`media` 컬렉션을 전수 조회해 아래를 모두 만족하는 문서를 삭제 후보로 분류한다.

- `referencedIds`에 없음
- `keepAlways !== true` (Phase 2에서 추가하는 보호 플래그)
- `createdAt`이 `ORPHAN_GRACE_DAYS`(기본 30일)보다 오래됨

**안전벨트**

- `referencedIds.size === 0`이면 스캔 실패로 보고 즉시 중단한다.
- `hasR2Config()` 확인.
- dry-run 기본: 후보 id/filename/prefix/createdAt 표와 예상 건수만 출력.
- `--write`일 때만 `for...of`로 **순차** `payload.delete({ collection: 'media', id })`를 실행한다. 대량 단일 트랜잭션을 피하기 위해 건별 처리한다.
- 비로컬 DB 쓰기는 `ALLOW_DESTRUCTIVE_C0=1` 가드를 기존 스크립트와 동일하게 적용한다.

**package.json 스크립트 등록**

```text
payload:plan-orphan-media-cleanup        # dry-run, local postgres
payload:cleanup-orphan-media:write       # --write, .env.local + local postgres 강제
```

**Phase 1 검증 체크리스트**

- [ ] 로컬에서 게시글 생성 → heroImage/본문에 이미지 업로드 → 게시글 삭제로 미참조 media 생성
- [ ] dry-run: 방금 만든 미참조 media가 후보에 잡히는지 확인
- [ ] dry-run: 참조 중인 media는 후보에 없는지 확인
- [ ] `ORPHAN_GRACE_DAYS=0`으로 유예기간 토글해 동작 확인
- [ ] `--write` 실행 후 media 문서 삭제 확인 + R2 공개 URL 404 확인
- [ ] `referencedIds.size === 0` 강제 상황에서 중단되는지 확인

### Phase 2 — `keepAlways` 보호 플래그 + 마이그레이션

`src/collections/Media.ts`의 `fields` 배열에 아래 필드를 추가한다.

```ts
{
  name: 'keepAlways',
  type: 'checkbox',
  defaultValue: false,
  label: '자동 정리 제외',
  admin: {
    description: '체크 시 미참조여도 자동 정리 대상에서 영구 제외 (SEO 이미지, 재사용 예정 자산 등)',
  },
}
```

Postgres 스키마 변경이므로 마이그레이션이 필요하다.

```bash
pnpm payload migrate:create add_media_keep_always
# 생성된 파일 내용 확인 후
pnpm payload migrate
```

Phase 1 스크립트는 이 필드를 후보 판별 조건에 포함한다.

### Phase 3 — Vercel cron 자동화 (Phase 1 검증 후)

Phase 1 dry-run으로 오탐이 없음을 확인한 뒤 진행한다.

**API 라우트**: `src/app/(payload)/api/cron/orphan-media-sweep/route.ts`

- `Authorization: Bearer ${CRON_SECRET}` 검증. 불일치 시 401 반환.
- Phase 1의 스캔·판별 로직을 공유 모듈로 추출해 재사용.
- 초기에는 report-only(후보 건수·목록 로깅만). 운영 로그로 오탐 없음을 확인한 뒤 `ORPHAN_SWEEP_DELETE=1` env flag로 삭제 활성화.

**Vercel 스케줄 설정**: `vercel.ts`(프로젝트 루트)

```ts
import { type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  crons: [{ path: '/api/cron/orphan-media-sweep', schedule: '0 18 * * 0' }], // 매주 일요일 18시
}
```

`CRON_SECRET`은 `vercel env add CRON_SECRET`으로 등록한다.

**Phase 3 검증 체크리스트**

- [ ] `Authorization` 헤더 없이 호출 시 401
- [ ] 올바른 `CRON_SECRET`으로 호출 시 report-only 결과 반환
- [ ] Vercel preview에서 cron 경로 수동 트리거로 로그 확인
- [ ] `ORPHAN_SWEEP_DELETE=1` 설정 후 실제 삭제 확인

**신규/수정 파일 요약**

| 파일 | 상태 |
| --- | --- |
| `scripts/payload-migration/plan-orphan-media-cleanup.ts` | 신규 |
| `src/collections/Media.ts` | 수정 (`keepAlways` 필드 추가) |
| `src/migrations/*_add_media_keep_always.ts` | 신규 (자동 생성) |
| `package.json` | 수정 (스크립트 2개 추가) |
| `src/app/(payload)/api/cron/orphan-media-sweep/route.ts` | 신규 (Phase 3) |
| `vercel.ts` | 신규 (Phase 3) |

## 운영 순서

1. 클라이언트 R2 계정 환경변수를 로컬 또는 Vercel preview에 먼저 적용한다.
2. list/upload/public-read/delete 스모크 테스트를 통과시킨다.
3. R2 대량 업로드 스크립트를 클라이언트 계정 대상으로 실행한다.
4. 로컬 Postgres/Payload DB의 `media.prefix`와 R2 object count를 비교한다.
5. 샘플 공개 URL을 확인한다.
6. 삭제 훅을 테스트한다.
7. 필요하면 orphan cleanup dry-run 리포트를 만든다.
8. 검증 후 Vercel production env를 같은 값으로 전환한다.

운영 전환 중에는 개발자 계정과 클라이언트 계정 R2가 섞이지 않게 한다. 같은 object key라도 서로 다른 계정의 bucket에 존재할 수 있으므로, 검증 로그에는 어느 `R2_ENDPOINT`와 `R2_PUBLIC_BASE_URL`을 기준으로 했는지 남긴다.
