import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "_news_v" AS "versions"
    USING "news" AS "target_news"
    WHERE "versions"."parent_id" = "target_news"."id"
      AND (
        (
          "target_news"."category" = '수시·정시 일정'
          AND EXISTS (
            SELECT 1
            FROM "news_centers"
            WHERE "news_centers"."parent_id" = "target_news"."id"
              AND "news_centers"."value"::text = 'exam'
          )
        )
        OR (
          "target_news"."category" = '캐스팅OnAir'
          AND EXISTS (
            SELECT 1
            FROM "news_centers"
            WHERE "news_centers"."parent_id" = "target_news"."id"
              AND "news_centers"."value"::text = 'highteen'
          )
        )
      );

    DELETE FROM "news" AS "target_news"
    WHERE (
      "target_news"."category" = '수시·정시 일정'
      AND EXISTS (
        SELECT 1
        FROM "news_centers"
        WHERE "news_centers"."parent_id" = "target_news"."id"
          AND "news_centers"."value"::text = 'exam'
      )
    )
    OR (
      "target_news"."category" = '캐스팅OnAir'
      AND EXISTS (
        SELECT 1
        FROM "news_centers"
        WHERE "news_centers"."parent_id" = "target_news"."id"
          AND "news_centers"."value"::text = 'highteen'
      )
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // 삭제된 뉴스와 버전 데이터는 원본 없이 안전하게 복원할 수 없다.
  await db.execute(sql`SELECT 1;`)
}
