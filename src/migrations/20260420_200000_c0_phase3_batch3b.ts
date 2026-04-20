import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1
       FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public'
         AND t.typname = 'enum_movies_display_status'
     ) THEN
       CREATE TYPE "public"."enum_movies_display_status" AS ENUM('draft', 'published', 'archived');
     END IF;
   END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_appearances_display_status'
    ) THEN
      CREATE TYPE "public"."enum_appearances_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_appearances_extra_display_status'
    ) THEN
      CREATE TYPE "public"."enum_appearances_extra_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'enum_star_cards_display_status'
    ) THEN
      CREATE TYPE "public"."enum_star_cards_display_status" AS ENUM('draft', 'published', 'archived');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "movies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"category" varchar,
  	"cast_label" varchar,
  	"cast_description" varchar,
  	"body_html" varchar NOT NULL,
  	"excerpt" varchar,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_status" "enum_movies_display_status" DEFAULT 'published' NOT NULL,
  	"view_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "appearances" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"category" varchar,
  	"broadcaster" varchar,
  	"production_company" varchar,
  	"director" varchar,
  	"writer" varchar,
  	"project_status" varchar,
  	"lineup_type" varchar,
  	"cast_list_label" varchar,
  	"cast_names" varchar,
  	"cast_roles" varchar,
  	"episode_info" varchar,
  	"body_html" varchar NOT NULL,
  	"excerpt" varchar,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_status" "enum_appearances_display_status" DEFAULT 'published' NOT NULL,
  	"is_public" boolean DEFAULT true,
  	"view_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "appearances_extra" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"category" varchar,
  	"broadcaster" varchar,
  	"production_company" varchar,
  	"director" varchar,
  	"writer" varchar,
  	"project_status" varchar,
  	"lineup_type" varchar,
  	"cast_list_label" varchar,
  	"cast_names" varchar,
  	"cast_roles" varchar,
  	"episode_info" varchar,
  	"body_html" varchar NOT NULL,
  	"excerpt" varchar,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_status" "enum_appearances_extra_display_status" DEFAULT 'published' NOT NULL,
  	"is_public" boolean DEFAULT true,
  	"view_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "star_cards" (
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
  	"display_status" "enum_star_cards_display_status" DEFAULT 'published' NOT NULL,
  	"is_public" boolean DEFAULT true,
  	"view_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "movies_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "appearances_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "appearances_extra_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "star_cards_id" integer;
  CREATE UNIQUE INDEX IF NOT EXISTS "movies_slug_idx" ON "movies" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "movies_updated_at_idx" ON "movies" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "movies_created_at_idx" ON "movies" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "appearances_slug_idx" ON "appearances" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "appearances_updated_at_idx" ON "appearances" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "appearances_created_at_idx" ON "appearances" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "appearances_extra_slug_idx" ON "appearances_extra" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "appearances_extra_updated_at_idx" ON "appearances_extra" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "appearances_extra_created_at_idx" ON "appearances_extra" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "star_cards_slug_idx" ON "star_cards" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "star_cards_updated_at_idx" ON "star_cards" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "star_cards_created_at_idx" ON "star_cards" USING btree ("created_at");

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_movies_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_movies_fk"
        FOREIGN KEY ("movies_id")
        REFERENCES "public"."movies"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_appearances_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_appearances_fk"
        FOREIGN KEY ("appearances_id")
        REFERENCES "public"."appearances"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_appearances_extra_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_appearances_extra_fk"
        FOREIGN KEY ("appearances_extra_id")
        REFERENCES "public"."appearances_extra"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_star_cards_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_star_cards_fk"
        FOREIGN KEY ("star_cards_id")
        REFERENCES "public"."star_cards"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_movies_id_idx" ON "payload_locked_documents_rels" USING btree ("movies_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_appearances_id_idx" ON "payload_locked_documents_rels" USING btree ("appearances_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_appearances_extra_id_idx" ON "payload_locked_documents_rels" USING btree ("appearances_extra_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_star_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("star_cards_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "movies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appearances" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appearances_extra" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "star_cards" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "movies" CASCADE;
  DROP TABLE "appearances" CASCADE;
  DROP TABLE "appearances_extra" CASCADE;
  DROP TABLE "star_cards" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_movies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_appearances_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_appearances_extra_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_star_cards_fk";
  
  DROP INDEX "payload_locked_documents_rels_movies_id_idx";
  DROP INDEX "payload_locked_documents_rels_appearances_id_idx";
  DROP INDEX "payload_locked_documents_rels_appearances_extra_id_idx";
  DROP INDEX "payload_locked_documents_rels_star_cards_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "movies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "appearances_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "appearances_extra_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "star_cards_id";
  DROP TYPE "public"."enum_movies_display_status";
  DROP TYPE "public"."enum_appearances_display_status";
  DROP TYPE "public"."enum_appearances_extra_display_status";
  DROP TYPE "public"."enum_star_cards_display_status";`)
}
