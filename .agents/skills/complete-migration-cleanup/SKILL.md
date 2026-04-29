---
name: complete-migration-cleanup
description: Project workflow for bnb-renewal migration cleanup completion. Use when the user says a migration table or media relation is cleaned up, asks for "마이그레이션 정제 완료", "대학 로고 정제 완료", "정제 끝났으니 검증 후 원격 반영", or wants Codex to verify local Postgres/Payload migration data, update the cleanup checklist, and safely prepare or execute remote Neon/R2 follow-up.
---

# Complete Migration Cleanup

## Purpose

Use this project skill to turn a user's "cleanup is done" claim into a verified migration gate.

The workflow is:

1. Verify the local MariaDB/Postgres/Payload state.
2. Update the migration cleanup checklist only when evidence supports it.
3. Run applicable local checks.
4. Separate DB remote migration from media asset remote service.
5. Report any follow-up work the user must do.

## Project Context

Work from the repository root:

```text
/Users/arisnoba/Documents/GitHub/bnb-renewal
```

Primary references:

- `docs/06-마이그레이션-정제-체크리스트.md`
- `docs/02-레거시-마이그레이션-정책.md`
- `docs/03-Payload-admin-운영-UX.md`
- `package.json`
- `src/lib/postgresTest.ts`
- `src/lib/mariaDbTest.ts`

Use the user's Korean commit/message rules from `AGENTS.md` if committing.

## Target Resolution

Map common Korean labels to Payload collection slugs:

| User phrase | Collection |
| --- | --- |
| 대학 로고, 학교 로고, 합격 학교 로고 | `exam-school-logos` |
| 뉴스, 공지 | `news` |
| 출신 아티스트, 언론, 배우 언론 | `artist-press` |
| 강사 | `teachers` |
| 커리큘럼 | `curriculums` |
| 프로필 | `profiles` |
| 오디션 일정 | `audition-schedules` |
| 출연 장면 | `screen-appearances` |
| 캐스팅 출연 | `casting-appearances` |
| 캐스팅 디렉터 | `casting-directors` |
| 합격 후기 | `exam-passed-reviews` |
| 합격 영상 | `exam-passed-videos` |
| 합격 결과 | `exam-results` |
| 에이전시 | `agencies` |

If the target cannot be inferred, ask one concise question before changing files or running write commands.

## Safety Rules

- Do not trust "done" without local evidence.
- Do not run remote write commands until the target environment and command are explicit.
- Do not treat DB relation completion as media service completion.
- Do not mark R2/media asset service complete unless the storage account, bucket, token or configured upload path, and public base URL are verified.
- Do not store developer R2 full URLs or `r2.dev` URLs as permanent DB values.
- Do not modify unrelated dirty files.
- Do not revert user changes.

## Workflow

### 1. Inspect Current State

Read only the files needed for the target:

```bash
git status --short
rg -n "target-slug|target_table|media relation field" src scripts docs package.json
```

For `exam-school-logos`, inspect:

- `src/collections/ExamSchoolLogos.ts`
- `scripts/payload-migration/link-exam-school-logo-media.ts`
- `src/lib/postgresTest.ts`
- relevant migrations in `src/migrations/`
- `docs/06-마이그레이션-정제-체크리스트.md`

### 2. Verify Local Data

Prefer existing project commands and test routes over ad hoc assumptions.

Run targeted checks when available:

```bash
npm run db:local:up
npm run payload:legacy:link-exam-school-logo-media
```

Use dry-run/default mode first if the script supports it. Only use `--write` when the user explicitly asked for writes or when the workflow already requires it and the target is local.

For Postgres/Payload relation checks, use `npm run db:local:psql` or Payload scripts as appropriate. Verify at minimum:

- target rows exist
- required fields exist
- source tracing fields remain where applicable
- relation IDs point to existing `media` rows
- media rows contain usable `url`, `filename`, and generated sizes when expected
- `/test/postgres/<slug>` has enough data to manually inspect

For `exam-school-logos`, verify:

- `exam_school_logos.school_name`
- `exam_school_logos.school_slug`
- `exam_school_logos.logo_media_id`
- referenced `media.id`
- `media.url` or `media.filename`
- generated thumbnail/sizes when present

### 3. Classify Completion

Use these labels internally and report them clearly:

- `정제 완료`: local Postgres/Payload data and relations are correct.
- `원격 DB 반영 가능`: local checks pass and remote migration/data command is identified.
- `원격 이미지 서비스 완료`: remote storage has the files and deployed app can load them.
- `후속 필요`: missing R2/storage setup, missing backup, failed check, or unverified remote state remains.

Media relation rule:

```text
media relation exists + local media row exists = DB 정제 완료 가능
media relation exists + no R2/storage verified = 원격 이미지 서비스 완료 아님
```

### 4. Update Checklist

Only update `docs/06-마이그레이션-정제-체크리스트.md` after verification.

For a completed target, change only that target checkbox from `- [ ]` to `- [x]`. If common asset checks are also verified, update only those checked items.

If verification is partial, add a short note under the relevant section instead of checking the item.

### 5. Run Project Checks

Run the highest-signal checks that match the change:

```bash
npm run typecheck
npm run lint
npm run build
```

If time or environment blocks a check, report the exact command not run and why.

### 6. Remote DB Gate

Before remote DB write, verify:

- `.env.local` is the intended remote Neon/Vercel DB environment.
- local backup/snapshot exists or the user accepts proceeding without a new one.
- migration list is known.
- local checks passed.

Remote DB command:

```bash
npm run db:remote:migrate
```

If data copy/seed is required beyond schema migration, identify the exact command or script first. Do not invent a one-off destructive data sync without user confirmation.

### 7. R2 / Media Asset Gate

If the target has `media` relations, decide whether R2 is required for the current task:

- For local cleanup and DB relation verification: R2 is not required.
- For remote image display completion: R2 or an equivalent persistent storage path is required.

Verify before asset upload:

- account owner or intended R2 account
- bucket name or object key policy
- write token/access key availability
- public base URL such as `R2_PUBLIC_BASE_URL`
- no permanent DB values depend on developer-only full URLs

If any item is missing, stop asset upload and report it as follow-up.

## Final Response

Lead with the result:

- target collection
- completion classification
- files changed
- checks run and results
- remote actions run or intentionally not run
- follow-up work for the user, if any

If follow-up exists, state it concretely. Example:

```text
후속 필요: R2 계정/버킷/공개 base URL이 아직 확인되지 않아 원격 이미지 서비스 완료로는 표시하지 않았습니다.
```
