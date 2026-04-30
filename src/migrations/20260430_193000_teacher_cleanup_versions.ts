import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.normalize_teacher_image_path(
      image_path varchar,
      source_db varchar,
      source_table varchar
    )
    RETURNS varchar AS $$
    DECLARE
      trimmed varchar;
      source_path varchar;
    BEGIN
      trimmed := btrim(coalesce(image_path, ''));

      IF trimmed = '' THEN
        RETURN image_path;
      END IF;

      IF trimmed ~ '^(https?:)?//' OR trimmed ~ '^/(api|legacy|media|uploads|_next)/' THEN
        RETURN trimmed;
      END IF;

      source_path := regexp_replace(trimmed, '^/+', '');
      source_path := regexp_replace(
        source_path,
        '^(web/data/teacher/|data/teacher/|legacy/teachers/)',
        ''
      );

      IF source_path LIKE source_db || '/' || source_table || '/%' THEN
        RETURN '/legacy/teachers/' || source_path;
      END IF;

      RETURN '/legacy/teachers/' || source_db || '/' || source_table || '/' || source_path;
    END
    $$ LANGUAGE plpgsql IMMUTABLE;

    UPDATE "teachers"
    SET
      "profile_image_path" = pg_temp.normalize_teacher_image_path(
        "profile_image_path",
        "source_db",
        "source_table"
      ),
      "photo_image1" = pg_temp.normalize_teacher_image_path(
        "photo_image1",
        "source_db",
        "source_table"
      ),
      "photo_image2" = pg_temp.normalize_teacher_image_path(
        "photo_image2",
        "source_db",
        "source_table"
      ),
      "photo_image3" = pg_temp.normalize_teacher_image_path(
        "photo_image3",
        "source_db",
        "source_table"
      ),
      "photo_image4" = pg_temp.normalize_teacher_image_path(
        "photo_image4",
        "source_db",
        "source_table"
      ),
      "photo_image5" = pg_temp.normalize_teacher_image_path(
        "photo_image5",
        "source_db",
        "source_table"
      ),
      "photo_image6" = pg_temp.normalize_teacher_image_path(
        "photo_image6",
        "source_db",
        "source_table"
      );

    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "legacy_meta";

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum__teachers_v_version_centers'
      ) THEN
        CREATE TYPE "public"."enum__teachers_v_version_centers" AS ENUM(
          'all',
          'art',
          'exam',
          'kids',
          'highteen',
          'avenue'
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum__teachers_v_version_status'
      ) THEN
        CREATE TYPE "public"."enum__teachers_v_version_status" AS ENUM(
          'draft',
          'published',
          'archived'
        );
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "_teachers_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_name" varchar NOT NULL,
      "version_role" varchar,
      "version_summary" varchar,
      "version_profile_image_path" varchar,
      "version_photo_image1" varchar,
      "version_photo_image2" varchar,
      "version_photo_image3" varchar,
      "version_photo_image4" varchar,
      "version_photo_image5" varchar,
      "version_photo_image6" varchar,
      "version_bio_html" varchar NOT NULL,
      "version_author_name" varchar,
      "version_display_order" numeric,
      "version_status" "public"."enum__teachers_v_version_status" DEFAULT 'archived',
      "version_generate_slug" boolean DEFAULT true,
      "version_slug" varchar NOT NULL,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_teachers_v_version_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum__teachers_v_version_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_teachers_v_version_career_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "content" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_teachers_v_version_representative_works" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "poster_path" varchar,
      "description" varchar,
      "_uuid" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_teachers_v_parent_id_teachers_id_fk'
      ) THEN
        ALTER TABLE "_teachers_v"
        ADD CONSTRAINT "_teachers_v_parent_id_teachers_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."teachers"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_teachers_v_version_centers_parent_fk'
      ) THEN
        ALTER TABLE "_teachers_v_version_centers"
        ADD CONSTRAINT "_teachers_v_version_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."_teachers_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_teachers_v_version_career_items_parent_id_fk'
      ) THEN
        ALTER TABLE "_teachers_v_version_career_items"
        ADD CONSTRAINT "_teachers_v_version_career_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_teachers_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_teachers_v_version_representative_works_parent_id_fk'
      ) THEN
        ALTER TABLE "_teachers_v_version_representative_works"
        ADD CONSTRAINT "_teachers_v_version_representative_works_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_teachers_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "_teachers_v_parent_idx"
      ON "_teachers_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_teachers_v_created_at_idx"
      ON "_teachers_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_teachers_v_updated_at_idx"
      ON "_teachers_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_version_slug_idx"
      ON "_teachers_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_version_updated_at_idx"
      ON "_teachers_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_version_created_at_idx"
      ON "_teachers_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_centers_order_idx"
      ON "_teachers_v_version_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_centers_parent_idx"
      ON "_teachers_v_version_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_career_items_order_idx"
      ON "_teachers_v_version_career_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_career_items_parent_id_idx"
      ON "_teachers_v_version_career_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_representative_works_order_idx"
      ON "_teachers_v_version_representative_works" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_representative_works_parent_id_idx"
      ON "_teachers_v_version_representative_works" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_teachers_v_version_representative_works" CASCADE;
    DROP TABLE IF EXISTS "_teachers_v_version_career_items" CASCADE;
    DROP TABLE IF EXISTS "_teachers_v_version_centers" CASCADE;
    DROP TABLE IF EXISTS "_teachers_v" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__teachers_v_version_centers";
    DROP TYPE IF EXISTS "public"."enum__teachers_v_version_status";

    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "teachers"
    SET
      "source_db" = coalesce(
        nullif(split_part(regexp_replace(coalesce("profile_image_path", ''), '^/legacy/teachers/', ''), '/', 1), ''),
        'mock'
      ),
      "source_table" = coalesce(
        nullif(split_part(regexp_replace(coalesce("profile_image_path", ''), '^/legacy/teachers/', ''), '/', 2), ''),
        'g5_teacher2'
      ),
      "source_id" = CASE
        WHEN split_part(
          regexp_replace(coalesce("profile_image_path", ''), '^/legacy/teachers/', ''),
          '/',
          3
        ) ~ '^[0-9]+$'
          THEN split_part(
            regexp_replace(coalesce("profile_image_path", ''), '^/legacy/teachers/', ''),
            '/',
            3
          )::numeric
        ELSE "id"
      END
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL;

    ALTER TABLE "teachers" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "teachers" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "teachers" ALTER COLUMN "source_id" SET NOT NULL;
  `)
}
