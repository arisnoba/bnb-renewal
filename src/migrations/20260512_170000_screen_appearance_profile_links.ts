import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "screen_appearances_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "profiles_id" integer
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_rels_parent_fk'
      ) THEN
        ALTER TABLE "screen_appearances_rels"
        ADD CONSTRAINT "screen_appearances_rels_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."screen_appearances"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_rels_profiles_fk'
      ) THEN
        ALTER TABLE "screen_appearances_rels"
        ADD CONSTRAINT "screen_appearances_rels_profiles_fk"
        FOREIGN KEY ("profiles_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "screen_appearances_rels_order_idx"
      ON "screen_appearances_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "screen_appearances_rels_parent_idx"
      ON "screen_appearances_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "screen_appearances_rels_path_idx"
      ON "screen_appearances_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "screen_appearances_rels_profiles_id_idx"
      ON "screen_appearances_rels" USING btree ("profiles_id");

    CREATE OR REPLACE FUNCTION "public"."_screen_appearance_profile_link_name"("raw_value" text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT nullif(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    coalesce("raw_value", ''),
                    '\\([^)]*\\)',
                    '',
                    'g'
                  ),
                  '（[^）]*）',
                  '',
                  'g'
                ),
                '\\[[^]]*\\]',
                '',
                'g'
              ),
              '[[:space:]]+',
              '',
              'g'
            ),
            '배우$',
            ''
          ),
          '[군양님]$',
          ''
        ),
        ''
      )
    $$;

    DELETE FROM "screen_appearances_rels"
    WHERE "path" = 'linkedProfiles';

    WITH "profile_candidates" AS (
      SELECT
        "profiles"."id" AS "profile_id",
        "public"."_screen_appearance_profile_link_name"("profiles"."name") AS "profile_name",
        coalesce(array_agg("profiles_centers"."value"::text) FILTER (WHERE "profiles_centers"."value" IS NOT NULL), ARRAY[]::text[]) AS "profile_centers"
      FROM "profiles"
      LEFT JOIN "profiles_centers"
        ON "profiles_centers"."parent_id" = "profiles"."id"
      GROUP BY "profiles"."id", "profiles"."name"
    ),
    "screen_tokens" AS (
      SELECT
        "screen_appearances"."id" AS "screen_id",
        "token_rows"."ordinality"::integer AS "token_order",
        "public"."_screen_appearance_profile_link_name"("token_rows"."token") AS "screen_name",
        coalesce(array_agg("screen_appearances_centers"."value"::text) FILTER (WHERE "screen_appearances_centers"."value" IS NOT NULL), ARRAY[]::text[]) AS "screen_centers"
      FROM "screen_appearances"
      LEFT JOIN "screen_appearances_centers"
        ON "screen_appearances_centers"."parent_id" = "screen_appearances"."id"
      CROSS JOIN LATERAL regexp_split_to_table(
        regexp_replace(
          regexp_replace(coalesce("screen_appearances"."performer_name", ''), '\\([^)]*\\)', '', 'g'),
          '（[^）]*）',
          '',
          'g'
        ),
        '[,，/&·ㆍ]|[[:space:]]+외[[:space:]]+|[[:space:]]+및[[:space:]]+'
      ) WITH ORDINALITY AS "token_rows"("token", "ordinality")
      GROUP BY "screen_appearances"."id", "token_rows"."ordinality", "token_rows"."token"
    ),
    "token_candidates" AS (
      SELECT
        "screen_tokens"."screen_id",
        "screen_tokens"."token_order",
        "profile_candidates"."profile_id",
        EXISTS (
          SELECT 1
          FROM unnest("screen_tokens"."screen_centers") AS "screen_center"("value")
          WHERE "screen_center"."value" = 'all'
            OR "screen_center"."value" = ANY ("profile_candidates"."profile_centers")
            OR 'all' = ANY ("profile_candidates"."profile_centers")
        ) AS "center_matches"
      FROM "screen_tokens"
      JOIN "profile_candidates"
        ON "profile_candidates"."profile_name" = "screen_tokens"."screen_name"
      WHERE "screen_tokens"."screen_name" IS NOT NULL
    ),
    "resolved_tokens" AS (
      SELECT
        "screen_tokens"."screen_id",
        "screen_tokens"."token_order",
        CASE
          WHEN count("token_candidates"."profile_id") FILTER (WHERE "token_candidates"."center_matches") = 1
            THEN max("token_candidates"."profile_id") FILTER (WHERE "token_candidates"."center_matches")
          WHEN count("token_candidates"."profile_id") FILTER (WHERE "token_candidates"."center_matches") = 0
            AND count("token_candidates"."profile_id") = 1
            THEN max("token_candidates"."profile_id")
          ELSE NULL
        END AS "profile_id"
      FROM "screen_tokens"
      LEFT JOIN "token_candidates"
        ON "token_candidates"."screen_id" = "screen_tokens"."screen_id"
        AND "token_candidates"."token_order" = "screen_tokens"."token_order"
      WHERE "screen_tokens"."screen_name" IS NOT NULL
      GROUP BY "screen_tokens"."screen_id", "screen_tokens"."token_order"
    ),
    "fully_resolved_screens" AS (
      SELECT "screen_id"
      FROM "resolved_tokens"
      GROUP BY "screen_id"
      HAVING count(*) = count("profile_id")
    )
    INSERT INTO "screen_appearances_rels" (
      "order",
      "parent_id",
      "path",
      "profiles_id"
    )
    SELECT
      row_number() OVER (
        PARTITION BY "resolved_tokens"."screen_id"
        ORDER BY "resolved_tokens"."token_order"
      ),
      "resolved_tokens"."screen_id",
      'linkedProfiles',
      "resolved_tokens"."profile_id"
    FROM "resolved_tokens"
    JOIN "fully_resolved_screens"
      ON "fully_resolved_screens"."screen_id" = "resolved_tokens"."screen_id"
    WHERE "resolved_tokens"."profile_id" IS NOT NULL;

    DROP FUNCTION IF EXISTS "public"."_screen_appearance_profile_link_name"(text);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "screen_appearances_rels" CASCADE;
  `)
}
