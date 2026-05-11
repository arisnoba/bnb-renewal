import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artist_press"
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "body_html",
      DROP COLUMN IF EXISTS "agency_logo_path",
      DROP COLUMN IF EXISTS "thumbnail_path",
      DROP COLUMN IF EXISTS "legacy_meta";

    ALTER TABLE "_artist_press_v"
      DROP COLUMN IF EXISTS "version_source_db",
      DROP COLUMN IF EXISTS "version_source_table",
      DROP COLUMN IF EXISTS "version_source_id",
      DROP COLUMN IF EXISTS "version_body_html",
      DROP COLUMN IF EXISTS "version_agency_logo_path",
      DROP COLUMN IF EXISTS "version_thumbnail_path",
      DROP COLUMN IF EXISTS "version_legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artist_press"
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "body_html" varchar,
      ADD COLUMN IF NOT EXISTS "agency_logo_path" varchar,
      ADD COLUMN IF NOT EXISTS "thumbnail_path" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    ALTER TABLE "_artist_press_v"
      ADD COLUMN IF NOT EXISTS "version_source_db" varchar,
      ADD COLUMN IF NOT EXISTS "version_source_table" varchar,
      ADD COLUMN IF NOT EXISTS "version_source_id" numeric,
      ADD COLUMN IF NOT EXISTS "version_body_html" varchar,
      ADD COLUMN IF NOT EXISTS "version_agency_logo_path" varchar,
      ADD COLUMN IF NOT EXISTS "version_thumbnail_path" varchar,
      ADD COLUMN IF NOT EXISTS "version_legacy_meta" jsonb;
  `)
}
