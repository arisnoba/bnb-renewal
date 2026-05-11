import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "audition_schedules_slug_idx";
    DROP INDEX IF EXISTS "audition_schedules_dedupe_key_idx";

    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "dedupe_key";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "schedule_start_raw";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "schedule_end_raw";
    ALTER TABLE "audition_schedules" DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "dedupe_key" varchar;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "schedule_start_raw" varchar;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "schedule_end_raw" varchar;
    ALTER TABLE "audition_schedules" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "audition_schedules"
    SET
      "source_db" = coalesce("source_db", 'legacy'),
      "source_table" = coalesce("source_table", 'audition_schedules'),
      "source_id" = coalesce("source_id", "id"),
      "slug" = coalesce("slug", concat('audition-schedule-', "id")),
      "dedupe_key" = coalesce(
        "dedupe_key",
        md5(concat_ws('|', "title", "schedule_start_date"::text, "schedule_end_date"::text, "id"::text))
      ),
      "schedule_start_raw" = coalesce("schedule_start_raw", "schedule_start_date"::date::text),
      "schedule_end_raw" = coalesce("schedule_end_raw", "schedule_end_date"::date::text)
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL
      OR "slug" IS NULL
      OR "dedupe_key" IS NULL
      OR "schedule_start_raw" IS NULL
      OR "schedule_end_raw" IS NULL;

    ALTER TABLE "audition_schedules" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "audition_schedules" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "audition_schedules" ALTER COLUMN "source_id" SET NOT NULL;
    ALTER TABLE "audition_schedules" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "audition_schedules" ALTER COLUMN "dedupe_key" SET NOT NULL;
    ALTER TABLE "audition_schedules" ALTER COLUMN "schedule_start_raw" SET NOT NULL;
    ALTER TABLE "audition_schedules" ALTER COLUMN "schedule_end_raw" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "audition_schedules_slug_idx"
      ON "audition_schedules" USING btree ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "audition_schedules_dedupe_key_idx"
      ON "audition_schedules" USING btree ("dedupe_key");
  `)
}
