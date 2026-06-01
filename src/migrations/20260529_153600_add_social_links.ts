import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_social_links_center" AS ENUM(
        'art',
        'exam',
        'kids',
        'highteen',
        'avenue'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_social_links_display_status" AS ENUM(
        'draft',
        'published',
        'archived'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "social_links" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "center" "enum_social_links_center",
      "representative_image_id" integer,
      "external_url" varchar,
      "display_status" "enum_social_links_display_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "social_links"
        ADD CONSTRAINT "social_links_representative_image_id_media_id_fk"
        FOREIGN KEY ("representative_image_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "social_links_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_social_links_fk"
        FOREIGN KEY ("social_links_id")
        REFERENCES "public"."social_links"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "social_links_representative_image_idx"
      ON "social_links" USING btree ("representative_image_id");
    CREATE INDEX IF NOT EXISTS "social_links_created_at_idx"
      ON "social_links" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "social_links_updated_at_idx"
      ON "social_links" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_social_links_id_idx"
      ON "payload_locked_documents_rels" USING btree ("social_links_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_social_links_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_social_links_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "social_links_id";

    DROP INDEX IF EXISTS "social_links_updated_at_idx";
    DROP INDEX IF EXISTS "social_links_created_at_idx";
    DROP INDEX IF EXISTS "social_links_representative_image_idx";

    ALTER TABLE "social_links"
      DROP CONSTRAINT IF EXISTS "social_links_representative_image_id_media_id_fk";
    DROP TABLE IF EXISTS "social_links" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_social_links_display_status";
    DROP TYPE IF EXISTS "public"."enum_social_links_center";
  `)
}
