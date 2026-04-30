import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TEMP TABLE "_exam_passed_video_slug_rank" AS
    SELECT
      "id",
      row_number() OVER (
        ORDER BY
          CASE
            WHEN "slug" ~ '^passedvideo-[0-9]+$'
              THEN substring("slug" from '^passedvideo-([0-9]+)$')::integer
            ELSE NULL
          END ASC NULLS LAST,
          "published_at" ASC NULLS LAST,
          "id" ASC
      ) AS "slug_index"
    FROM "exam_passed_videos";

    UPDATE "exam_passed_videos"
    SET "slug" = concat('__passedvideo_migrating__', "id");

    UPDATE "exam_passed_videos" AS "video"
    SET
      "created_at" = "video"."published_at",
      "slug" = concat('passedvideo-', "rank"."slug_index")
    FROM "_exam_passed_video_slug_rank" AS "rank"
    WHERE "video"."id" = "rank"."id";

    DROP TABLE "_exam_passed_video_slug_rank";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "exam_passed_videos"
    SET "slug" = concat('__exam_passed_video_migrating__', "id");

    UPDATE "exam_passed_videos"
    SET "slug" = concat('exam-passed-video-', "source_id");
  `)
}
