import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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

    ALTER TABLE "curriculums"
      ADD COLUMN IF NOT EXISTS "centers" "public"."enum_curriculums_centers";

    WITH selected_centers AS (
      SELECT
        "parent_id",
        CASE
          WHEN bool_or("value"::text = 'exam') THEN 'exam'
          WHEN bool_or("value"::text = 'highteen') THEN 'highteen'
          WHEN bool_or("value"::text = 'avenue') THEN 'avenue'
          WHEN bool_or("value"::text = 'art') THEN 'art'
          ELSE NULL
        END AS "center"
      FROM "curriculums_centers"
      GROUP BY "parent_id"
    )
    UPDATE "curriculums"
    SET
      "centers" = selected_centers."center"::"public"."enum_curriculums_centers",
      "class_name" = CASE selected_centers."center"
        WHEN 'exam' THEN '입시반'::"public"."enum_curriculums_class_name"
        WHEN 'highteen' THEN CASE "curriculums"."class_name"::text
          WHEN '초급 I Class' THEN '입문 I CLASS'::"public"."enum_curriculums_class_name"
          WHEN '중급 R Class' THEN '중급 R CLASS'::"public"."enum_curriculums_class_name"
          WHEN '고급 U Class' THEN '심화 U CLASS'::"public"."enum_curriculums_class_name"
          ELSE '전문 DA CLASS'::"public"."enum_curriculums_class_name"
        END
        ELSE "curriculums"."class_name"
      END
    FROM selected_centers
    WHERE "curriculums"."id" = selected_centers."parent_id";

    UPDATE "curriculums"
    SET "centers" = 'art'::"public"."enum_curriculums_centers"
    WHERE "centers" IS NULL;

    DROP TABLE IF EXISTS "curriculums_centers" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "curriculums_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum_curriculums_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_centers_parent_fk'
      ) THEN
        ALTER TABLE "curriculums_centers"
        ADD CONSTRAINT "curriculums_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."curriculums"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    TRUNCATE TABLE "curriculums_centers";

    INSERT INTO "curriculums_centers" ("order", "parent_id", "value")
    SELECT
      1,
      "id",
      "centers"
    FROM "curriculums"
    WHERE "centers" IS NOT NULL;

    UPDATE "curriculums"
    SET "class_name" = CASE "class_name"::text
      WHEN '입시반' THEN '초급 I Class'::"public"."enum_curriculums_class_name"
      WHEN '입시예비반' THEN '초급 I Class'::"public"."enum_curriculums_class_name"
      WHEN '예고입시반' THEN '초급 I Class'::"public"."enum_curriculums_class_name"
      WHEN '입문 I CLASS' THEN '초급 I Class'::"public"."enum_curriculums_class_name"
      WHEN '중급 R CLASS' THEN '중급 R Class'::"public"."enum_curriculums_class_name"
      WHEN '심화 U CLASS' THEN '고급 U Class'::"public"."enum_curriculums_class_name"
      WHEN '전문 DA CLASS' THEN '전문 D Class'::"public"."enum_curriculums_class_name"
      ELSE "class_name"
    END;

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
      '특강반'
    );

    ALTER TABLE "curriculums"
      ALTER COLUMN "class_name" TYPE "public"."enum_curriculums_class_name"
      USING "class_name"::"public"."enum_curriculums_class_name";

    CREATE INDEX IF NOT EXISTS "curriculums_centers_order_idx"
      ON "curriculums_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "curriculums_centers_parent_idx"
      ON "curriculums_centers" USING btree ("parent_id");

    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "centers";
  `)
}
