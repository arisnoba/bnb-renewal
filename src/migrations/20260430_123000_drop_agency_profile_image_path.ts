import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agencies" DROP COLUMN IF EXISTS "profile_image_path";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "profile_image_path" varchar;
  `)
}
