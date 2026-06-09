import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_legal_documents_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_legal_documents_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "legal_documents_id";

    DROP TABLE IF EXISTS "_legal_documents_v" CASCADE;
    DROP TABLE IF EXISTS "legal_documents" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__legal_documents_v_version_document_type";
    DROP TYPE IF EXISTS "public"."enum_legal_documents_document_type";

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_terms_document_type" AS ENUM('privacy', 'terms');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum__terms_v_version_document_type" AS ENUM('privacy', 'terms');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "terms" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "document_type" "public"."enum_terms_document_type" NOT NULL,
      "effective_date" timestamp(3) with time zone,
      "body" jsonb NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_terms_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar NOT NULL,
      "version_document_type" "public"."enum__terms_v_version_document_type" NOT NULL,
      "version_effective_date" timestamp(3) with time zone,
      "version_body" jsonb NOT NULL,
      "version_created_at" timestamp(3) with time zone,
      "version_updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "_terms_v"
        ADD CONSTRAINT "_terms_v_parent_id_terms_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."terms"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "terms_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_terms_fk"
        FOREIGN KEY ("terms_id")
        REFERENCES "public"."terms"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "terms_document_type_idx"
      ON "terms" USING btree ("document_type");
    CREATE INDEX IF NOT EXISTS "terms_updated_at_idx"
      ON "terms" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "terms_created_at_idx"
      ON "terms" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_terms_v_parent_idx"
      ON "_terms_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_terms_v_created_at_idx"
      ON "_terms_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_terms_v_updated_at_idx"
      ON "_terms_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_terms_v_version_version_document_type_idx"
      ON "_terms_v" USING btree ("version_document_type");
    CREATE INDEX IF NOT EXISTS "_terms_v_version_version_created_at_idx"
      ON "_terms_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_terms_v_version_version_updated_at_idx"
      ON "_terms_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_terms_id_idx"
      ON "payload_locked_documents_rels" USING btree ("terms_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_terms_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_terms_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "terms_id";

    DROP TABLE IF EXISTS "_terms_v" CASCADE;
    DROP TABLE IF EXISTS "terms" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__terms_v_version_document_type";
    DROP TYPE IF EXISTS "public"."enum_terms_document_type";
  `)
}
