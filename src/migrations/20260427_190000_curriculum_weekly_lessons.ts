import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "curriculums_weekly_lessons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "lesson_subject" varchar,
      "lesson_content" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_weekly_lessons_parent_id_fk'
      ) THEN
        ALTER TABLE "curriculums_weekly_lessons"
        ADD CONSTRAINT "curriculums_weekly_lessons_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."curriculums"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "curriculums_weekly_lessons_order_idx"
      ON "curriculums_weekly_lessons" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "curriculums_weekly_lessons_parent_id_idx"
      ON "curriculums_weekly_lessons" USING btree ("_parent_id");

    WITH raw AS (
      SELECT
        "id" AS "parent_id",
        string_to_array(
          trim(both '|' from coalesce("title_raw", '')),
          '|'
        ) AS "lesson_subjects",
        string_to_array(
          trim(both '|' from coalesce("content_raw", '')),
          '|'
        ) AS "lesson_contents"
      FROM "curriculums"
    ),
    rows AS (
      SELECT
        "parent_id",
        "index" AS "row_index",
        nullif(
          trim(both E' \\n\\r\\t' from regexp_replace("lesson_subjects"["index"], E'[\\r\\n]+', E'\n', 'g')),
          ''
        ) AS "lesson_subject",
        nullif(
          trim(both E' \\n\\r\\t' from regexp_replace("lesson_contents"["index"], E'[\\r\\n]+', E'\n', 'g')),
          ''
        ) AS "lesson_content"
      FROM raw
      CROSS JOIN LATERAL generate_series(
        1,
        greatest(cardinality("lesson_subjects"), cardinality("lesson_contents"))
      ) AS "index"
    )
    INSERT INTO "curriculums_weekly_lessons" (
      "_order",
      "_parent_id",
      "id",
      "lesson_subject",
      "lesson_content"
    )
    SELECT
      "row_index",
      "parent_id",
      md5("parent_id"::text || ':' || "row_index"::text),
      "lesson_subject",
      "lesson_content"
    FROM rows
    WHERE "lesson_subject" IS NOT NULL
      OR "lesson_content" IS NOT NULL
    ON CONFLICT ("id") DO UPDATE SET
      "_order" = EXCLUDED."_order",
      "_parent_id" = EXCLUDED."_parent_id",
      "lesson_subject" = EXCLUDED."lesson_subject",
      "lesson_content" = EXCLUDED."lesson_content";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "curriculums_weekly_lessons" CASCADE;
  `)
}
