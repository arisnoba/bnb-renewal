import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TEMP TABLE "_exam_result_slug_rank" AS
    SELECT
      "id",
      row_number() OVER (
        ORDER BY
          "created_at" ASC NULLS LAST,
          "id" ASC
      ) AS "slug_index"
    FROM "exam_results";

    UPDATE "exam_results"
    SET "slug" = concat('__result_migrating__', "id");

    UPDATE "exam_results" AS "result"
    SET
      "generate_slug" = false,
      "slug" = concat('result-', "rank"."slug_index"),
      "thumbnail_path" = CASE
        WHEN NULLIF(trim(COALESCE("result"."thumbnail_path", '')), '') IS NULL
          OR "result"."thumbnail_path" LIKE '/legacy/exam-results/%'
          THEN "result"."thumbnail_path"
        ELSE concat(
          '/legacy/exam-results/',
          COALESCE(NULLIF("result"."source_db", ''), 'bnbuniv'),
          '/',
          CASE
            WHEN "result"."source_table" = 'g5_write_victory10' THEN 'victory10'
            WHEN "result"."source_table" = 'g5_write_victory30' THEN 'victory30'
            ELSE regexp_replace(COALESCE("result"."source_table", ''), '^g5_write_', '')
          END,
          '/',
          "result"."source_id",
          '/thumbnail/',
          regexp_replace(split_part("result"."thumbnail_path", '?', 1), '^.*/', '')
        )
      END
    FROM "_exam_result_slug_rank" AS "rank"
    WHERE "result"."id" = "rank"."id";

    DROP TABLE "_exam_result_slug_rank";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "exam_results"
    SET "slug" = concat('__exam_result_migrating__', "id");

    UPDATE "exam_results"
    SET
      "generate_slug" = false,
      "slug" = concat(
        'exam-result-',
        CASE
          WHEN "source_table" = 'g5_write_victory10' THEN 'victory10'
          WHEN "source_table" = 'g5_write_victory30' THEN 'victory30'
          ELSE regexp_replace(COALESCE("source_table", ''), '^g5_write_', '')
        END,
        '-',
        "source_id"
      ),
      "thumbnail_path" = CASE
        WHEN "thumbnail_path" LIKE '/legacy/exam-results/%'
          THEN concat(
            '/web/data/file/',
            CASE
              WHEN "source_table" = 'g5_write_victory10' THEN 'victory10'
              WHEN "source_table" = 'g5_write_victory30' THEN 'victory30'
              ELSE regexp_replace(COALESCE("source_table", ''), '^g5_write_', '')
            END,
            '/',
            regexp_replace(split_part("thumbnail_path", '?', 1), '^.*/', '')
          )
        ELSE "thumbnail_path"
      END;
  `)
}
