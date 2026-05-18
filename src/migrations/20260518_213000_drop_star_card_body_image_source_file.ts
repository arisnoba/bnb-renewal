import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards_body_images"
      DROP COLUMN IF EXISTS "source_file";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards_body_images"
      ADD COLUMN IF NOT EXISTS "source_file" varchar;
  `)
}
