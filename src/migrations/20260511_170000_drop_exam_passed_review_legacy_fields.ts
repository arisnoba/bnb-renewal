import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "exam_passed_reviews_slug_idx";

    ALTER TABLE "exam_passed_reviews"
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "body_html",
      DROP COLUMN IF EXISTS "school_name",
      DROP COLUMN IF EXISTS "school_logo_slug",
      DROP COLUMN IF EXISTS "school_logo_path",
      DROP COLUMN IF EXISTS "legacy_meta",
      DROP COLUMN IF EXISTS "generate_slug";

    ALTER TABLE "_exam_passed_reviews_v"
      DROP COLUMN IF EXISTS "version_source_db",
      DROP COLUMN IF EXISTS "version_source_table",
      DROP COLUMN IF EXISTS "version_source_id",
      DROP COLUMN IF EXISTS "version_slug",
      DROP COLUMN IF EXISTS "version_body_html",
      DROP COLUMN IF EXISTS "version_school_name",
      DROP COLUMN IF EXISTS "version_school_logo_slug",
      DROP COLUMN IF EXISTS "version_school_logo_path",
      DROP COLUMN IF EXISTS "version_legacy_meta",
      DROP COLUMN IF EXISTS "version_generate_slug";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_passed_reviews"
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "slug" varchar,
      ADD COLUMN IF NOT EXISTS "body_html" varchar,
      ADD COLUMN IF NOT EXISTS "school_name" varchar,
      ADD COLUMN IF NOT EXISTS "school_logo_slug" varchar,
      ADD COLUMN IF NOT EXISTS "school_logo_path" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb,
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true;

    ALTER TABLE "_exam_passed_reviews_v"
      ADD COLUMN IF NOT EXISTS "version_source_db" varchar,
      ADD COLUMN IF NOT EXISTS "version_source_table" varchar,
      ADD COLUMN IF NOT EXISTS "version_source_id" numeric,
      ADD COLUMN IF NOT EXISTS "version_slug" varchar,
      ADD COLUMN IF NOT EXISTS "version_body_html" varchar,
      ADD COLUMN IF NOT EXISTS "version_school_name" varchar,
      ADD COLUMN IF NOT EXISTS "version_school_logo_slug" varchar,
      ADD COLUMN IF NOT EXISTS "version_school_logo_path" varchar,
      ADD COLUMN IF NOT EXISTS "version_legacy_meta" jsonb,
      ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;

    CREATE UNIQUE INDEX IF NOT EXISTS "exam_passed_reviews_slug_idx"
      ON "exam_passed_reviews" USING btree ("slug");
  `)
}
