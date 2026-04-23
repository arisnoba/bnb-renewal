import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_shoots_display_status'
    ) THEN
      CREATE TYPE "public"."enum_shoots_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_dramas_display_status'
    ) THEN
      CREATE TYPE "public"."enum_dramas_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_directings_display_status'
    ) THEN
      CREATE TYPE "public"."enum_directings_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_reviews_display_status'
    ) THEN
      CREATE TYPE "public"."enum_reviews_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "shoots" (
    "id" serial PRIMARY KEY NOT NULL,
    "source_table" varchar NOT NULL,
    "source_id" numeric NOT NULL,
    "slug" varchar NOT NULL,
    "title" varchar NOT NULL,
    "category" varchar,
    "actor_name" varchar,
    "actor_generation" varchar,
    "body_html" varchar NOT NULL,
    "excerpt" varchar,
    "author_name" varchar,
    "published_at" timestamp(3) with time zone,
    "display_status" "enum_shoots_display_status" DEFAULT 'published' NOT NULL,
    "is_public" boolean DEFAULT true,
    "view_count" numeric DEFAULT 0,
    "legacy_meta" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "dramas" (
    "id" serial PRIMARY KEY NOT NULL,
    "source_table" varchar NOT NULL,
    "source_id" numeric NOT NULL,
    "slug" varchar NOT NULL,
    "title" varchar NOT NULL,
    "category" varchar,
    "actor_label" varchar,
    "class_name" varchar,
    "project_title" varchar,
    "role_name" varchar,
    "air_date_label" varchar,
    "body_html" varchar NOT NULL,
    "excerpt" varchar,
    "author_name" varchar,
    "published_at" timestamp(3) with time zone,
    "display_status" "enum_dramas_display_status" DEFAULT 'published' NOT NULL,
    "is_public" boolean DEFAULT true,
    "view_count" numeric DEFAULT 0,
    "legacy_meta" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "directings" (
    "id" serial PRIMARY KEY NOT NULL,
    "source_table" varchar NOT NULL,
    "source_id" numeric NOT NULL,
    "slug" varchar NOT NULL,
    "title" varchar NOT NULL,
    "category" varchar,
    "production_meta" varchar,
    "body_html" varchar NOT NULL,
    "excerpt" varchar,
    "author_name" varchar,
    "published_at" timestamp(3) with time zone,
    "display_status" "enum_directings_display_status" DEFAULT 'published' NOT NULL,
    "is_public" boolean DEFAULT true,
    "view_count" numeric DEFAULT 0,
    "legacy_meta" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "source_table" varchar NOT NULL,
    "source_id" numeric NOT NULL,
    "slug" varchar NOT NULL,
    "title" varchar NOT NULL,
    "category" varchar,
    "body_html" varchar NOT NULL,
    "excerpt" varchar,
    "author_name" varchar,
    "published_at" timestamp(3) with time zone,
    "display_status" "enum_reviews_display_status" DEFAULT 'published' NOT NULL,
    "is_public" boolean DEFAULT true,
    "view_count" numeric DEFAULT 0,
    "legacy_meta" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "shoots_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "dramas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "directings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "reviews_id" integer;

  CREATE UNIQUE INDEX IF NOT EXISTS "shoots_slug_idx" ON "shoots" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "shoots_updated_at_idx" ON "shoots" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "shoots_created_at_idx" ON "shoots" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "dramas_slug_idx" ON "dramas" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "dramas_updated_at_idx" ON "dramas" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "dramas_created_at_idx" ON "dramas" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "directings_slug_idx" ON "directings" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "directings_updated_at_idx" ON "directings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "directings_created_at_idx" ON "directings" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "reviews_slug_idx" ON "reviews" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reviews_created_at_idx" ON "reviews" USING btree ("created_at");

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_shoots_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_shoots_fk"
        FOREIGN KEY ("shoots_id")
        REFERENCES "public"."shoots"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_dramas_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_dramas_fk"
        FOREIGN KEY ("dramas_id")
        REFERENCES "public"."dramas"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_directings_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_directings_fk"
        FOREIGN KEY ("directings_id")
        REFERENCES "public"."directings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_reviews_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk"
        FOREIGN KEY ("reviews_id")
        REFERENCES "public"."reviews"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shoots_id_idx" ON "payload_locked_documents_rels" USING btree ("shoots_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_dramas_id_idx" ON "payload_locked_documents_rels" USING btree ("dramas_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_directings_id_idx" ON "payload_locked_documents_rels" USING btree ("directings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_shoots_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_dramas_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_directings_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_reviews_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_shoots_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_dramas_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_directings_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reviews_id_idx";

  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "shoots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "dramas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "directings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reviews_id";

  DROP TABLE IF EXISTS "shoots" CASCADE;
  DROP TABLE IF EXISTS "dramas" CASCADE;
  DROP TABLE IF EXISTS "directings" CASCADE;
  DROP TABLE IF EXISTS "reviews" CASCADE;

  DROP TYPE IF EXISTS "public"."enum_shoots_display_status";
  DROP TYPE IF EXISTS "public"."enum_dramas_display_status";
  DROP TYPE IF EXISTS "public"."enum_directings_display_status";
  DROP TYPE IF EXISTS "public"."enum_reviews_display_status";
  `)
}
