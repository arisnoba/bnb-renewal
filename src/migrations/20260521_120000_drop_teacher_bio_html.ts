import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      DROP COLUMN IF EXISTS "bio_html";

    ALTER TABLE "_teachers_v"
      DROP COLUMN IF EXISTS "version_bio_html";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      ADD COLUMN IF NOT EXISTS "bio_html" varchar;

    ALTER TABLE "_teachers_v"
      ADD COLUMN IF NOT EXISTS "version_bio_html" varchar;
  `)
}
