import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_centers" AS ENUM('art', 'kids', 'highteen');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "direct_castings"
      ADD COLUMN IF NOT EXISTS "body_html" varchar;

    CREATE TABLE IF NOT EXISTS "direct_castings_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_direct_castings_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "direct_castings_centers"
        ADD CONSTRAINT "direct_castings_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."direct_castings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "direct_castings_centers_order_idx"
      ON "direct_castings_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "direct_castings_centers_parent_idx"
      ON "direct_castings_centers" USING btree ("parent_id");

    INSERT INTO "direct_castings_centers" ("order", "parent_id", "value")
    SELECT
      0 AS "order",
      "id" AS "parent_id",
      "source_center"::text::"public"."enum_direct_castings_centers" AS "value"
    FROM "direct_castings"
    WHERE "source_center"::text IN ('art', 'kids', 'highteen')
      AND NOT EXISTS (
        SELECT 1
        FROM "direct_castings_centers"
        WHERE "direct_castings_centers"."parent_id" = "direct_castings"."id"
      );

    DELETE FROM "direct_castings_centers"
    USING (
      SELECT DISTINCT MIN("id") OVER (PARTITION BY "company", "title") AS "canonical_id"
      FROM "direct_castings"
    ) AS "groups"
    WHERE "direct_castings_centers"."parent_id" = "groups"."canonical_id";

    INSERT INTO "direct_castings_centers" ("order", "parent_id", "value")
    SELECT
      ROW_NUMBER() OVER (
        PARTITION BY "canonical_id"
        ORDER BY
          CASE "value"::text
            WHEN 'art' THEN 1
            WHEN 'kids' THEN 2
            WHEN 'highteen' THEN 3
            ELSE 9
          END
      ) - 1 AS "order",
      "canonical_id" AS "parent_id",
      "value"
    FROM (
      SELECT DISTINCT
        MIN("direct_castings"."id") OVER (
          PARTITION BY "direct_castings"."company", "direct_castings"."title"
        ) AS "canonical_id",
        "direct_castings"."source_center"::text::"public"."enum_direct_castings_centers" AS "value"
      FROM "direct_castings"
      WHERE "direct_castings"."source_center"::text IN ('art', 'kids', 'highteen')
    ) AS "group_centers";

    DELETE FROM "direct_castings"
    USING (
      SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "company", "title" ORDER BY "id" ASC) AS "row_number"
      FROM "direct_castings"
    ) AS "ranked"
    WHERE "direct_castings"."id" = "ranked"."id"
      AND "ranked"."row_number" > 1;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "direct_castings_centers_parent_idx";
    DROP INDEX IF EXISTS "direct_castings_centers_order_idx";
    DROP TABLE IF EXISTS "direct_castings_centers" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_direct_castings_centers";

    ALTER TABLE "direct_castings"
      DROP COLUMN IF EXISTS "body_html";
  `)
}
