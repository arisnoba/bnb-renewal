import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_star_cards_centers" AS ENUM('all', 'art', 'exam', 'kids', 'highteen', 'avenue');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_star_cards_display_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "star_cards" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "summary" varchar,
      "map_url" varchar,
      "body" jsonb,
      "logo_path" varchar,
      "display_status" "enum_star_cards_display_status" DEFAULT 'published',
      "display_order" numeric DEFAULT 0,
      "published_at" timestamp(3) with time zone,
      "author_name" varchar,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "source_db" varchar,
      "source_table" varchar,
      "source_id" numeric,
      "body_html" varchar,
      "view_count" numeric DEFAULT 0,
      "legacy_meta" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "star_cards_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_star_cards_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "star_cards_centers"
        ADD CONSTRAINT "star_cards_centers_parent_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."star_cards"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "star_cards_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_star_cards_fk"
        FOREIGN KEY ("star_cards_id")
        REFERENCES "public"."star_cards"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "star_cards_slug_idx"
      ON "star_cards" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "star_cards_display_order_idx"
      ON "star_cards" USING btree ("display_order");
    CREATE INDEX IF NOT EXISTS "star_cards_updated_at_idx"
      ON "star_cards" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "star_cards_created_at_idx"
      ON "star_cards" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "star_cards_centers_order_idx"
      ON "star_cards_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "star_cards_centers_parent_id_idx"
      ON "star_cards_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_star_cards_id_idx"
      ON "payload_locked_documents_rels" USING btree ("star_cards_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_star_cards_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_star_cards_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "star_cards_id";

    DROP TABLE IF EXISTS "star_cards_centers" CASCADE;
    DROP TABLE IF EXISTS "star_cards" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_star_cards_display_status";
    DROP TYPE IF EXISTS "public"."enum_star_cards_centers";
  `)
}
