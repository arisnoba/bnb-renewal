import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "faqs"
    SET "display_status" = 'published'
    WHERE "display_status" IS DISTINCT FROM 'published';

    WITH "center_counts" AS (
      SELECT
        "parent_id",
        count(*) FILTER (
          WHERE "value" IS NOT NULL
            AND "value" <> 'all'
        ) AS "center_count"
      FROM "faqs_centers"
      GROUP BY "parent_id"
    ),
    "first_variant" AS (
      SELECT DISTINCT ON ("_parent_id")
        "_parent_id",
        "answer"
      FROM "faqs_variants"
      WHERE btrim(coalesce("answer", '')) <> ''
      ORDER BY "_parent_id", "_order"
    )
    UPDATE "faqs" AS "faq"
    SET
      "answer_mode" = 'shared',
      "shared_answer" = coalesce(
        nullif(btrim(coalesce("faq"."shared_answer", '')), ''),
        "first_variant"."answer",
        "faq"."shared_answer"
      )
    FROM "center_counts"
    LEFT JOIN "first_variant"
      ON "first_variant"."_parent_id" = "center_counts"."parent_id"
    WHERE "faq"."id" = "center_counts"."parent_id"
      AND coalesce("center_counts"."center_count", 0) < 2;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
