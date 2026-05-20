import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "highteen_special_classes"
      DROP COLUMN IF EXISTS "thumbnail_path",
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "legacy_meta";

    ALTER TABLE "highteen_special_classes_gallery_images"
      DROP COLUMN IF EXISTS "image_path";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "highteen_special_classes"
      ADD COLUMN IF NOT EXISTS "thumbnail_path" varchar,
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    ALTER TABLE "highteen_special_classes_gallery_images"
      ADD COLUMN IF NOT EXISTS "image_path" varchar;
  `)
}
