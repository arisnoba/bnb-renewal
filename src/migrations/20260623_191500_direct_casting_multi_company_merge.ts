import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_company" AS ENUM(
        'arko-lab',
        'imground',
        'bnb-casting',
        'bx-model-agency'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "direct_castings_company" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum_direct_castings_company",
      "id" serial PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "direct_castings_company"
        ADD CONSTRAINT "direct_castings_company_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."direct_castings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "direct_castings_company_order_idx"
      ON "direct_castings_company" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "direct_castings_company_parent_idx"
      ON "direct_castings_company" USING btree ("parent_id");

    INSERT INTO "direct_castings_company" ("order", "parent_id", "value")
    SELECT
      0 AS "order",
      "direct_castings"."id" AS "parent_id",
      "direct_castings"."company"::text::"public"."enum_direct_castings_company" AS "value"
    FROM "direct_castings"
    WHERE "direct_castings"."company" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "direct_castings_company"
        WHERE "direct_castings_company"."parent_id" = "direct_castings"."id"
          AND "direct_castings_company"."value" = "direct_castings"."company"
      );

    CREATE TEMP TABLE "direct_casting_merge_groups" ON COMMIT DROP AS
    WITH "row_stats" AS (
      SELECT
        "direct_castings"."id",
        lower(btrim("direct_castings"."title")) AS "title_key",
        coalesce(nullif(btrim("direct_castings"."year_label"), ''), '') AS "year_key",
        count(DISTINCT "direct_castings_centers"."value") AS "center_count",
        coalesce(length("direct_castings"."body"::text), 0) AS "body_chars",
        "direct_castings"."published_at",
        "direct_castings"."created_at"
      FROM "direct_castings"
      LEFT JOIN "direct_castings_centers"
        ON "direct_castings_centers"."parent_id" = "direct_castings"."id"
      GROUP BY "direct_castings"."id"
    ),
    "duplicate_keys" AS (
      SELECT "title_key", "year_key"
      FROM "row_stats"
      GROUP BY "title_key", "year_key"
      HAVING count(*) > 1
    ),
    "ranked_rows" AS (
      SELECT
        "row_stats".*,
        first_value("row_stats"."id") OVER (
          PARTITION BY "row_stats"."title_key", "row_stats"."year_key"
          ORDER BY
            "row_stats"."center_count" DESC,
            "row_stats"."body_chars" DESC,
            "row_stats"."published_at" ASC NULLS LAST,
            "row_stats"."created_at" ASC,
            "row_stats"."id" ASC
        ) AS "canonical_id"
      FROM "row_stats"
      INNER JOIN "duplicate_keys"
        ON "duplicate_keys"."title_key" = "row_stats"."title_key"
       AND "duplicate_keys"."year_key" = "row_stats"."year_key"
    )
    SELECT
      "id" AS "row_id",
      "canonical_id",
      "title_key",
      "year_key"
    FROM "ranked_rows";

    CREATE TEMP TABLE "direct_casting_merge_centers" ON COMMIT DROP AS
    SELECT DISTINCT
      "direct_casting_merge_groups"."canonical_id",
      "direct_castings_centers"."value"
    FROM "direct_casting_merge_groups"
    INNER JOIN "direct_castings_centers"
      ON "direct_castings_centers"."parent_id" = "direct_casting_merge_groups"."row_id"
    WHERE "direct_castings_centers"."value" IS NOT NULL;

    CREATE TEMP TABLE "direct_casting_merge_companies" ON COMMIT DROP AS
    SELECT DISTINCT
      "direct_casting_merge_groups"."canonical_id",
      "direct_castings_company"."value"
    FROM "direct_casting_merge_groups"
    INNER JOIN "direct_castings_company"
      ON "direct_castings_company"."parent_id" = "direct_casting_merge_groups"."row_id"
    WHERE "direct_castings_company"."value" IS NOT NULL;

    DELETE FROM "direct_castings_centers"
    USING (
      SELECT DISTINCT "canonical_id"
      FROM "direct_casting_merge_groups"
    ) AS "canonical_rows"
    WHERE "direct_castings_centers"."parent_id" = "canonical_rows"."canonical_id";

    INSERT INTO "direct_castings_centers" ("order", "parent_id", "value")
    SELECT
      row_number() OVER (
        PARTITION BY "direct_casting_merge_centers"."canonical_id"
        ORDER BY "direct_casting_merge_centers"."value"::text
      ) - 1 AS "order",
      "direct_casting_merge_centers"."canonical_id" AS "parent_id",
      "direct_casting_merge_centers"."value"
    FROM "direct_casting_merge_centers";

    DELETE FROM "direct_castings_company"
    USING (
      SELECT DISTINCT "canonical_id"
      FROM "direct_casting_merge_groups"
    ) AS "canonical_rows"
    WHERE "direct_castings_company"."parent_id" = "canonical_rows"."canonical_id";

    INSERT INTO "direct_castings_company" ("order", "parent_id", "value")
    SELECT
      row_number() OVER (
        PARTITION BY "direct_casting_merge_companies"."canonical_id"
        ORDER BY "direct_casting_merge_companies"."value"::text
      ) - 1 AS "order",
      "direct_casting_merge_companies"."canonical_id" AS "parent_id",
      "direct_casting_merge_companies"."value"
    FROM "direct_casting_merge_companies";

    UPDATE "direct_castings"
    SET "updated_at" = now()
    FROM (
      SELECT DISTINCT "canonical_id"
      FROM "direct_casting_merge_groups"
    ) AS "canonical_rows"
    WHERE "direct_castings"."id" = "canonical_rows"."canonical_id";

    DELETE FROM "direct_castings"
    USING "direct_casting_merge_groups"
    WHERE "direct_castings"."id" = "direct_casting_merge_groups"."row_id"
      AND "direct_castings"."id" <> "direct_casting_merge_groups"."canonical_id";

    DROP INDEX IF EXISTS "direct_castings_company_idx";

    ALTER TABLE "direct_castings"
      DROP COLUMN IF EXISTS "company";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_company" AS ENUM(
        'arko-lab',
        'imground',
        'bnb-casting',
        'bx-model-agency'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "direct_castings"
      ADD COLUMN IF NOT EXISTS "company" "public"."enum_direct_castings_company";

    UPDATE "direct_castings"
    SET "company" = "first_company"."value"
    FROM (
      SELECT DISTINCT ON ("parent_id")
        "parent_id",
        "value"
      FROM "direct_castings_company"
      ORDER BY "parent_id", "order" ASC
    ) AS "first_company"
    WHERE "direct_castings"."id" = "first_company"."parent_id"
      AND "direct_castings"."company" IS NULL;

    ALTER TABLE "direct_castings"
      ALTER COLUMN "company" SET NOT NULL;

    CREATE INDEX IF NOT EXISTS "direct_castings_company_idx"
      ON "direct_castings" USING btree ("company");

    DROP INDEX IF EXISTS "direct_castings_company_parent_idx";
    DROP INDEX IF EXISTS "direct_castings_company_order_idx";
    DROP TABLE IF EXISTS "direct_castings_company" CASCADE;
  `)
}
