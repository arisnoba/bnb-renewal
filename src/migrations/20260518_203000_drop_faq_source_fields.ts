import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "faqs"
      DROP COLUMN IF EXISTS "source_type",
      DROP COLUMN IF EXISTS "source_key",
      DROP COLUMN IF EXISTS "source_urls";

    ALTER TABLE "faqs_variants"
      DROP COLUMN IF EXISTS "source_center",
      DROP COLUMN IF EXISTS "source_order",
      DROP COLUMN IF EXISTS "source_question",
      DROP COLUMN IF EXISTS "source_url";

    DROP TYPE IF EXISTS "public"."enum_faqs_variants_source_center";
    DROP TYPE IF EXISTS "public"."enum_faqs_source_type";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_faqs_source_type" AS ENUM('legacyFaq', 'craftedFromPage');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_faqs_variants_source_center" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "faqs"
      ADD COLUMN IF NOT EXISTS "source_type" "enum_faqs_source_type" DEFAULT 'legacyFaq',
      ADD COLUMN IF NOT EXISTS "source_key" varchar,
      ADD COLUMN IF NOT EXISTS "source_urls" varchar;

    ALTER TABLE "faqs_variants"
      ADD COLUMN IF NOT EXISTS "source_center" "enum_faqs_variants_source_center",
      ADD COLUMN IF NOT EXISTS "source_order" numeric,
      ADD COLUMN IF NOT EXISTS "source_question" varchar,
      ADD COLUMN IF NOT EXISTS "source_url" varchar;
  `)
}
