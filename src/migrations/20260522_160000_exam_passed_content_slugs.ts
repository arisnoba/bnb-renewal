import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_passed_reviews"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    UPDATE "exam_passed_reviews"
    SET
      "generate_slug" = false,
      "slug" = COALESCE(NULLIF("slug", ''), concat('exam-passed-review-', "id"));

    ALTER TABLE "exam_passed_reviews"
      ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "exam_passed_reviews_slug_idx"
      ON "exam_passed_reviews" USING btree ("slug");

    ALTER TABLE "_exam_passed_reviews_v"
      ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "version_slug" varchar;

    UPDATE "_exam_passed_reviews_v" AS "version"
    SET
      "version_generate_slug" = false,
      "version_slug" = COALESCE(
        NULLIF("version"."version_slug", ''),
        "review"."slug",
        concat('exam-passed-review-', "version"."parent_id"),
        concat('exam-passed-review-version-', "version"."id")
      )
    FROM "exam_passed_reviews" AS "review"
    WHERE "review"."id" = "version"."parent_id";

    UPDATE "_exam_passed_reviews_v"
    SET
      "version_generate_slug" = false,
      "version_slug" = COALESCE(
        NULLIF("version_slug", ''),
        concat('exam-passed-review-', "parent_id"),
        concat('exam-passed-review-version-', "id")
      )
    WHERE "version_slug" IS NULL OR "version_slug" = '';

    ALTER TABLE "_exam_passed_reviews_v"
      ALTER COLUMN "version_slug" SET NOT NULL;

    ALTER TABLE "exam_passed_videos"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    UPDATE "exam_passed_videos"
    SET
      "generate_slug" = false,
      "slug" = COALESCE(NULLIF("slug", ''), concat('passedvideo-', "id"));

    ALTER TABLE "exam_passed_videos"
      ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "exam_passed_videos_slug_idx"
      ON "exam_passed_videos" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "exam_passed_reviews_slug_idx";
    DROP INDEX IF EXISTS "exam_passed_videos_slug_idx";

    ALTER TABLE "_exam_passed_reviews_v"
      DROP COLUMN IF EXISTS "version_slug",
      DROP COLUMN IF EXISTS "version_generate_slug";

    ALTER TABLE "exam_passed_reviews"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "generate_slug";

    ALTER TABLE "exam_passed_videos"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "generate_slug";
  `)
}
