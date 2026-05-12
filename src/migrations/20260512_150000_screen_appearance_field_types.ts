import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_screen_appearances_appearance_type" AS ENUM (
        'drama',
        'commercial'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE OR REPLACE FUNCTION "public"."_screen_appearance_air_date_from_label"("raw_value" text)
    RETURNS timestamp(3) with time zone
    LANGUAGE plpgsql
    IMMUTABLE
    AS $$
    DECLARE
      "cleaned" text := btrim("raw_value");
      "parts" text[];
      "year_value" integer;
      "month_value" integer;
      "day_value" integer;
    BEGIN
      IF "cleaned" IS NULL OR "cleaned" = '' THEN
        RETURN NULL;
      END IF;

      "cleaned" := regexp_replace("cleaned", '^2202(?=[.-])', '2022');
      "cleaned" := regexp_replace("cleaned", '\\.\\.+', '.', 'g');

      "parts" := regexp_match("cleaned", '^([0-9]{4})\\s*[.-]\\s*([0-9]{1,2})\\s*[.-]\\s*([0-9]{1,2})');

      IF "parts" IS NOT NULL THEN
        "year_value" := "parts"[1]::integer;
        "month_value" := "parts"[2]::integer;
        "day_value" := "parts"[3]::integer;
      ELSE
        "parts" := regexp_match("cleaned", '^([0-9]{2})\\s*[.]\\s*([0-9]{1,2})\\s*[.]\\s*([0-9]{1,2})');

        IF "parts" IS NULL THEN
          RETURN NULL;
        END IF;

        "year_value" := 2000 + "parts"[1]::integer;
        "month_value" := "parts"[2]::integer;
        "day_value" := "parts"[3]::integer;
      END IF;

      IF
        "year_value" < 1900
        OR "year_value" > 2100
        OR "month_value" < 1
        OR "month_value" > 12
        OR "day_value" < 1
        OR "day_value" > 31
      THEN
        RETURN NULL;
      END IF;

      BEGIN
        RETURN make_timestamptz("year_value", "month_value", "day_value", 0, 0, 0, 'UTC');
      EXCEPTION
        WHEN datetime_field_overflow THEN
          RETURN NULL;
      END;
    END
    $$;

    UPDATE "screen_appearances"
    SET "appearance_type" = 'drama'
    WHERE "appearance_type" IS NULL
      OR "appearance_type" NOT IN ('drama', 'commercial');

    ALTER TABLE "screen_appearances"
      ALTER COLUMN "appearance_type" TYPE "public"."enum_screen_appearances_appearance_type"
        USING "appearance_type"::"public"."enum_screen_appearances_appearance_type",
      ALTER COLUMN "air_date_label" TYPE timestamp(3) with time zone
        USING "public"."_screen_appearance_air_date_from_label"("air_date_label");

    DROP FUNCTION IF EXISTS "public"."_screen_appearance_air_date_from_label"(text);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ALTER COLUMN "appearance_type" TYPE varchar
        USING "appearance_type"::varchar,
      ALTER COLUMN "air_date_label" TYPE varchar
        USING to_char("air_date_label" AT TIME ZONE 'Asia/Seoul', 'YYYY.MM.DD');

    DROP TYPE IF EXISTS "public"."enum_screen_appearances_appearance_type";
  `)
}
