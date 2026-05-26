import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      ADD COLUMN IF NOT EXISTS "discount_rate" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      DROP COLUMN IF EXISTS "discount_rate";
  `)
}
