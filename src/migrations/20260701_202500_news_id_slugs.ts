import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "news"
    SET "slug" = 'news-id-slug-migrating-20260701-' || "id"::text;

    WITH selected_centers AS (
      SELECT DISTINCT ON ("parent_id")
        "parent_id",
        COALESCE("value"::text, 'art') AS "center"
      FROM "news_centers"
      WHERE "value"::text IN ('all', 'art', 'avenue', 'exam', 'highteen', 'kids')
      ORDER BY "parent_id", "order"
    ),
    normalized AS (
      SELECT
        "news"."id",
        'news-' || COALESCE(selected_centers."center", 'art') || '-' || "news"."id"::text AS "slug"
      FROM "news"
      LEFT JOIN selected_centers
        ON selected_centers."parent_id" = "news"."id"
    )
    UPDATE "news"
    SET "slug" = normalized."slug"
    FROM normalized
    WHERE "news"."id" = normalized."id"
      AND "news"."slug" IS DISTINCT FROM normalized."slug";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1;`)
}
