---
name: complete-migration-cleanup
description: Project workflow for bnb-renewal local migration cleanup completion. Use when the user says a collection/table cleanup is done, asks for "정제 끝났어", "마이그레이션 정제 완료", "레거시 DB 및 칼럼 정리", or wants Codex to verify local Postgres/Payload data and remove obsolete local legacy columns, fields, and migration-only code.
---

# Complete Migration Cleanup

## Purpose

Use this project skill to turn a user's "cleanup is done" claim into a verified local Postgres cleanup.

The workflow is:

1. Verify the local Postgres/Payload state with evidence.
2. Identify legacy fields, migration-only columns, and transitional scripts that can be safely removed or narrowed.
3. Make the smallest collection/schema/migration changes needed for the completed target.
4. Apply the cleanup to local Postgres only.
5. Run local checks.
6. Update the migration cleanup checklist.
7. Report what changed.

This skill is not a remote deployment workflow. Do not push schema/data changes to remote Neon/Vercel/R2 from this skill.

`docs/06-마이그레이션-정제-체크리스트.md` is a required deliverable for this workflow. If a target reaches `로컬 DB 정리 완료` or `코드 정리 완료`, update that checklist before committing or reporting completion.

## Project Context

Work from the repository root:

```text
/Users/arisnoba/Documents/GitHub/bnb-renewal
```

Primary references:

- `package.json`
- target collection in `src/collections/`
- relevant migrations in `src/migrations/`
- relevant scripts in `scripts/payload-migration/`
- `src/lib/postgresTest.ts`
- `docs/06-마이그레이션-정제-체크리스트.md`
- `docs/02-레거시-마이그레이션-정책.md`

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

- Do not trust "done" without local DB evidence.
- Do not run remote write commands from this skill.
- Do not run `npm run db:remote:migrate`, remote seed/sync scripts, R2 upload scripts, or deployment commands unless the user explicitly changes the task.
- Do not remove source tracing fields until the target data has been verified locally and no remaining local script/runtime path needs them.
- Do not remove media path fields before media relations are populated and verified.
- Do not modify unrelated dirty files.
- Do not revert user changes.
- Keep cleanup reversible through a normal Payload migration `down` function when practical.

## Workflow

### 1. Inspect Current State

Read only the files needed for the target:

```bash
git status --short
rg -n "<target>|legacyCollapsible|legacyTab|sourceDb|sourceTable|sourceId|legacyMeta|bodyHtml|imagePath|profileImagePath|logoMedia" src scripts docs package.json
ls -1 src/migrations
```

Inspect the target collection, related migration files, and target-specific migration scripts before deciding what to remove.

For example, for `agencies`, inspect:

- `src/collections/Agencies.ts`
- `scripts/payload-migration/seed-work-tables.ts`
- `scripts/payload-migration/link-agency-logo-media.ts`
- recent agency migrations in `src/migrations/`
- local Postgres columns for `agencies` and `agencies_actors`

### 2. Verify Local Data

Prefer existing project commands and direct local Postgres checks over assumptions.

Start local Postgres when needed:

```bash
npm run db:local:up
```

If Docker uses Colima and the default socket is unavailable, use the project's existing Docker/Colima pattern and report that condition.

Use `psql` or `npm run db:local:psql` to verify at minimum:

- target rows exist
- required operational fields are populated
- replacement fields or relations are populated
- relation IDs point to existing rows, especially `media`
- obsolete legacy columns are no longer needed by local runtime or scripts
- `/test/postgres/<slug>` still has enough data for manual inspection when applicable

For media relation cleanups, verify:

- target relation column exists, for example `logo_media_id`
- relation count matches expected target rows
- referenced `media.id` rows exist
- `media.url` or `media.filename` is usable locally

### 3. Decide Cleanup Scope

Use the smallest local cleanup that matches the completed target.

Common cleanup actions:

- remove legacy/admin fields from the target collection config
- remove `legacyCollapsible()` or `legacyTab()` only for the completed target
- add a Payload migration that drops obsolete local Postgres columns
- drop obsolete unique indexes tied only to removed fields, such as a migration slug index
- adjust migration/seed scripts so the target no longer requires removed fields
- keep scripts for unfinished collections unchanged

Common fields to consider only after verification:

- `source_db`
- `source_table`
- `source_id`
- `slug` when it was only a migration/source key and no longer a public/admin identifier
- `legacy_meta`
- `body_html`
- legacy image path columns replaced by media relations

Do not remove fields still used by frontend fallback logic, admin custom fields, local test pages, or remaining migration scripts.

### 4. Implement Local Cleanup

Use existing project patterns for migrations.

For field removal migrations:

```ts
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "<target>_slug_idx";

    ALTER TABLE "<target>" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "<target>" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "<target>" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "<target>" DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "<target>" DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "<target>" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "<target>" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "<target>" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "<target>" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "<target>" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;
  `)
}
```

Match the existing migration style in `src/migrations/`. Add the migration to `src/migrations/index.ts`.

### 5. Apply To Local Postgres

Apply only to local Postgres:

```bash
npm run db:local:migrate
```

If Payload warns that dev mode dynamically pushed changes, proceed only when the cleanup is local and expected. Use an interactive TTY if the command prompts.

Do not run remote migration commands in this workflow.

### 6. Verify Cleanup

After local migration, verify with direct DB checks:

```bash
psql postgresql://postgres:postgres@127.0.0.1:5432/bnb_renewal -c "select column_name from information_schema.columns where table_schema = 'public' and table_name = '<target_table>' order by ordinal_position;"
psql postgresql://postgres:postgres@127.0.0.1:5432/bnb_renewal -c "select name, batch, updated_at from payload_migrations where name like '%<target>%' order by updated_at;"
```

For relation-backed cleanup, also verify counts:

```bash
psql postgresql://postgres:postgres@127.0.0.1:5432/bnb_renewal -c "select count(*) as total, count(<relation_column>) as with_relation from <target_table>;"
```

### 7. Run Project Checks

Run the highest-signal checks that match the change:

```bash
npm run payload:generate-types
npm run typecheck
npm run lint
npm run build
```

If build-generated files change only as incidental artifacts, avoid leaving unrelated churn.

If time or environment blocks a check, report the exact command not run and why.

### 8. Update Cleanup Checklist

Before committing or reporting completion, update `docs/06-마이그레이션-정제-체크리스트.md` for the target collection:

- mark the target checklist item complete only after local DB evidence exists
- update the target's `주요 확인` line if the final cleaned fields changed
- record removed local columns, new relation/gallery/version fields, and applied migration names
- record concrete counts from verification, such as total rows, relation counts, gallery counts, or missing-file counts
- if a criterion does not apply because the final cleanup intentionally removed that field, explain the replacement evidence in the checklist

Treat an unmodified checklist as an incomplete cleanup unless the target was already checked and the current work did not change its status or evidence.

## Completion Classification

Use these labels internally and report them clearly:

- `로컬 DB 정리 완료`: local Postgres schema/data is cleaned and verified for the target.
- `코드 정리 완료`: collection config, migration index, and related local scripts match the cleaned schema.
- `후속 필요`: local data is incomplete, a field is still used, a migration failed, or checks failed.

Do not use remote completion labels in this skill.

## Final Response

Lead with the result:

- target collection
- local cleanup classification
- local Postgres columns or relations verified
- files changed
- checklist update status
- checks run and results
- remote actions intentionally not run
- follow-up work, if any

Example:

```text
에이전시 로컬 DB 정리 완료했습니다. 로컬 Postgres `agencies`에서 `source_db/source_table/source_id/slug/legacy_meta`가 제거됐고, `logo_media_id`는 78/78건 유지됐습니다. 원격 DB/R2는 건드리지 않았습니다.
```
