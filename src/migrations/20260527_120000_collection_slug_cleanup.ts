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

    ALTER TABLE "curriculums"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    ALTER TABLE "casting_appearances"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    ALTER TABLE "screen_appearances"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "slug" varchar;

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
    SET
      "generate_slug" = false,
      "slug" = CASE
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
    SET
      "generate_slug" = false,
      "slug" = CASE
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
    SET
      "generate_slug" = false,
      "slug" = CASE
        WHEN screen_ranked."slug_rank" = 1 THEN screen_ranked."base_slug"
        ELSE concat(screen_ranked."base_slug", '-', screen_ranked."slug_rank")
      END
    FROM screen_ranked
    WHERE "screen_appearances"."id" = screen_ranked."id";

    UPDATE "highteen_special_classes"
    SET
      "generate_slug" = false,
      "slug" = concat('class-', "id");

    UPDATE "exam_passed_reviews"
    SET
      "generate_slug" = false,
      "slug" = concat('review-', "id");

    UPDATE "_exam_passed_reviews_v"
    SET
      "version_generate_slug" = false,
      "version_slug" = "exam_passed_reviews"."slug"
    FROM "exam_passed_reviews"
    WHERE "_exam_passed_reviews_v"."parent_id" = "exam_passed_reviews"."id";

    ALTER TABLE "curriculums" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "casting_appearances" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "screen_appearances" ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "curriculums_slug_idx"
      ON "curriculums" USING btree ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "casting_appearances_slug_idx"
      ON "casting_appearances" USING btree ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "screen_appearances_slug_idx"
      ON "screen_appearances" USING btree ("slug");

    DO $$
    BEGIN
      IF to_regclass('public.footer_rels') IS NOT NULL THEN
        DELETE FROM "footer_rels"
        WHERE "path" LIKE 'navItems%';
      END IF;
    END $$;
    DROP TABLE IF EXISTS "footer_nav_items" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_footer_nav_items_link_type";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom');

    CREATE TABLE IF NOT EXISTS "footer_nav_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "link_type" "public"."enum_footer_nav_items_link_type" DEFAULT 'reference',
      "link_new_tab" boolean,
      "link_url" varchar,
      "link_label" varchar NOT NULL
    );

    ALTER TABLE "footer_nav_items"
      DROP CONSTRAINT IF EXISTS "footer_nav_items_parent_id_fk";
    ALTER TABLE "footer_nav_items"
      ADD CONSTRAINT "footer_nav_items_parent_id_fk"
      FOREIGN KEY ("_parent_id")
      REFERENCES "public"."footer"("id")
      ON DELETE cascade
      ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "footer_nav_items_order_idx"
      ON "footer_nav_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "footer_nav_items_parent_id_idx"
      ON "footer_nav_items" USING btree ("_parent_id");

    UPDATE "highteen_special_classes"
    SET "slug" = concat('highteen-special-class-', "id");

    UPDATE "exam_passed_reviews"
    SET "slug" = concat('exam-passed-review-', "id");

    UPDATE "_exam_passed_reviews_v"
    SET "version_slug" = "exam_passed_reviews"."slug"
    FROM "exam_passed_reviews"
    WHERE "_exam_passed_reviews_v"."parent_id" = "exam_passed_reviews"."id";

    DROP INDEX IF EXISTS "screen_appearances_slug_idx";
    DROP INDEX IF EXISTS "casting_appearances_slug_idx";
    DROP INDEX IF EXISTS "curriculums_slug_idx";

    ALTER TABLE "screen_appearances"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "casting_appearances"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "curriculums"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "generate_slug";
  `)
}
