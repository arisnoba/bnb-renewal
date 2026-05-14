import { convertHTMLToLexical } from '@payloadcms/richtext-lexical'
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { JSDOM } from 'jsdom'

import { newsBodyEditor } from '../collections/News'

type NewsBodyRow = {
  body_html: string | null
  id: number
}

type NewsVersionBodyRow = {
  id: number
  version_body_html: string | null
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const adapter = await newsBodyEditor({
    config: payload.config,
    parentIsLocalized: false,
  })

  const newsRows = normalizeRows<NewsBodyRow>(
    await db.execute(sql`
      SELECT "id", "body_html"
      FROM "news"
      WHERE "published_at" >= '2020-01-01'::timestamptz
        AND NULLIF("body_html", '') IS NOT NULL
        AND (
          "body" IS NULL
          OR jsonb_array_length(coalesce("body"->'root'->'children', '[]'::jsonb)) = 0
        )
      ORDER BY "id" ASC;
    `),
  )

  for (const row of newsRows) {
    const body = convertHTMLToLexical({
      editorConfig: adapter.editorConfig,
      html: row.body_html ?? '',
      JSDOM,
    })

    await db.execute(sql`
      UPDATE "news"
      SET "body" = ${JSON.stringify(body)}::jsonb
      WHERE "id" = ${row.id};
    `)
  }

  const versionRows = normalizeRows<NewsVersionBodyRow>(
    await db.execute(sql`
      SELECT "id", "version_body_html"
      FROM "_news_v"
      WHERE "version_published_at" >= '2020-01-01'::timestamptz
        AND NULLIF("version_body_html", '') IS NOT NULL
        AND (
          "version_body" IS NULL
          OR jsonb_array_length(coalesce("version_body"->'root'->'children', '[]'::jsonb)) = 0
        )
      ORDER BY "id" ASC;
    `),
  )

  for (const row of versionRows) {
    const body = convertHTMLToLexical({
      editorConfig: adapter.editorConfig,
      html: row.version_body_html ?? '',
      JSDOM,
    })

    await db.execute(sql`
      UPDATE "_news_v"
      SET "version_body" = ${JSON.stringify(body)}::jsonb
      WHERE "id" = ${row.id};
    `)
  }

  await db.execute(sql`
    ALTER TABLE "news"
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "body_html",
      DROP COLUMN IF EXISTS "thumbnail_path",
      DROP COLUMN IF EXISTS "legacy_meta";

    ALTER TABLE "_news_v"
      DROP COLUMN IF EXISTS "version_source_db",
      DROP COLUMN IF EXISTS "version_source_table",
      DROP COLUMN IF EXISTS "version_source_id",
      DROP COLUMN IF EXISTS "version_body_html",
      DROP COLUMN IF EXISTS "version_thumbnail_path",
      DROP COLUMN IF EXISTS "version_legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news"
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "body_html" varchar,
      ADD COLUMN IF NOT EXISTS "thumbnail_path" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    ALTER TABLE "_news_v"
      ADD COLUMN IF NOT EXISTS "version_source_db" varchar,
      ADD COLUMN IF NOT EXISTS "version_source_table" varchar,
      ADD COLUMN IF NOT EXISTS "version_source_id" numeric,
      ADD COLUMN IF NOT EXISTS "version_body_html" varchar,
      ADD COLUMN IF NOT EXISTS "version_thumbnail_path" varchar,
      ADD COLUMN IF NOT EXISTS "version_legacy_meta" jsonb;
  `)
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
