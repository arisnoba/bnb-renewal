import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    WITH selected_centers AS (
      SELECT DISTINCT ON ("parent_id")
        "parent_id",
        COALESCE("value"::text, 'art') AS "center"
      FROM "news_centers"
      WHERE "value"::text IN ('all', 'art', 'avenue', 'exam', 'highteen', 'kids')
      ORDER BY "parent_id", "order"
    ),
    news_with_expected_prefix AS (
      SELECT
        "news"."id",
        "news"."slug",
        'news-' || COALESCE(selected_centers."center", 'art') AS "prefix"
      FROM "news"
      LEFT JOIN selected_centers
        ON selected_centers."parent_id" = "news"."id"
    ),
    target_news AS (
      SELECT
        "id",
        "prefix"
      FROM news_with_expected_prefix
      WHERE "slug" IS NULL
        OR "slug" !~ ('^' || "prefix" || '-[0-9]+$')
    ),
    target_prefixes AS (
      SELECT DISTINCT "prefix"
      FROM target_news
    ),
    max_suffixes AS (
      SELECT
        target_prefixes."prefix",
        COALESCE(
          MAX(
            substring(
              "news"."slug"
              FROM ('^' || target_prefixes."prefix" || '-([0-9]+)$')
            )::integer
          ),
          0
        ) AS "max_suffix"
      FROM target_prefixes
      LEFT JOIN "news"
        ON "news"."slug" ~ ('^' || target_prefixes."prefix" || '-[0-9]+$')
      GROUP BY target_prefixes."prefix"
    ),
    ranked_targets AS (
      SELECT
        target_news."id",
        target_news."prefix",
        row_number() OVER (
          PARTITION BY target_news."prefix"
          ORDER BY target_news."id"
        ) AS "slug_offset"
      FROM target_news
    )
    UPDATE "news"
    SET
      "slug" = ranked_targets."prefix" || '-' || (
        max_suffixes."max_suffix" + ranked_targets."slug_offset"
      )::text,
      "generate_slug" = true
    FROM ranked_targets
    INNER JOIN max_suffixes
      ON max_suffixes."prefix" = ranked_targets."prefix"
    WHERE "news"."id" = ranked_targets."id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1;`)
}
