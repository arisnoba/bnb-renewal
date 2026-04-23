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
         AND t.typname = 'enum_lineups_display_status'
     ) THEN
       CREATE TYPE "public"."enum_lineups_display_status" AS ENUM('draft', 'published', 'archived');
     END IF;
   END $$;

  CREATE TABLE IF NOT EXISTS "video_castings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"broadcaster" varchar,
  	"youtube_url" varchar,
  	"message_html" varchar,
  	"display_order" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"alt_text" varchar,
  	"url" varchar,
  	"device" varchar,
  	"position" varchar,
  	"has_border" boolean DEFAULT false,
  	"open_in_new_window" boolean DEFAULT false,
  	"begin_at" timestamp(3) with time zone,
  	"end_at" timestamp(3) with time zone,
  	"recorded_at" timestamp(3) with time zone,
  	"hit_count" numeric DEFAULT 0,
  	"display_order" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "teacher_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"teacher_source_id" numeric,
  	"file_path" varchar,
  	"description_html" varchar,
  	"display_order" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "lineups" (
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
  	"display_status" "enum_lineups_display_status" DEFAULT 'published' NOT NULL,
  	"view_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "video_castings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "banners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "teacher_files_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "lineups_id" integer;
  CREATE UNIQUE INDEX IF NOT EXISTS "video_castings_slug_idx" ON "video_castings" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "video_castings_updated_at_idx" ON "video_castings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "video_castings_created_at_idx" ON "video_castings" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "banners_slug_idx" ON "banners" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "teacher_files_slug_idx" ON "teacher_files" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "teacher_files_updated_at_idx" ON "teacher_files" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "teacher_files_created_at_idx" ON "teacher_files" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "lineups_slug_idx" ON "lineups" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "lineups_updated_at_idx" ON "lineups" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "lineups_created_at_idx" ON "lineups" USING btree ("created_at");

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_video_castings_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_video_castings_fk"
        FOREIGN KEY ("video_castings_id")
        REFERENCES "public"."video_castings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_banners_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_banners_fk"
        FOREIGN KEY ("banners_id")
        REFERENCES "public"."banners"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_teacher_files_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_teacher_files_fk"
        FOREIGN KEY ("teacher_files_id")
        REFERENCES "public"."teacher_files"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payload_locked_documents_rels_lineups_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_lineups_fk"
        FOREIGN KEY ("lineups_id")
        REFERENCES "public"."lineups"("id")
        ON DELETE cascade
        ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_video_castings_id_idx" ON "payload_locked_documents_rels" USING btree ("video_castings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_teacher_files_id_idx" ON "payload_locked_documents_rels" USING btree ("teacher_files_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_lineups_id_idx" ON "payload_locked_documents_rels" USING btree ("lineups_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "video_castings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "banners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "teacher_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lineups" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "video_castings" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "teacher_files" CASCADE;
  DROP TABLE "lineups" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_video_castings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_banners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_teacher_files_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lineups_fk";
  
  DROP INDEX "payload_locked_documents_rels_video_castings_id_idx";
  DROP INDEX "payload_locked_documents_rels_banners_id_idx";
  DROP INDEX "payload_locked_documents_rels_teacher_files_id_idx";
  DROP INDEX "payload_locked_documents_rels_lineups_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "video_castings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "banners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "teacher_files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lineups_id";
  DROP TYPE "public"."enum_lineups_display_status";`)
}
