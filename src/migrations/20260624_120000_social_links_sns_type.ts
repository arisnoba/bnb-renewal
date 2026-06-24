import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_social_links_sns_type" AS ENUM('instagram', 'youtube');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "social_links"
      ADD COLUMN IF NOT EXISTS "sns_type" "public"."enum_social_links_sns_type" DEFAULT 'instagram';

    UPDATE "social_links"
    SET "sns_type" = CASE
      WHEN "external_url" ILIKE '%youtube.com%' OR "external_url" ILIKE '%youtu.be%' THEN 'youtube'::"public"."enum_social_links_sns_type"
      ELSE 'instagram'::"public"."enum_social_links_sns_type"
    END
    WHERE "sns_type" IS NULL;

    ALTER TABLE "social_links"
      ALTER COLUMN "sns_type" SET NOT NULL,
      DROP COLUMN IF EXISTS "representative_image_url";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "social_links"
      ADD COLUMN IF NOT EXISTS "representative_image_url" varchar,
      DROP COLUMN IF EXISTS "sns_type";

    DROP TYPE IF EXISTS "public"."enum_social_links_sns_type";
  `)
}
