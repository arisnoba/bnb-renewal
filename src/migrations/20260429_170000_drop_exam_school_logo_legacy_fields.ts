import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_school_logos"
      DROP COLUMN IF EXISTS "logo_path",
      DROP COLUMN IF EXISTS "logo_original_name",
      DROP COLUMN IF EXISTS "logo_file",
      DROP COLUMN IF EXISTS "logo_width",
      DROP COLUMN IF EXISTS "logo_height",
      DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_school_logos"
      ADD COLUMN IF NOT EXISTS "logo_path" varchar,
      ADD COLUMN IF NOT EXISTS "logo_original_name" varchar,
      ADD COLUMN IF NOT EXISTS "logo_file" varchar,
      ADD COLUMN IF NOT EXISTS "logo_width" numeric,
      ADD COLUMN IF NOT EXISTS "logo_height" numeric,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;
  `)
}
