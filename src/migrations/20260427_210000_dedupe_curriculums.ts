import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    WITH lesson_sig AS (
      SELECT
        "curriculums"."id",
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'subject',
              "curriculums_weekly_lessons"."lesson_subject",
              'content',
              "curriculums_weekly_lessons"."lesson_content"
            )
            ORDER BY "curriculums_weekly_lessons"."_order"
          ) FILTER (WHERE "curriculums_weekly_lessons"."id" IS NOT NULL),
          '[]'::jsonb
        ) AS "lessons"
      FROM "curriculums"
      LEFT JOIN "curriculums_weekly_lessons"
        ON "curriculums_weekly_lessons"."_parent_id" = "curriculums"."id"
      GROUP BY "curriculums"."id"
    ),
    ranked AS (
      SELECT
        "curriculums"."id",
        row_number() OVER (
          PARTITION BY
            regexp_replace(lower(coalesce("curriculums"."subject", '')), '[[:space:][:punct:]]+', '', 'g'),
            regexp_replace(lower(coalesce("teachers"."name", nullif("curriculums"."teacher_name", ''), '')), '[[:space:][:punct:]]+', '', 'g'),
            md5(regexp_replace(lower("lesson_sig"."lessons"::text), '[[:space:][:punct:]]+', '', 'g'))
          ORDER BY "curriculums"."id"
        ) AS "rank"
      FROM "curriculums"
      LEFT JOIN "teachers"
        ON "teachers"."id" = "curriculums"."teacher_id"
      JOIN lesson_sig
        ON "lesson_sig"."id" = "curriculums"."id"
    )
    DELETE FROM "curriculums"
    USING ranked
    WHERE "curriculums"."id" = "ranked"."id"
      AND "ranked"."rank" > 1;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
