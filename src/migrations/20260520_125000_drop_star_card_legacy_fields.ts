import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      DROP COLUMN IF EXISTS "logo_path",
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "body_html",
      DROP COLUMN IF EXISTS "view_count",
      DROP COLUMN IF EXISTS "legacy_meta";

    ALTER TABLE "star_cards_body_images"
      DROP COLUMN IF EXISTS "image_path";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      ADD COLUMN IF NOT EXISTS "logo_path" varchar,
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "body_html" varchar,
      ADD COLUMN IF NOT EXISTS "view_count" numeric,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    ALTER TABLE "star_cards_body_images"
      ADD COLUMN IF NOT EXISTS "image_path" varchar;
  `)
}
