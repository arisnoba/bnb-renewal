import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    WITH max_order AS (
      SELECT COALESCE(max("order"), 0) AS "value"
      FROM "direct_castings_centers"
      WHERE "parent_id" = 216
    ),
    missing_centers AS (
      SELECT
        "source"."value",
        row_number() OVER (ORDER BY "source"."value") AS "row_number"
      FROM "direct_castings_centers" AS "source"
      WHERE "source"."parent_id" = 31
        AND NOT EXISTS (
          SELECT 1
          FROM "direct_castings_centers" AS "existing"
          WHERE "existing"."parent_id" = 216
            AND "existing"."value" = "source"."value"
        )
    )
    INSERT INTO "direct_castings_centers" ("order", "parent_id", "value")
    SELECT
      "max_order"."value" + "missing_centers"."row_number" AS "order",
      216 AS "parent_id",
      "missing_centers"."value"
    FROM "missing_centers"
    CROSS JOIN "max_order";

    UPDATE "payload_locked_documents_rels"
    SET "direct_castings_id" = 216
    WHERE "direct_castings_id" = 31;

    DELETE FROM "direct_castings"
    WHERE "id" = 31;

    UPDATE "direct_castings"
    SET
      "title" = 'JTBC 서른, 아홉',
      "slug" = CASE
        WHEN "company" = 'ucasting' THEN 'jtbc-서른-아홉-ucasting'
        WHEN "company" = 'bnb-casting' THEN 'jtbc-서른-아홉-bnb-casting'
        ELSE "slug"
      END,
      "generate_slug" = false,
      "updated_at" = now()
    WHERE "id" IN (216, 445);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "direct_castings"
    SET
      "title" = 'JTBC 서른,아홉',
      "updated_at" = now()
    WHERE "id" IN (216, 445);
  `)
}
