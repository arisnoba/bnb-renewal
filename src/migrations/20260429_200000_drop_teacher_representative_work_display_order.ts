import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers_representative_works"
      DROP COLUMN IF EXISTS "display_order";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers_representative_works"
      ADD COLUMN IF NOT EXISTS "display_order" numeric DEFAULT 0;
  `)
}
