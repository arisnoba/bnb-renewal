import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_company" AS ENUM('ucasting', 'imground', 'bnb-casting', 'bx-model-agency');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_source_center" AS ENUM('art', 'kids', 'highteen');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_display_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "direct_castings" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "company" "enum_direct_castings_company" NOT NULL,
      "source_center" "enum_direct_castings_source_center" NOT NULL,
      "year_label" varchar,
      "project_info" varchar,
      "thumbnail_path" varchar,
      "body" jsonb,
      "display_status" "enum_direct_castings_display_status" DEFAULT 'published',
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

    CREATE TABLE IF NOT EXISTS "direct_castings_work_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "year" varchar NOT NULL,
      "content" varchar NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "direct_castings_work_items"
        ADD CONSTRAINT "direct_castings_work_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."direct_castings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "direct_castings_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_direct_castings_fk"
        FOREIGN KEY ("direct_castings_id")
        REFERENCES "public"."direct_castings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "direct_castings_slug_idx"
      ON "direct_castings" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "direct_castings_company_idx"
      ON "direct_castings" USING btree ("company");
    CREATE INDEX IF NOT EXISTS "direct_castings_source_center_idx"
      ON "direct_castings" USING btree ("source_center");
    CREATE INDEX IF NOT EXISTS "direct_castings_updated_at_idx"
      ON "direct_castings" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "direct_castings_created_at_idx"
      ON "direct_castings" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "direct_castings_work_items_order_idx"
      ON "direct_castings_work_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "direct_castings_work_items_parent_id_idx"
      ON "direct_castings_work_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_direct_castings_id_idx"
      ON "payload_locked_documents_rels" USING btree ("direct_castings_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_direct_castings_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_direct_castings_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "direct_castings_id";

    DROP TABLE IF EXISTS "direct_castings_work_items" CASCADE;
    DROP TABLE IF EXISTS "direct_castings" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_direct_castings_display_status";
    DROP TYPE IF EXISTS "public"."enum_direct_castings_source_center";
    DROP TYPE IF EXISTS "public"."enum_direct_castings_company";
  `)
}
