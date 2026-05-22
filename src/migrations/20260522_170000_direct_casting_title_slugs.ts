import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.direct_casting_slug_part(value text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT trim(both '-' from regexp_replace(regexp_replace(lower(coalesce(value, '')), '[^[:alnum:]]+', '-', 'g'), '-+', '-', 'g'))
    $$;

    WITH base AS (
      SELECT
        "id",
        COALESCE(NULLIF(pg_temp.direct_casting_slug_part("title"), ''), concat('direct-casting-', "id")) AS "title_slug",
        COALESCE(NULLIF(pg_temp.direct_casting_slug_part("company"::text), ''), concat('company-', "id")) AS "company_slug",
        count(*) OVER (PARTITION BY "title") AS "title_count"
      FROM "direct_castings"
    ),
    candidates AS (
      SELECT
        "id",
        CASE
          WHEN "title_count" > 1 THEN concat("title_slug", '-', "company_slug")
          ELSE "title_slug"
        END AS "candidate_slug"
      FROM base
    ),
    ranked AS (
      SELECT
        "id",
        "candidate_slug",
        row_number() OVER (PARTITION BY "candidate_slug" ORDER BY "id") AS "slug_rank"
      FROM candidates
    ),
    final_slugs AS (
      SELECT
        "id",
        CASE
          WHEN "slug_rank" = 1 THEN "candidate_slug"
          ELSE concat("candidate_slug", '-', "id")
        END AS "next_slug"
      FROM ranked
    )
    UPDATE "direct_castings" AS "direct"
    SET
      "generate_slug" = false,
      "slug" = "final_slugs"."next_slug"
    FROM final_slugs
    WHERE "direct"."id" = "final_slugs"."id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    WITH candidates AS (
      SELECT
        "id",
        concat('direct-casting-', "company"::text, '-', md5("title")) AS "candidate_slug"
      FROM "direct_castings"
    ),
    ranked AS (
      SELECT
        "id",
        "candidate_slug",
        row_number() OVER (PARTITION BY "candidate_slug" ORDER BY "id") AS "slug_rank"
      FROM candidates
    ),
    final_slugs AS (
      SELECT
        "id",
        CASE
          WHEN "slug_rank" = 1 THEN "candidate_slug"
          ELSE concat("candidate_slug", '-', "id")
        END AS "next_slug"
      FROM ranked
    )
    UPDATE "direct_castings" AS "direct"
    SET
      "generate_slug" = false,
      "slug" = "final_slugs"."next_slug"
    FROM final_slugs
    WHERE "direct"."id" = "final_slugs"."id";
  `)
}
