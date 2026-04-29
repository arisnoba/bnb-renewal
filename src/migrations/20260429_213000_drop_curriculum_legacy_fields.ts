import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "curriculums_slug_idx";

    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "curriculums"
    SET
      "source_db" = coalesce("source_db", 'mock'),
      "source_table" = coalesce("source_table", 'curriculums'),
      "source_id" = coalesce("source_id", "id"),
      "slug" = coalesce("slug", concat('curriculum-', "id"))
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL
      OR "slug" IS NULL;

    ALTER TABLE "curriculums" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "curriculums" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "curriculums" ALTER COLUMN "source_id" SET NOT NULL;
    ALTER TABLE "curriculums" ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "curriculums_slug_idx"
      ON "curriculums" USING btree ("slug");
  `)
}
