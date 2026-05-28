import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "main_rels" CASCADE;
    DROP TABLE IF EXISTS "main_main_banners" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_main_main_banners_status";
    DROP TYPE IF EXISTS "public"."enum_main_main_banners_center";

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_main_banners_center') THEN
        CREATE TYPE "public"."enum_main_banners_center" AS ENUM(
          'art',
          'exam',
          'kids',
          'highteen',
          'avenue'
        );
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_main_banners_status') THEN
        CREATE TYPE "public"."enum_main_banners_status" AS ENUM('draft', 'published');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "main" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "main_banners" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "broadcaster" varchar,
      "description" varchar,
      "desktop_image_id" integer,
      "mobile_image_id" integer,
      "desktop_video_id" integer,
      "mobile_video_id" integer,
      "center" "public"."enum_main_banners_center",
      "status" "public"."enum_main_banners_status" DEFAULT 'draft',
      "use_reservation" boolean DEFAULT false,
      "publish_start_at" timestamp(3) with time zone,
      "publish_end_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "main_banners_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "profiles_id" integer,
      "exam_passed_reviews_id" integer
    );

    CREATE TABLE IF NOT EXISTS "main_art_banners" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "banner_id" integer
    );

    CREATE TABLE IF NOT EXISTS "main_exam_banners" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "banner_id" integer
    );

    CREATE TABLE IF NOT EXISTS "main_kids_banners" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "banner_id" integer
    );

    CREATE TABLE IF NOT EXISTS "main_highteen_banners" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "banner_id" integer
    );

    CREATE TABLE IF NOT EXISTS "main_avenue_banners" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "banner_id" integer
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_desktop_image_id_media_id_fk'
      ) THEN
        ALTER TABLE "main_banners"
          ADD CONSTRAINT "main_banners_desktop_image_id_media_id_fk"
          FOREIGN KEY ("desktop_image_id")
          REFERENCES "public"."media"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_mobile_image_id_media_id_fk'
      ) THEN
        ALTER TABLE "main_banners"
          ADD CONSTRAINT "main_banners_mobile_image_id_media_id_fk"
          FOREIGN KEY ("mobile_image_id")
          REFERENCES "public"."media"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_desktop_video_id_media_id_fk'
      ) THEN
        ALTER TABLE "main_banners"
          ADD CONSTRAINT "main_banners_desktop_video_id_media_id_fk"
          FOREIGN KEY ("desktop_video_id")
          REFERENCES "public"."media"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_mobile_video_id_media_id_fk'
      ) THEN
        ALTER TABLE "main_banners"
          ADD CONSTRAINT "main_banners_mobile_video_id_media_id_fk"
          FOREIGN KEY ("mobile_video_id")
          REFERENCES "public"."media"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_rels_parent_fk') THEN
        ALTER TABLE "main_banners_rels"
          ADD CONSTRAINT "main_banners_rels_parent_fk"
          FOREIGN KEY ("parent_id")
          REFERENCES "public"."main_banners"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_rels_profiles_fk'
      ) THEN
        ALTER TABLE "main_banners_rels"
          ADD CONSTRAINT "main_banners_rels_profiles_fk"
          FOREIGN KEY ("profiles_id")
          REFERENCES "public"."profiles"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_rels_exam_passed_reviews_fk'
      ) THEN
        ALTER TABLE "main_banners_rels"
          ADD CONSTRAINT "main_banners_rels_exam_passed_reviews_fk"
          FOREIGN KEY ("exam_passed_reviews_id")
          REFERENCES "public"."exam_passed_reviews"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;
    END $$;

    DO $$
    DECLARE
      table_name text;
    BEGIN
      FOREACH table_name IN ARRAY ARRAY[
        'main_art_banners',
        'main_exam_banners',
        'main_kids_banners',
        'main_highteen_banners',
        'main_avenue_banners'
      ]
      LOOP
        BEGIN
          EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("_parent_id") REFERENCES "public"."main"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
            table_name,
            table_name || '_parent_id_fk'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
      END LOOP;
    END $$;

    DO $$
    DECLARE
      table_name text;
    BEGIN
      FOREACH table_name IN ARRAY ARRAY[
        'main_art_banners',
        'main_exam_banners',
        'main_kids_banners',
        'main_highteen_banners',
        'main_avenue_banners'
      ]
      LOOP
        BEGIN
          EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("banner_id") REFERENCES "public"."main_banners"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
            table_name,
            table_name || '_banner_id_main_banners_id_fk'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
      END LOOP;
    END $$;

    CREATE INDEX IF NOT EXISTS "main_banners_center_idx" ON "main_banners" USING btree ("center");
    CREATE INDEX IF NOT EXISTS "main_banners_status_idx" ON "main_banners" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "main_banners_updated_at_idx" ON "main_banners" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "main_banners_desktop_image_idx" ON "main_banners" USING btree ("desktop_image_id");
    CREATE INDEX IF NOT EXISTS "main_banners_mobile_image_idx" ON "main_banners" USING btree ("mobile_image_id");
    CREATE INDEX IF NOT EXISTS "main_banners_desktop_video_idx" ON "main_banners" USING btree ("desktop_video_id");
    CREATE INDEX IF NOT EXISTS "main_banners_mobile_video_idx" ON "main_banners" USING btree ("mobile_video_id");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_order_idx" ON "main_banners_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_parent_idx" ON "main_banners_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_path_idx" ON "main_banners_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_profiles_id_idx" ON "main_banners_rels" USING btree ("profiles_id");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_exam_passed_reviews_id_idx" ON "main_banners_rels" USING btree ("exam_passed_reviews_id");
    CREATE INDEX IF NOT EXISTS "main_art_banners_order_idx" ON "main_art_banners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_art_banners_parent_id_idx" ON "main_art_banners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_art_banners_banner_idx" ON "main_art_banners" USING btree ("banner_id");
    CREATE INDEX IF NOT EXISTS "main_exam_banners_order_idx" ON "main_exam_banners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_exam_banners_parent_id_idx" ON "main_exam_banners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_exam_banners_banner_idx" ON "main_exam_banners" USING btree ("banner_id");
    CREATE INDEX IF NOT EXISTS "main_kids_banners_order_idx" ON "main_kids_banners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_kids_banners_parent_id_idx" ON "main_kids_banners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_kids_banners_banner_idx" ON "main_kids_banners" USING btree ("banner_id");
    CREATE INDEX IF NOT EXISTS "main_highteen_banners_order_idx" ON "main_highteen_banners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_highteen_banners_parent_id_idx" ON "main_highteen_banners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_highteen_banners_banner_idx" ON "main_highteen_banners" USING btree ("banner_id");
    CREATE INDEX IF NOT EXISTS "main_avenue_banners_order_idx" ON "main_avenue_banners" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_avenue_banners_parent_id_idx" ON "main_avenue_banners" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_avenue_banners_banner_idx" ON "main_avenue_banners" USING btree ("banner_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "main_avenue_banners" CASCADE;
    DROP TABLE IF EXISTS "main_highteen_banners" CASCADE;
    DROP TABLE IF EXISTS "main_kids_banners" CASCADE;
    DROP TABLE IF EXISTS "main_exam_banners" CASCADE;
    DROP TABLE IF EXISTS "main_art_banners" CASCADE;
    DROP TABLE IF EXISTS "main_banners_rels" CASCADE;
    DROP TABLE IF EXISTS "main_banners" CASCADE;
    DROP TABLE IF EXISTS "main" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_main_banners_status";
    DROP TYPE IF EXISTS "public"."enum_main_banners_center";
  `)
}
