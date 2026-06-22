import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ALTER COLUMN "preferred_time" TYPE text
      USING "preferred_time"::text,
      ALTER COLUMN "inflow_source" TYPE text
      USING "inflow_source"::text;

    UPDATE "inquiries"
    SET "preferred_time" = CASE "preferred_time"
      WHEN '오전' THEN '11:00'
      WHEN '오후' THEN '13:00'
      WHEN '저녁' THEN '18:00'
      WHEN '상담 후 조율' THEN '13:00'
      ELSE "preferred_time"
    END
    WHERE "preferred_time" IN ('오전', '오후', '저녁', '상담 후 조율');

    UPDATE "inquiries"
    SET "inflow_source" = CASE "inflow_source"
      WHEN '랜딩' THEN '기타'
      WHEN '포털' THEN '포털 사이트(구글, 네이버)'
      WHEN 'SNS' THEN 'SNS(인스타그램, 스레드 등)'
      WHEN 'AI' THEN 'AI(GPT, gemini, claude)'
      ELSE "inflow_source"
    END
    WHERE "inflow_source" IN ('랜딩', '포털', 'SNS', 'AI');

    DROP TYPE IF EXISTS "public"."enum_inquiries_preferred_time";
    CREATE TYPE "public"."enum_inquiries_preferred_time" AS ENUM(
      '11:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00'
    );

    DROP TYPE IF EXISTS "public"."enum_inquiries_inflow_source";
    CREATE TYPE "public"."enum_inquiries_inflow_source" AS ENUM(
      '포털 사이트(구글, 네이버)',
      'SNS(인스타그램, 스레드 등)',
      '유튜브',
      '네이버카페',
      '지인소개',
      'AI(GPT, gemini, claude)',
      '기타'
    );

    ALTER TABLE "inquiries"
      ALTER COLUMN "preferred_time" TYPE "public"."enum_inquiries_preferred_time"
      USING "preferred_time"::"public"."enum_inquiries_preferred_time",
      ALTER COLUMN "inflow_source" TYPE "public"."enum_inquiries_inflow_source"
      USING "inflow_source"::"public"."enum_inquiries_inflow_source";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ALTER COLUMN "preferred_time" TYPE text
      USING "preferred_time"::text,
      ALTER COLUMN "inflow_source" TYPE text
      USING "inflow_source"::text;

    UPDATE "inquiries"
    SET "preferred_time" = CASE "preferred_time"
      WHEN '11:00' THEN '오전'
      WHEN '13:00' THEN '오후'
      WHEN '14:00' THEN '오후'
      WHEN '15:00' THEN '오후'
      WHEN '16:00' THEN '오후'
      WHEN '17:00' THEN '저녁'
      WHEN '18:00' THEN '저녁'
      ELSE "preferred_time"
    END
    WHERE "preferred_time" IN ('11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00');

    UPDATE "inquiries"
    SET "inflow_source" = CASE "inflow_source"
      WHEN '포털 사이트(구글, 네이버)' THEN '포털'
      WHEN 'SNS(인스타그램, 스레드 등)' THEN 'SNS'
      WHEN '유튜브' THEN '기타'
      WHEN 'AI(GPT, gemini, claude)' THEN 'AI'
      ELSE "inflow_source"
    END
    WHERE "inflow_source" IN (
      '포털 사이트(구글, 네이버)',
      'SNS(인스타그램, 스레드 등)',
      '유튜브',
      'AI(GPT, gemini, claude)'
    );

    DROP TYPE IF EXISTS "public"."enum_inquiries_preferred_time";
    CREATE TYPE "public"."enum_inquiries_preferred_time" AS ENUM(
      '오전',
      '오후',
      '저녁',
      '상담 후 조율'
    );

    DROP TYPE IF EXISTS "public"."enum_inquiries_inflow_source";
    CREATE TYPE "public"."enum_inquiries_inflow_source" AS ENUM(
      '랜딩',
      '포털',
      'SNS',
      '네이버카페',
      '지인소개',
      'AI',
      '기타'
    );

    ALTER TABLE "inquiries"
      ALTER COLUMN "preferred_time" TYPE "public"."enum_inquiries_preferred_time"
      USING "preferred_time"::"public"."enum_inquiries_preferred_time",
      ALTER COLUMN "inflow_source" TYPE "public"."enum_inquiries_inflow_source"
      USING "inflow_source"::"public"."enum_inquiries_inflow_source";
  `)
}
