import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_artist_press_agencies_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "artist_press_agencies" (
      "id" serial PRIMARY KEY NOT NULL,
      "agency_name" varchar NOT NULL,
      "normalized_key" varchar NOT NULL,
      "logo_media_id" integer,
      "author_name" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "artist_press_agencies_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_artist_press_agencies_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "artist_press_agencies_legacy_aliases" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "original_name" varchar NOT NULL,
      "use_count" numeric,
      "sample_title" varchar
    );

    ALTER TABLE "artist_press"
      ADD COLUMN IF NOT EXISTS "agency_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "artist_press_agencies"
        ADD CONSTRAINT "artist_press_agencies_logo_media_id_media_id_fk"
        FOREIGN KEY ("logo_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "artist_press_agencies_centers"
        ADD CONSTRAINT "artist_press_agencies_centers_parent_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."artist_press_agencies"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "artist_press_agencies_legacy_aliases"
        ADD CONSTRAINT "artist_press_agencies_legacy_aliases_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."artist_press_agencies"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "artist_press"
        ADD CONSTRAINT "artist_press_agency_id_artist_press_agencies_id_fk"
        FOREIGN KEY ("agency_id")
        REFERENCES "public"."artist_press_agencies"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "artist_press_agencies_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_artist_press_agencies_fk"
        FOREIGN KEY ("artist_press_agencies_id")
        REFERENCES "public"."artist_press_agencies"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "artist_press_agencies_normalized_key_idx"
      ON "artist_press_agencies" USING btree ("normalized_key");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_logo_media_idx"
      ON "artist_press_agencies" USING btree ("logo_media_id");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_updated_at_idx"
      ON "artist_press_agencies" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_created_at_idx"
      ON "artist_press_agencies" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_centers_order_idx"
      ON "artist_press_agencies_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_centers_parent_id_idx"
      ON "artist_press_agencies_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_legacy_aliases_order_idx"
      ON "artist_press_agencies_legacy_aliases" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_legacy_aliases_parent_id_idx"
      ON "artist_press_agencies_legacy_aliases" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "artist_press_agency_idx"
      ON "artist_press" USING btree ("agency_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_artist_press_agencies_id_idx"
      ON "payload_locked_documents_rels" USING btree ("artist_press_agencies_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_artist_press_agencies_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_artist_press_agencies_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "artist_press_agencies_id";

    DROP INDEX IF EXISTS "artist_press_agency_idx";
    ALTER TABLE "artist_press"
      DROP CONSTRAINT IF EXISTS "artist_press_agency_id_artist_press_agencies_id_fk",
      DROP COLUMN IF EXISTS "agency_id";

    DROP TABLE IF EXISTS "artist_press_agencies_legacy_aliases" CASCADE;
    DROP TABLE IF EXISTS "artist_press_agencies_centers" CASCADE;
    DROP TABLE IF EXISTS "artist_press_agencies" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_artist_press_agencies_centers";
  `)
}
