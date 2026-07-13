import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_curriculums_centers"
      ADD VALUE IF NOT EXISTS 'kids' AFTER 'exam';

    ALTER TYPE "public"."enum_curriculums_class_name"
      ADD VALUE IF NOT EXISTS '영재교육 Class' AFTER '전문 DA CLASS';
    ALTER TYPE "public"."enum_curriculums_class_name"
      ADD VALUE IF NOT EXISTS '아역배우 Class' AFTER '영재교육 Class';
    ALTER TYPE "public"."enum_curriculums_class_name"
      ADD VALUE IF NOT EXISTS '아티스트 Class' AFTER '아역배우 Class';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "curriculums"
    SET "centers" = 'art'::"public"."enum_curriculums_centers"
    WHERE "centers"::text = 'kids';

    UPDATE "curriculums"
    SET "class_name" = CASE "class_name"::text
      WHEN '영재교육 Class' THEN '초급 I Class'::"public"."enum_curriculums_class_name"
      WHEN '아역배우 Class' THEN '중급 R Class'::"public"."enum_curriculums_class_name"
      WHEN '아티스트 Class' THEN '고급 U Class'::"public"."enum_curriculums_class_name"
      ELSE "class_name"
    END
    WHERE "class_name"::text IN ('영재교육 Class', '아역배우 Class', '아티스트 Class');

    ALTER TABLE "curriculums"
      ALTER COLUMN "centers" TYPE varchar
      USING "centers"::text;

    DROP TYPE IF EXISTS "public"."enum_curriculums_centers";
    CREATE TYPE "public"."enum_curriculums_centers" AS ENUM (
      'art',
      'exam',
      'highteen',
      'avenue'
    );

    ALTER TABLE "curriculums"
      ALTER COLUMN "centers" TYPE "public"."enum_curriculums_centers"
      USING "centers"::"public"."enum_curriculums_centers";

    ALTER TABLE "curriculums"
      ALTER COLUMN "class_name" TYPE varchar
      USING "class_name"::text;

    DROP TYPE IF EXISTS "public"."enum_curriculums_class_name";
    CREATE TYPE "public"."enum_curriculums_class_name" AS ENUM (
      '초급 I Class',
      '중급 R Class',
      '고급 U Class',
      '전문 D Class',
      '배우 A Class',
      '애비뉴 S Class',
      '특강반',
      '입시반',
      '입시예비반',
      '예고입시반',
      '입문 I CLASS',
      '중급 R CLASS',
      '심화 U CLASS',
      '전문 DA CLASS'
    );

    ALTER TABLE "curriculums"
      ALTER COLUMN "class_name" TYPE "public"."enum_curriculums_class_name"
      USING "class_name"::"public"."enum_curriculums_class_name";
  `)
}
