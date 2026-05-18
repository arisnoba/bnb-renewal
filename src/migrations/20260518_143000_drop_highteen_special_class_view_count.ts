import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "highteen_special_classes"
      DROP COLUMN IF EXISTS "view_count";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "highteen_special_classes"
      ADD COLUMN IF NOT EXISTS "view_count" numeric DEFAULT 0;
  `)
}
