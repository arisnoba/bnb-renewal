import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "_news_v" AS "versions"
    USING "news" AS "target_news"
    WHERE "versions"."parent_id" = "target_news"."id"
      AND "target_news"."category" = '오디션ㆍ캐스팅공지';

    DELETE FROM "news"
    WHERE "category" = '오디션ㆍ캐스팅공지';

    ALTER TABLE "news"
      ALTER COLUMN "category" TYPE text
      USING "category"::text;

    ALTER TABLE "_news_v"
      ALTER COLUMN "version_category" TYPE text
      USING "version_category"::text;

    DROP TYPE "public"."enum_news_category";
    DROP TYPE "public"."enum__news_v_version_category";

    CREATE TYPE "public"."enum_news_category" AS ENUM (
      '캐스팅확정',
      '캐스팅OnAir',
      '교육ㆍ운영ㆍ소식',
      '합격현황',
      '교육·운영·소식'
    );

    CREATE TYPE "public"."enum__news_v_version_category" AS ENUM (
      '캐스팅확정',
      '캐스팅OnAir',
      '교육ㆍ운영ㆍ소식',
      '합격현황',
      '교육·운영·소식'
    );

    ALTER TABLE "news"
      ALTER COLUMN "category" TYPE "public"."enum_news_category"
      USING "category"::"public"."enum_news_category";

    ALTER TABLE "_news_v"
      ALTER COLUMN "version_category" TYPE "public"."enum__news_v_version_category"
      USING "version_category"::"public"."enum__news_v_version_category";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news"
      ALTER COLUMN "category" TYPE text
      USING "category"::text;

    ALTER TABLE "_news_v"
      ALTER COLUMN "version_category" TYPE text
      USING "version_category"::text;

    DROP TYPE "public"."enum_news_category";
    DROP TYPE "public"."enum__news_v_version_category";

    CREATE TYPE "public"."enum_news_category" AS ENUM (
      '오디션ㆍ캐스팅공지',
      '캐스팅확정',
      '캐스팅OnAir',
      '교육ㆍ운영ㆍ소식',
      '합격현황',
      '교육·운영·소식'
    );

    CREATE TYPE "public"."enum__news_v_version_category" AS ENUM (
      '오디션ㆍ캐스팅공지',
      '캐스팅확정',
      '캐스팅OnAir',
      '교육ㆍ운영ㆍ소식',
      '합격현황',
      '교육·운영·소식'
    );

    ALTER TABLE "news"
      ALTER COLUMN "category" TYPE "public"."enum_news_category"
      USING "category"::"public"."enum_news_category";

    ALTER TABLE "_news_v"
      ALTER COLUMN "version_category" TYPE "public"."enum__news_v_version_category"
      USING "version_category"::"public"."enum__news_v_version_category";
  `)
}
