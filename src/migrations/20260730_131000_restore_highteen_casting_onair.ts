import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'

import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import recoveryPayload from './20260730_131000_restore_highteen_casting_onair.json'

const cleanupMigrationName = '20260727_160000_news_unused_categories_cleanup'
const expectedCounts = {
  news: 177,
  newsCenters: 177,
  newsVersions: 17,
  newsVersionCenters: 17,
} as const

type RecoveryData = {
  news: Record<string, unknown>[]
  newsCenters: Record<string, unknown>[]
  newsVersions: Record<string, unknown>[]
  newsVersionCenters: Record<string, unknown>[]
}

type PreflightRow = {
  centerIdConflicts: string | number
  cleanupMigrationRows: string | number
  existingTargetRows: string | number
  missingMediaRows: string | number
  newsIdConflicts: string | number
  newsSlugConflicts: string | number
  versionCenterIdConflicts: string | number
  versionIdConflicts: string | number
}

type RestoredStateRow = {
  centerDiffRows: string | number
  draftRows: string | number
  newsDiffRows: string | number
  publishedRows: string | number
  targetCenterRows: string | number
  targetNewsRows: string | number
  targetVersionCenterRows: string | number
  targetVersionRows: string | number
  versionCenterDiffRows: string | number
  versionDiffRows: string | number
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const recoveryData = loadRecoveryData()
  const serialized = serializeRecoveryData(recoveryData)
  const preflight = firstRow<PreflightRow>(
    await db.execute(sql`
      WITH
        "recovery_news" AS (
          SELECT *
          FROM jsonb_to_recordset(${serialized.news}::jsonb)
            AS "row"(
              "id" integer,
              "slug" text,
              "thumbnail_media_id" integer,
              "meta_image_id" integer
            )
        ),
        "recovery_centers" AS (
          SELECT *
          FROM jsonb_to_recordset(${serialized.newsCenters}::jsonb)
            AS "row"("id" integer)
        ),
        "recovery_versions" AS (
          SELECT *
          FROM jsonb_to_recordset(${serialized.newsVersions}::jsonb)
            AS "row"(
              "id" integer,
              "version_thumbnail_media_id" integer,
              "version_meta_image_id" integer
            )
        ),
        "recovery_version_centers" AS (
          SELECT *
          FROM jsonb_to_recordset(${serialized.newsVersionCenters}::jsonb)
            AS "row"("id" integer)
        ),
        "recovery_media" AS (
          SELECT "thumbnail_media_id" AS "id"
          FROM "recovery_news"
          WHERE "thumbnail_media_id" IS NOT NULL
          UNION
          SELECT "meta_image_id"
          FROM "recovery_news"
          WHERE "meta_image_id" IS NOT NULL
          UNION
          SELECT "version_thumbnail_media_id"
          FROM "recovery_versions"
          WHERE "version_thumbnail_media_id" IS NOT NULL
          UNION
          SELECT "version_meta_image_id"
          FROM "recovery_versions"
          WHERE "version_meta_image_id" IS NOT NULL
        )
      SELECT
        (
          SELECT count(*)
          FROM "news"
          JOIN "recovery_news" USING ("id")
        ) AS "newsIdConflicts",
        (
          SELECT count(*)
          FROM "news"
          JOIN "recovery_news" USING ("slug")
        ) AS "newsSlugConflicts",
        (
          SELECT count(*)
          FROM "news_centers"
          JOIN "recovery_centers" USING ("id")
        ) AS "centerIdConflicts",
        (
          SELECT count(*)
          FROM "_news_v"
          JOIN "recovery_versions" USING ("id")
        ) AS "versionIdConflicts",
        (
          SELECT count(*)
          FROM "_news_v_version_centers"
          JOIN "recovery_version_centers" USING ("id")
        ) AS "versionCenterIdConflicts",
        (
          SELECT count(*)
          FROM "recovery_media"
          LEFT JOIN "media" USING ("id")
          WHERE "media"."id" IS NULL
        ) AS "missingMediaRows",
        (
          SELECT count(*)
          FROM "news"
          WHERE "category" = '캐스팅OnAir'
            AND EXISTS (
              SELECT 1
              FROM "news_centers"
              WHERE "news_centers"."parent_id" = "news"."id"
                AND "news_centers"."value"::text = 'highteen'
            )
        ) AS "existingTargetRows",
        (
          SELECT count(*)
          FROM "payload_migrations"
          WHERE "name" = ${cleanupMigrationName}
        ) AS "cleanupMigrationRows";
    `),
  )

  assertPreflight(preflight)

  await db.execute(sql`
    INSERT INTO "news" (
      "id",
      "slug",
      "title",
      "category",
      "excerpt",
      "author_name",
      "published_at",
      "display_status",
      "view_count",
      "updated_at",
      "created_at",
      "body",
      "thumbnail_media_id",
      "meta_title",
      "meta_image_id",
      "meta_description"
    )
    SELECT
      "id",
      "slug",
      "title",
      "category"::"enum_news_category",
      "excerpt",
      "author_name",
      "published_at",
      "display_status"::"enum_news_display_status",
      "view_count",
      "updated_at",
      "created_at",
      "body",
      "thumbnail_media_id",
      "meta_title",
      "meta_image_id",
      "meta_description"
    FROM jsonb_to_recordset(${serialized.news}::jsonb)
      AS "row"(
        "id" integer,
        "slug" text,
        "title" text,
        "category" text,
        "excerpt" text,
        "author_name" text,
        "published_at" timestamptz,
        "display_status" text,
        "view_count" numeric,
        "updated_at" timestamptz,
        "created_at" timestamptz,
        "body" jsonb,
        "thumbnail_media_id" integer,
        "meta_title" text,
        "meta_image_id" integer,
        "meta_description" text
      )
    ORDER BY "id";
  `)

  await db.execute(sql`
    INSERT INTO "news_centers" ("order", "parent_id", "value", "id")
    SELECT
      "order",
      "parent_id",
      "value"::"enum_news_centers",
      "id"
    FROM jsonb_to_recordset(${serialized.newsCenters}::jsonb)
      AS "row"(
        "order" integer,
        "parent_id" integer,
        "value" text,
        "id" integer
      )
    ORDER BY "id";
  `)

  await db.execute(sql`
    INSERT INTO "_news_v" (
      "id",
      "parent_id",
      "version_title",
      "version_category",
      "version_excerpt",
      "version_body",
      "version_thumbnail_media_id",
      "version_meta_title",
      "version_meta_image_id",
      "version_meta_description",
      "version_display_status",
      "version_view_count",
      "version_published_at",
      "version_author_name",
      "version_slug",
      "version_updated_at",
      "version_created_at",
      "created_at",
      "updated_at"
    )
    SELECT
      "id",
      "parent_id",
      "version_title",
      "version_category"::"enum__news_v_version_category",
      "version_excerpt",
      "version_body",
      "version_thumbnail_media_id",
      "version_meta_title",
      "version_meta_image_id",
      "version_meta_description",
      "version_display_status"::"enum__news_v_version_display_status",
      "version_view_count",
      "version_published_at",
      "version_author_name",
      "version_slug",
      "version_updated_at",
      "version_created_at",
      "created_at",
      "updated_at"
    FROM jsonb_to_recordset(${serialized.newsVersions}::jsonb)
      AS "row"(
        "id" integer,
        "parent_id" integer,
        "version_title" text,
        "version_category" text,
        "version_excerpt" text,
        "version_body" jsonb,
        "version_thumbnail_media_id" integer,
        "version_meta_title" text,
        "version_meta_image_id" integer,
        "version_meta_description" text,
        "version_display_status" text,
        "version_view_count" numeric,
        "version_published_at" timestamptz,
        "version_author_name" text,
        "version_slug" text,
        "version_updated_at" timestamptz,
        "version_created_at" timestamptz,
        "created_at" timestamptz,
        "updated_at" timestamptz
      )
    ORDER BY "id";
  `)

  await db.execute(sql`
    INSERT INTO "_news_v_version_centers" ("order", "parent_id", "value", "id")
    SELECT
      "order",
      "parent_id",
      "value"::"enum__news_v_version_centers",
      "id"
    FROM jsonb_to_recordset(${serialized.newsVersionCenters}::jsonb)
      AS "row"(
        "order" integer,
        "parent_id" integer,
        "value" text,
        "id" integer
      )
    ORDER BY "id";
  `)

  await assertRestoredState({ db, serialized })
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const recoveryData = loadRecoveryData()
  const serialized = serializeRecoveryData(recoveryData)

  await assertRestoredState({ db, serialized })

  await db.execute(sql`
    DELETE FROM "_news_v"
    WHERE "id" IN (
      SELECT "id"
      FROM jsonb_to_recordset(${serialized.newsVersions}::jsonb)
        AS "row"("id" integer)
    );
  `)

  await db.execute(sql`
    DELETE FROM "news"
    WHERE "id" IN (
      SELECT "id"
      FROM jsonb_to_recordset(${serialized.news}::jsonb)
        AS "row"("id" integer)
    );
  `)

  const remaining = firstRow<Record<string, string | number>>(
    await db.execute(sql`
      SELECT
        (
          SELECT count(*)
          FROM "news"
          WHERE "id" IN (
            SELECT "id"
            FROM jsonb_to_recordset(${serialized.news}::jsonb)
              AS "row"("id" integer)
          )
        ) AS "news",
        (
          SELECT count(*)
          FROM "_news_v"
          WHERE "id" IN (
            SELECT "id"
            FROM jsonb_to_recordset(${serialized.newsVersions}::jsonb)
              AS "row"("id" integer)
          )
        ) AS "newsVersions";
    `),
  )

  assertCount(remaining.news, 0, '복구 뉴스 롤백 잔여 건수')
  assertCount(remaining.newsVersions, 0, '복구 뉴스 버전 롤백 잔여 건수')
}

async function assertRestoredState({
  db,
  serialized,
}: {
  db: MigrateUpArgs['db']
  serialized: ReturnType<typeof serializeRecoveryData>
}) {
  const restoredState = firstRow<RestoredStateRow>(
    await db.execute(sql`
      WITH
        "recovery_news" AS (
          SELECT "id"
          FROM jsonb_to_recordset(${serialized.news}::jsonb)
            AS "row"("id" integer)
        ),
        "recovery_centers" AS (
          SELECT "id"
          FROM jsonb_to_recordset(${serialized.newsCenters}::jsonb)
            AS "row"("id" integer)
        ),
        "recovery_versions" AS (
          SELECT "id"
          FROM jsonb_to_recordset(${serialized.newsVersions}::jsonb)
            AS "row"("id" integer)
        ),
        "recovery_version_centers" AS (
          SELECT "id"
          FROM jsonb_to_recordset(${serialized.newsVersionCenters}::jsonb)
            AS "row"("id" integer)
        ),
        "news_diff" AS (
          (
            SELECT to_jsonb("news") AS "row"
            FROM "news"
            JOIN "recovery_news" USING ("id")
            EXCEPT ALL
            SELECT "value"
            FROM jsonb_array_elements(${serialized.news}::jsonb)
          )
          UNION ALL
          (
            SELECT "value"
            FROM jsonb_array_elements(${serialized.news}::jsonb)
            EXCEPT ALL
            SELECT to_jsonb("news")
            FROM "news"
            JOIN "recovery_news" USING ("id")
          )
        ),
        "center_diff" AS (
          (
            SELECT to_jsonb("news_centers") AS "row"
            FROM "news_centers"
            JOIN "recovery_centers" USING ("id")
            EXCEPT ALL
            SELECT "value"
            FROM jsonb_array_elements(${serialized.newsCenters}::jsonb)
          )
          UNION ALL
          (
            SELECT "value"
            FROM jsonb_array_elements(${serialized.newsCenters}::jsonb)
            EXCEPT ALL
            SELECT to_jsonb("news_centers")
            FROM "news_centers"
            JOIN "recovery_centers" USING ("id")
          )
        ),
        "version_diff" AS (
          (
            SELECT to_jsonb("_news_v") AS "row"
            FROM "_news_v"
            JOIN "recovery_versions" USING ("id")
            EXCEPT ALL
            SELECT "value"
            FROM jsonb_array_elements(${serialized.newsVersions}::jsonb)
          )
          UNION ALL
          (
            SELECT "value"
            FROM jsonb_array_elements(${serialized.newsVersions}::jsonb)
            EXCEPT ALL
            SELECT to_jsonb("_news_v")
            FROM "_news_v"
            JOIN "recovery_versions" USING ("id")
          )
        ),
        "version_center_diff" AS (
          (
            SELECT to_jsonb("_news_v_version_centers") AS "row"
            FROM "_news_v_version_centers"
            JOIN "recovery_version_centers" USING ("id")
            EXCEPT ALL
            SELECT "value"
            FROM jsonb_array_elements(${serialized.newsVersionCenters}::jsonb)
          )
          UNION ALL
          (
            SELECT "value"
            FROM jsonb_array_elements(${serialized.newsVersionCenters}::jsonb)
            EXCEPT ALL
            SELECT to_jsonb("_news_v_version_centers")
            FROM "_news_v_version_centers"
            JOIN "recovery_version_centers" USING ("id")
          )
        ),
        "target_news" AS (
          SELECT "news"."id", "news"."display_status"
          FROM "news"
          WHERE "category" = '캐스팅OnAir'
            AND EXISTS (
              SELECT 1
              FROM "news_centers"
              WHERE "news_centers"."parent_id" = "news"."id"
                AND "news_centers"."value"::text = 'highteen'
            )
        )
      SELECT
        (SELECT count(*) FROM "news_diff") AS "newsDiffRows",
        (SELECT count(*) FROM "center_diff") AS "centerDiffRows",
        (SELECT count(*) FROM "version_diff") AS "versionDiffRows",
        (SELECT count(*) FROM "version_center_diff") AS "versionCenterDiffRows",
        (SELECT count(*) FROM "target_news") AS "targetNewsRows",
        (
          SELECT count(*)
          FROM "target_news"
          WHERE "display_status" = 'published'
        ) AS "publishedRows",
        (
          SELECT count(*)
          FROM "target_news"
          WHERE "display_status" = 'draft'
        ) AS "draftRows",
        (
          SELECT count(*)
          FROM "news_centers"
          JOIN "recovery_centers" USING ("id")
        ) AS "targetCenterRows",
        (
          SELECT count(*)
          FROM "_news_v"
          JOIN "recovery_versions" USING ("id")
        ) AS "targetVersionRows",
        (
          SELECT count(*)
          FROM "_news_v_version_centers"
          JOIN "recovery_version_centers" USING ("id")
        ) AS "targetVersionCenterRows";
    `),
  )

  assertCount(restoredState.newsDiffRows, 0, '복구 뉴스 원본 차이')
  assertCount(restoredState.centerDiffRows, 0, '복구 뉴스 센터 연결 원본 차이')
  assertCount(restoredState.versionDiffRows, 0, '복구 뉴스 버전 원본 차이')
  assertCount(restoredState.versionCenterDiffRows, 0, '복구 뉴스 버전 센터 원본 차이')
  assertCount(restoredState.targetNewsRows, expectedCounts.news, '하이틴 캐스팅 OnAir 뉴스')
  assertCount(restoredState.publishedRows, 176, '하이틴 캐스팅 OnAir 게시 뉴스')
  assertCount(restoredState.draftRows, 1, '하이틴 캐스팅 OnAir 초안 뉴스')
  assertCount(
    restoredState.targetCenterRows,
    expectedCounts.newsCenters,
    '하이틴 캐스팅 OnAir 센터 연결',
  )
  assertCount(
    restoredState.targetVersionRows,
    expectedCounts.newsVersions,
    '하이틴 캐스팅 OnAir 버전',
  )
  assertCount(
    restoredState.targetVersionCenterRows,
    expectedCounts.newsVersionCenters,
    '하이틴 캐스팅 OnAir 버전 센터 연결',
  )
}

function assertPreflight(preflight: PreflightRow) {
  assertCount(preflight.newsIdConflicts, 0, '뉴스 ID 충돌')
  assertCount(preflight.newsSlugConflicts, 0, '뉴스 slug 충돌')
  assertCount(preflight.centerIdConflicts, 0, '뉴스 센터 연결 ID 충돌')
  assertCount(preflight.versionIdConflicts, 0, '뉴스 버전 ID 충돌')
  assertCount(preflight.versionCenterIdConflicts, 0, '뉴스 버전 센터 연결 ID 충돌')
  assertCount(preflight.missingMediaRows, 0, '누락 미디어')
  assertCount(preflight.existingTargetRows, 0, '기존 하이틴 캐스팅 OnAir 뉴스')
  assertCount(preflight.cleanupMigrationRows, 1, '선행 삭제 마이그레이션 기록')
}

function loadRecoveryData(): RecoveryData {
  const raw = gunzipSync(Buffer.from(recoveryPayload.gzipBase64, 'base64')).toString('utf8')
  const checksum = createHash('sha256').update(raw).digest('hex')

  if (checksum !== recoveryPayload.dataSha256) {
    throw new Error('하이틴 캐스팅 OnAir 복구 데이터 체크섬이 일치하지 않습니다.')
  }

  const recoveryData = JSON.parse(raw) as RecoveryData

  assertCount(recoveryData.news.length, expectedCounts.news, '복구 원본 뉴스')
  assertCount(
    recoveryData.newsCenters.length,
    expectedCounts.newsCenters,
    '복구 원본 뉴스 센터 연결',
  )
  assertCount(
    recoveryData.newsVersions.length,
    expectedCounts.newsVersions,
    '복구 원본 뉴스 버전',
  )
  assertCount(
    recoveryData.newsVersionCenters.length,
    expectedCounts.newsVersionCenters,
    '복구 원본 뉴스 버전 센터 연결',
  )

  return recoveryData
}

function serializeRecoveryData(recoveryData: RecoveryData) {
  return {
    news: JSON.stringify(recoveryData.news),
    newsCenters: JSON.stringify(recoveryData.newsCenters),
    newsVersions: JSON.stringify(recoveryData.newsVersions),
    newsVersionCenters: JSON.stringify(recoveryData.newsVersionCenters),
  }
}

function firstRow<T>(result: unknown): T {
  const rows = normalizeRows<T>(result)
  const row = rows[0]

  if (!row) {
    throw new Error('하이틴 캐스팅 OnAir 복구 검증 결과가 없습니다.')
  }

  return row
}

function normalizeRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[]
  }

  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows
  }

  return []
}

function assertCount(actual: string | number, expected: number, label: string) {
  const normalizedActual = Number(actual)

  if (normalizedActual !== expected) {
    throw new Error(`${label} 건수가 예상과 다릅니다: expected=${expected}, actual=${actual}`)
  }
}
