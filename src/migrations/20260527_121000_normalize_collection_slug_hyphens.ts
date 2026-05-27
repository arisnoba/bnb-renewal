import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.collection_slug(value text, fallback text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT COALESCE(
        NULLIF(
          trim(
            both '-' from regexp_replace(
              regexp_replace(
                regexp_replace(lower(trim(value)), '[[:space:]]+', '-', 'g'),
                '[^0-9a-z가-힣-]+',
                '',
                'g'
              ),
              '-+',
              '-',
              'g'
            )
          ),
          ''
        ),
        fallback
      )
    $$;

    WITH curriculum_base AS (
      SELECT
        "id",
        pg_temp.collection_slug("title", concat('curriculum-', "id")) AS "base_slug"
      FROM "curriculums"
    ),
    curriculum_ranked AS (
      SELECT
        "id",
        "base_slug",
        row_number() OVER (PARTITION BY "base_slug" ORDER BY "id") AS "slug_rank"
      FROM curriculum_base
    )
    UPDATE "curriculums"
    SET "slug" = CASE
      WHEN curriculum_ranked."slug_rank" = 1 THEN curriculum_ranked."base_slug"
      ELSE concat(curriculum_ranked."base_slug", '-', curriculum_ranked."slug_rank")
    END
    FROM curriculum_ranked
    WHERE "curriculums"."id" = curriculum_ranked."id";

    WITH casting_base AS (
      SELECT
        "id",
        pg_temp.collection_slug("title", concat('casting-appearance-', "id")) AS "base_slug"
      FROM "casting_appearances"
    ),
    casting_ranked AS (
      SELECT
        "id",
        "base_slug",
        row_number() OVER (PARTITION BY "base_slug" ORDER BY "id") AS "slug_rank"
      FROM casting_base
    )
    UPDATE "casting_appearances"
    SET "slug" = CASE
      WHEN casting_ranked."slug_rank" = 1 THEN casting_ranked."base_slug"
      ELSE concat(casting_ranked."base_slug", '-', casting_ranked."slug_rank")
    END
    FROM casting_ranked
    WHERE "casting_appearances"."id" = casting_ranked."id";

    WITH screen_base AS (
      SELECT
        "id",
        pg_temp.collection_slug(
          concat_ws('-', "centers"::text, coalesce(nullif("project_title", ''), "title")),
          concat('screen-appearance-', "id")
        ) AS "base_slug"
      FROM "screen_appearances"
    ),
    screen_ranked AS (
      SELECT
        "id",
        "base_slug",
        row_number() OVER (PARTITION BY "base_slug" ORDER BY "id") AS "slug_rank"
      FROM screen_base
    )
    UPDATE "screen_appearances"
    SET "slug" = CASE
      WHEN screen_ranked."slug_rank" = 1 THEN screen_ranked."base_slug"
      ELSE concat(screen_ranked."base_slug", '-', screen_ranked."slug_rank")
    END
    FROM screen_ranked
    WHERE "screen_appearances"."id" = screen_ranked."id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    SELECT 1;
  `)
}
