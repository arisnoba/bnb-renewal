import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "body_html";
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "thumbnail_source";
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "body_html" varchar;
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "thumbnail_source" varchar;
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "exam_results"
    SET
      "source_db" = coalesce("source_db", 'bnbuniv'),
      "source_table" = coalesce("source_table", 'exam_results'),
      "source_id" = coalesce("source_id", "id"),
      "thumbnail_source" = coalesce("thumbnail_source", 'admin')
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL
      OR "thumbnail_source" IS NULL;

    ALTER TABLE "exam_results" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "exam_results" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "exam_results" ALTER COLUMN "source_id" SET NOT NULL;
    ALTER TABLE "exam_results" ALTER COLUMN "thumbnail_source" SET NOT NULL;
  `)
}
