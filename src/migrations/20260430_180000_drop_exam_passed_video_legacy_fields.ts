import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "exam_passed_videos_slug_idx";

    ALTER TABLE "exam_passed_videos" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "exam_passed_videos" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "exam_passed_videos" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "exam_passed_videos" DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "exam_passed_videos" DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_passed_videos" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "exam_passed_videos" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "exam_passed_videos" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "exam_passed_videos" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "exam_passed_videos" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "exam_passed_videos"
    SET
      "source_db" = COALESCE("source_db", 'bnbuniv'),
      "source_table" = COALESCE("source_table", 'g5_write_new_shoot'),
      "source_id" = COALESCE("source_id", "id"),
      "slug" = COALESCE("slug", concat('passedvideo-', "id"));

    ALTER TABLE "exam_passed_videos" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "exam_passed_videos" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "exam_passed_videos" ALTER COLUMN "source_id" SET NOT NULL;
    ALTER TABLE "exam_passed_videos" ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "exam_passed_videos_slug_idx"
      ON "exam_passed_videos" USING btree ("slug");
  `)
}
