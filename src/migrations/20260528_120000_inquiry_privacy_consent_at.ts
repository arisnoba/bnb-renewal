import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "privacy_consent_at" timestamp(3) with time zone;

    UPDATE "inquiries"
    SET "privacy_consent_at" = "created_at"
    WHERE "privacy_consent" = true
      AND "privacy_consent_at" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      DROP COLUMN IF EXISTS "privacy_consent_at";
  `)
}
