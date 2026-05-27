import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.teacher_name_slug(value text, fallback_id integer)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT COALESCE(
        NULLIF(
          regexp_replace(
            regexp_replace(lower(trim(value)), '[[:space:]]+', '-', 'g'),
            '[^0-9a-z가-힣-]+',
            '',
            'g'
          ),
          ''
        ),
        concat('teacher-', fallback_id)
      )
    $$;

    UPDATE "teachers"
    SET "slug" = concat('__teacher_name_slug_migration__-', "id");

    DO $$
    DECLARE
      teacher_record record;
      candidate_slug text;
      suffix integer;
    BEGIN
      FOR teacher_record IN
        SELECT
          "id",
          pg_temp.teacher_name_slug("name", "id") AS "base_slug"
        FROM "teachers"
        ORDER BY "base_slug", "id"
      LOOP
        candidate_slug := teacher_record."base_slug";
        suffix := 2;

        WHILE EXISTS (
          SELECT 1
          FROM "teachers"
          WHERE "slug" = candidate_slug
        ) LOOP
          candidate_slug := teacher_record."base_slug" || '-' || suffix;
          suffix := suffix + 1;
        END LOOP;

        UPDATE "teachers"
        SET
          "slug" = candidate_slug,
          "generate_slug" = false
        WHERE "id" = teacher_record."id";
      END LOOP;
    END $$;

    UPDATE "_teachers_v"
    SET
      "version_slug" = "teachers"."slug",
      "version_generate_slug" = false
    FROM "teachers"
    WHERE "_teachers_v"."parent_id" = "teachers"."id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    SELECT 1;
  `)
}
