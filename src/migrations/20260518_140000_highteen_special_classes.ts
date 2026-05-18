import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_highteen_special_classes_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_highteen_special_classes_display_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "highteen_special_classes" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "youtube_url" varchar,
      "body" jsonb,
      "thumbnail_path" varchar,
      "display_status" "enum_highteen_special_classes_display_status" DEFAULT 'published',
      "published_at" timestamp(3) with time zone,
      "author_name" varchar,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "source_db" varchar,
      "source_table" varchar,
      "source_id" numeric,
      "legacy_meta" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "highteen_special_classes_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_highteen_special_classes_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "highteen_special_classes_gallery_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "source_file" varchar NOT NULL,
      "image_path" varchar,
      "display_order" numeric DEFAULT 0
    );

    DO $$
    BEGIN
      ALTER TABLE "highteen_special_classes_centers"
        ADD CONSTRAINT "highteen_special_classes_centers_parent_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."highteen_special_classes"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "highteen_special_classes_gallery_images"
        ADD CONSTRAINT "highteen_special_classes_gallery_images_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."highteen_special_classes"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "highteen_special_classes_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_highteen_special_classes_fk"
        FOREIGN KEY ("highteen_special_classes_id")
        REFERENCES "public"."highteen_special_classes"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "highteen_special_classes_slug_idx"
      ON "highteen_special_classes" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_updated_at_idx"
      ON "highteen_special_classes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_created_at_idx"
      ON "highteen_special_classes" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_centers_order_idx"
      ON "highteen_special_classes_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_centers_parent_id_idx"
      ON "highteen_special_classes_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_gallery_images_order_idx"
      ON "highteen_special_classes_gallery_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_gallery_images_parent_id_idx"
      ON "highteen_special_classes_gallery_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_highteen_special_classes_id_idx"
      ON "payload_locked_documents_rels" USING btree ("highteen_special_classes_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_highteen_special_classes_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_highteen_special_classes_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "highteen_special_classes_id";

    DROP TABLE IF EXISTS "highteen_special_classes_gallery_images" CASCADE;
    DROP TABLE IF EXISTS "highteen_special_classes_centers" CASCADE;
    DROP TABLE IF EXISTS "highteen_special_classes" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_highteen_special_classes_display_status";
    DROP TYPE IF EXISTS "public"."enum_highteen_special_classes_centers";
  `)
}
