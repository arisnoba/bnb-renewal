import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media"
      ADD COLUMN IF NOT EXISTS "external_url" varchar;

    UPDATE "media"
    SET "external_url" = "url"
    WHERE "filename" LIKE 'screen-appearance-body-%'
      AND "external_url" IS NULL
      AND "url" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media"
      DROP COLUMN IF EXISTS "external_url";
  `)
}
