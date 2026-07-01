import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_news_category" AS ENUM (
        '오디션ㆍ캐스팅공지',
        '캐스팅확정',
        '캐스팅OnAir',
        '교육ㆍ운영ㆍ소식',
        '합격현황',
        '수시·정시 일정',
        '교육·운영·소식'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    WITH normalized AS (
      SELECT
        "news"."id",
        CASE
          WHEN "news"."category" IS NULL OR btrim("news"."category") = '' THEN NULL
          WHEN "news"."category" IN ('합격현황', '대학합격현황', '예고합격현황') THEN '합격현황'
          WHEN "news"."category" IN ('수시·정시 일정', '수시ㆍ정시일정공지', '수시전형일정', '정시전형일정') THEN '수시·정시 일정'
          WHEN "news"."category" IN ('교육·운영·소식', '교육ㆍ운영ㆍ소식', '공지') THEN
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM "news_centers"
                WHERE "news_centers"."parent_id" = "news"."id"
                  AND "news_centers"."value" = 'exam'
              ) THEN '교육·운영·소식'
              ELSE '교육ㆍ운영ㆍ소식'
            END
          WHEN "news"."category" LIKE '%OnAir%' THEN '캐스팅OnAir'
          WHEN "news"."category" LIKE '%캐스팅확정%' THEN '캐스팅확정'
          WHEN "news"."category" = '캐스팅' AND "news"."title" LIKE '%캐스팅확정%' THEN '캐스팅확정'
          WHEN "news"."category" LIKE '%오디션%'
            OR "news"."category" LIKE '%캐스팅공지%'
            OR "news"."category" LIKE '%캐스팅진행%'
            OR "news"."category" IN ('캐스팅', '매니지먼트') THEN '오디션ㆍ캐스팅공지'
          ELSE
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM "news_centers"
                WHERE "news_centers"."parent_id" = "news"."id"
                  AND "news_centers"."value" = 'exam'
              ) THEN '교육·운영·소식'
              ELSE '교육ㆍ운영ㆍ소식'
            END
        END AS "category"
      FROM "news"
    )
    UPDATE "news"
    SET "category" = normalized."category"
    FROM normalized
    WHERE normalized."id" = "news"."id"
      AND normalized."category" IS DISTINCT FROM "news"."category";

    ALTER TABLE "news"
      ALTER COLUMN "category" TYPE "public"."enum_news_category"
      USING "category"::"public"."enum_news_category";

    CREATE INDEX IF NOT EXISTS "news_category_idx"
      ON "news" USING btree ("category");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "news_category_idx";

    ALTER TABLE "news"
      ALTER COLUMN "category" TYPE varchar
      USING "category"::varchar;

    DROP TYPE IF EXISTS "public"."enum_news_category";
  `)
}
