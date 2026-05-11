import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_passed_reviews"
      ADD COLUMN IF NOT EXISTS "student_name" varchar,
      ADD COLUMN IF NOT EXISTS "cohort" varchar,
      ADD COLUMN IF NOT EXISTS "result_summary" varchar;

    ALTER TABLE "_exam_passed_reviews_v"
      ADD COLUMN IF NOT EXISTS "version_student_name" varchar,
      ADD COLUMN IF NOT EXISTS "version_cohort" varchar,
      ADD COLUMN IF NOT EXISTS "version_result_summary" varchar;

    WITH parsed AS (
      SELECT
        "id",
        NULLIF(
          btrim(
            replace(
              (regexp_match("body_html", '<span[^>]*class="scene_title"[^>]*>이(&nbsp;|[[:space:]])*름</span>[[:space:]]*([^<]+)</li>', 'i'))[2],
              '&nbsp;',
              ' '
            )
          ),
          ''
        ) AS "student_name",
        NULLIF(
          btrim(
            replace(
              (regexp_match("body_html", '<span[^>]*class="scene_title"[^>]*>기(&nbsp;|[[:space:]])*수</span>[[:space:]]*([^<]+)</li>', 'i'))[2],
              '&nbsp;',
              ' '
            )
          ),
          ''
        ) AS "cohort",
        NULLIF(
          btrim(
            replace(
              replace(
                replace(
                  replace(
                    (regexp_match("body_html", '<span[^>]*class="scene_title"[^>]*>합격현황</span>[[:space:]]*([^<]+)</li>', 'i'))[1],
                    '&nbsp;',
                    ' '
                  ),
                  '&amp;',
                  '&'
                ),
                '&lt;',
                '<'
              ),
              '&gt;',
              '>'
            )
          ),
          ''
        ) AS "result_summary"
      FROM "exam_passed_reviews"
    )
    UPDATE "exam_passed_reviews"
    SET
      "student_name" = coalesce(parsed."student_name", "exam_passed_reviews"."student_name", ''),
      "cohort" = coalesce(parsed."cohort", "exam_passed_reviews"."cohort"),
      "result_summary" = coalesce(
        parsed."result_summary",
        nullif("exam_passed_reviews"."result_summary", ''),
        "exam_passed_reviews"."title"
      )
    FROM parsed
    WHERE parsed."id" = "exam_passed_reviews"."id";

    UPDATE "_exam_passed_reviews_v"
    SET
      "version_student_name" = coalesce(
        "_exam_passed_reviews_v"."version_student_name",
        "exam_passed_reviews"."student_name",
        ''
      ),
      "version_cohort" = coalesce(
        "_exam_passed_reviews_v"."version_cohort",
        "exam_passed_reviews"."cohort"
      ),
      "version_result_summary" = coalesce(
        "_exam_passed_reviews_v"."version_result_summary",
        "exam_passed_reviews"."result_summary",
        "exam_passed_reviews"."title"
      )
    FROM "exam_passed_reviews"
    WHERE "_exam_passed_reviews_v"."parent_id" = "exam_passed_reviews"."id";

    DELETE FROM "exam_passed_reviews_centers"
    WHERE "value" IS DISTINCT FROM 'exam';

    INSERT INTO "exam_passed_reviews_centers" ("order", "parent_id", "value")
    SELECT 1, "exam_passed_reviews"."id", 'exam'
    FROM "exam_passed_reviews"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "exam_passed_reviews_centers"
      WHERE "exam_passed_reviews_centers"."parent_id" = "exam_passed_reviews"."id"
        AND "exam_passed_reviews_centers"."value" = 'exam'
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_exam_passed_reviews_v"
      DROP COLUMN IF EXISTS "version_result_summary",
      DROP COLUMN IF EXISTS "version_cohort",
      DROP COLUMN IF EXISTS "version_student_name";

    ALTER TABLE "exam_passed_reviews"
      DROP COLUMN IF EXISTS "result_summary",
      DROP COLUMN IF EXISTS "cohort",
      DROP COLUMN IF EXISTS "student_name";
  `)
}
