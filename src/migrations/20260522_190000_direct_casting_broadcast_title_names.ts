import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "direct_castings_centers" ("order", "parent_id", "value")
    SELECT
      COALESCE(
        (
          SELECT max("order")
          FROM "direct_castings_centers"
          WHERE "parent_id" = 343
        ),
        0
      ) + row_number() OVER (ORDER BY "source"."value") AS "order",
      343 AS "parent_id",
      "source"."value"
    FROM "direct_castings_centers" AS "source"
    WHERE "source"."parent_id" = 414
      AND NOT EXISTS (
        SELECT 1
        FROM "direct_castings_centers" AS "existing"
        WHERE "existing"."parent_id" = 343
          AND "existing"."value" = "source"."value"
      );

    UPDATE "payload_locked_documents_rels"
    SET "direct_castings_id" = 343
    WHERE "direct_castings_id" = 414;

    DELETE FROM "direct_castings"
    WHERE "id" = 414;

    UPDATE "direct_castings"
    SET
      "title" = btrim(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    "title",
                    '(넷플릭스|NETFLIX|Netfilx)',
                    'Netflix',
                    'g'
                  ),
                  '채널 A',
                  '채널A',
                  'g'
                ),
                '(COUPANG PLAY|coupang play|쿠팡플레이)',
                'Coupang Play',
                'g'
              ),
              '카카오 TV',
              'KakaoTV',
              'g'
            ),
            '^JTBC 서른,아홉$',
            'JTBC 서른, 아홉',
            'g'
          ),
          'Netfilx',
          'Netflix',
          'g'
        )
      )
    WHERE "title" ~ '(넷플릭스|NETFLIX|Netfilx|채널 A|COUPANG PLAY|coupang play|쿠팡플레이|카카오 TV)'
      OR "title" = 'JTBC 서른,아홉';

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
      "slug" = "final_slugs"."next_slug",
      "updated_at" = now()
    FROM final_slugs
    WHERE "direct"."id" = "final_slugs"."id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "direct_castings"
    SET "updated_at" = now()
    WHERE false;
  `)
}
