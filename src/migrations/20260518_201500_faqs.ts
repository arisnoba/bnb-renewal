import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_faqs_centers" AS ENUM('all', 'art', 'exam', 'kids', 'highteen', 'avenue');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_faqs_category" AS ENUM('admission', 'class', 'tuition', 'casting', 'exam', 'starcard', 'etc');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_faqs_answer_mode" AS ENUM('shared', 'centerVariants');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_faqs_display_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "faqs" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "category" "enum_faqs_category" DEFAULT 'etc' NOT NULL,
      "answer_mode" "enum_faqs_answer_mode" DEFAULT 'centerVariants' NOT NULL,
      "shared_answer" varchar,
      "display_status" "enum_faqs_display_status" DEFAULT 'draft',
      "display_order" numeric DEFAULT 0,
      "published_at" timestamp(3) with time zone,
      "author_name" varchar,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "faqs_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_faqs_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "faqs_variants" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "center_art" boolean DEFAULT false,
      "center_exam" boolean DEFAULT false,
      "center_kids" boolean DEFAULT false,
      "center_highteen" boolean DEFAULT false,
      "center_avenue" boolean DEFAULT false,
      "question_override" varchar,
      "answer" varchar NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "faqs_centers"
        ADD CONSTRAINT "faqs_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."faqs"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "faqs_variants"
        ADD CONSTRAINT "faqs_variants_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."faqs"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "faqs_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk"
        FOREIGN KEY ("faqs_id")
        REFERENCES "public"."faqs"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "faqs_slug_idx"
      ON "faqs" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "faqs_category_idx"
      ON "faqs" USING btree ("category");
    CREATE INDEX IF NOT EXISTS "faqs_display_order_idx"
      ON "faqs" USING btree ("display_order");
    CREATE INDEX IF NOT EXISTS "faqs_updated_at_idx"
      ON "faqs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "faqs_created_at_idx"
      ON "faqs" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "faqs_centers_order_idx"
      ON "faqs_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "faqs_centers_parent_idx"
      ON "faqs_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "faqs_variants_order_idx"
      ON "faqs_variants" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "faqs_variants_parent_id_idx"
      ON "faqs_variants" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_faqs_id_idx"
      ON "payload_locked_documents_rels" USING btree ("faqs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_faqs_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_faqs_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "faqs_id";

    DROP TABLE IF EXISTS "faqs_variants" CASCADE;
    DROP TABLE IF EXISTS "faqs_centers" CASCADE;
    DROP TABLE IF EXISTS "faqs" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_faqs_display_status";
    DROP TYPE IF EXISTS "public"."enum_faqs_answer_mode";
    DROP TYPE IF EXISTS "public"."enum_faqs_category";
    DROP TYPE IF EXISTS "public"."enum_faqs_centers";
  `)
}
