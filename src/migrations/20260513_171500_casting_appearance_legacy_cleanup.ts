import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.normalize_casting_appearance_thumbnail_path(
      image_path varchar,
      source_db varchar,
      source_id numeric
    )
    RETURNS varchar AS $$
    DECLARE
      trimmed varchar;
      file_name varchar;
    BEGIN
      trimmed := btrim(coalesce(image_path, ''));

      IF trimmed = '' THEN
        RETURN image_path;
      END IF;

      IF trimmed ~ '^/legacy/casting-appearances/' THEN
        RETURN trimmed;
      END IF;

      IF trimmed ~ '^/(api|media|uploads|_next)/' THEN
        RETURN trimmed;
      END IF;

      IF source_id IS NULL THEN
        RETURN trimmed;
      END IF;

      IF trimmed ~ '^(https?:)?//' AND trimmed !~ '/web/data/file/new_appear/' THEN
        RETURN trimmed;
      END IF;

      file_name := regexp_replace(split_part(trimmed, '?', 1), '^.*/', '');

      IF file_name = '' THEN
        RETURN trimmed;
      END IF;

      RETURN '/legacy/casting-appearances/'
        || COALESCE(NULLIF(source_db, ''), 'baewoo')
        || '/new_appear/'
        || source_id
        || '/thumbnail/'
        || file_name;
    END
    $$ LANGUAGE plpgsql IMMUTABLE;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'casting_appearances'
          AND column_name = 'source_db'
      ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'casting_appearances'
          AND column_name = 'source_id'
      ) THEN
        UPDATE "casting_appearances"
        SET "thumbnail_path" = pg_temp.normalize_casting_appearance_thumbnail_path(
          "thumbnail_path",
          "source_db",
          "source_id"
        );
      END IF;
    END $$;

    DROP INDEX IF EXISTS "casting_appearances_slug_idx";

    ALTER TABLE "casting_appearances"
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "body_html",
      DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "casting_appearances"
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "slug" varchar,
      ADD COLUMN IF NOT EXISTS "body_html" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "casting_appearances"
    SET
      "source_db" = coalesce("source_db", 'legacy'),
      "source_table" = coalesce("source_table", 'casting_appearances'),
      "source_id" = coalesce("source_id", "id"),
      "slug" = coalesce("slug", concat('casting-appearance-', "id")),
      "body_html" = coalesce("body_html", '진행중인 캐스팅출연현황')
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL
      OR "slug" IS NULL
      OR "body_html" IS NULL;

    ALTER TABLE "casting_appearances" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "casting_appearances" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "casting_appearances" ALTER COLUMN "source_id" SET NOT NULL;
    ALTER TABLE "casting_appearances" ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "casting_appearances_slug_idx"
      ON "casting_appearances" USING btree ("slug");
  `)
}
