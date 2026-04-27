import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "teacher_id" integer;

    WITH teacher_name_counts AS (
      SELECT
        "name",
        count(*) AS "teacher_count",
        min("id") AS "teacher_id"
      FROM "teachers"
      GROUP BY "name"
    ),
    matches AS (
      SELECT
        "curriculums"."id" AS "curriculum_id",
        coalesce(
          "teacher_by_slug"."id",
          CASE
            WHEN "teacher_by_name"."teacher_count" = 1 THEN "teacher_by_name"."teacher_id"
            ELSE NULL
          END
        ) AS "teacher_id"
      FROM "curriculums"
      LEFT JOIN "teachers" AS "teacher_by_slug"
        ON "teacher_by_slug"."slug" = "curriculums"."resolved_teacher_slug"
      LEFT JOIN teacher_name_counts AS "teacher_by_name"
        ON "teacher_by_name"."name" = "curriculums"."teacher_name"
    )
    UPDATE "curriculums"
    SET "teacher_id" = "matches"."teacher_id"
    FROM matches
    WHERE "curriculums"."teacher_id" IS NULL
      AND "curriculums"."id" = "matches"."curriculum_id"
      AND "matches"."teacher_id" IS NOT NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_teacher_id_teachers_id_fk'
      ) THEN
        ALTER TABLE "curriculums"
        ADD CONSTRAINT "curriculums_teacher_id_teachers_id_fk"
        FOREIGN KEY ("teacher_id")
        REFERENCES "public"."teachers"("id")
        ON DELETE restrict
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "curriculums_teacher_idx"
      ON "curriculums" USING btree ("teacher_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums" DROP CONSTRAINT IF EXISTS "curriculums_teacher_id_teachers_id_fk";
    DROP INDEX IF EXISTS "curriculums_teacher_idx";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "teacher_id";
  `)
}
