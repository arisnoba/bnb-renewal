import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum__profiles_v_version_centers'
      ) THEN
        CREATE TYPE "public"."enum__profiles_v_version_centers" AS ENUM(
          'all',
          'art',
          'exam',
          'kids',
          'highteen',
          'avenue'
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum__profiles_v_version_display_status'
      ) THEN
        CREATE TYPE "public"."enum__profiles_v_version_display_status" AS ENUM(
          'draft',
          'published',
          'archived'
        );
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "_profiles_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_name" varchar NOT NULL,
      "version_english_name" varchar NOT NULL,
      "version_filter" varchar NOT NULL,
      "version_height" varchar,
      "version_weight" varchar,
      "version_profile_image_path" varchar NOT NULL,
      "version_slug" varchar NOT NULL,
      "version_published_at" timestamp(3) with time zone,
      "version_display_status" "public"."enum__profiles_v_version_display_status" DEFAULT 'archived',
      "version_author_name" varchar,
      "version_created_at" timestamp(3) with time zone,
      "version_updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_profiles_v_version_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum__profiles_v_version_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_profiles_v_version_career_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "content" varchar,
      "_uuid" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_profiles_v_parent_id_profiles_id_fk'
      ) THEN
        ALTER TABLE "_profiles_v"
        ADD CONSTRAINT "_profiles_v_parent_id_profiles_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_profiles_v_version_centers_parent_fk'
      ) THEN
        ALTER TABLE "_profiles_v_version_centers"
        ADD CONSTRAINT "_profiles_v_version_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."_profiles_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_profiles_v_version_career_items_parent_id_fk'
      ) THEN
        ALTER TABLE "_profiles_v_version_career_items"
        ADD CONSTRAINT "_profiles_v_version_career_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_profiles_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "_profiles_v_parent_idx"
      ON "_profiles_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_profiles_v_created_at_idx"
      ON "_profiles_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_profiles_v_updated_at_idx"
      ON "_profiles_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_version_slug_idx"
      ON "_profiles_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_version_created_at_idx"
      ON "_profiles_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_version_updated_at_idx"
      ON "_profiles_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_centers_order_idx"
      ON "_profiles_v_version_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_centers_parent_idx"
      ON "_profiles_v_version_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_career_items_order_idx"
      ON "_profiles_v_version_career_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_profiles_v_version_career_items_parent_id_idx"
      ON "_profiles_v_version_career_items" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_profiles_v_version_career_items" CASCADE;
    DROP TABLE IF EXISTS "_profiles_v_version_centers" CASCADE;
    DROP TABLE IF EXISTS "_profiles_v" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__profiles_v_version_centers";
    DROP TYPE IF EXISTS "public"."enum__profiles_v_version_display_status";
  `)
}
