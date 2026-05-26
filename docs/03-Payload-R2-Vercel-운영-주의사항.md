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

주기적 orphan cleanup은 안전망으로만 사용한다.

권장 기준:

- R2 `media/` prefix 전체 object 목록을 조회한다.
- 로컬 Postgres/Payload DB의 현재 media object key 목록을 만든다.
- DB에 없는 R2 object만 orphan 후보로 분류한다.
- `LastModified`가 충분히 오래된 object만 삭제한다.
- 기본은 dry-run 리포트이고, `--write` 또는 환경변수 flag가 있을 때만 삭제한다.

금지 기준:

- "게시글에 연결된 media가 없음"만으로 R2 object 삭제
- 업로드 직후 DB 갱신 전 object 삭제
- `R2_PUBLIC_BASE_URL`이 포함된 완성 URL을 기준으로 DB 값을 갱신

게시글에 연결되지 않은 media도 관리자 업로드 보관, SEO 이미지, 본문 upload node, 재사용 예정 자산일 수 있으므로 삭제 기준으로 부적합하다.

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
