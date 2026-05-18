import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      DROP COLUMN IF EXISTS "summary";

    ALTER TABLE "star_cards_body_images"
      DROP COLUMN IF EXISTS "display_order";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      ADD COLUMN IF NOT EXISTS "summary" varchar;

    ALTER TABLE "star_cards_body_images"
      ADD COLUMN IF NOT EXISTS "display_order" numeric DEFAULT 0;
  `)
}
