import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "main"
      ADD COLUMN IF NOT EXISTS "art_banner_autoplay" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "art_banner_autoplay_delay" numeric DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS "exam_banner_autoplay" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "exam_banner_autoplay_delay" numeric DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS "kids_banner_autoplay" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "kids_banner_autoplay_delay" numeric DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS "highteen_banner_autoplay" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "highteen_banner_autoplay_delay" numeric DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS "avenue_banner_autoplay" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "avenue_banner_autoplay_delay" numeric DEFAULT 5000;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "main"
      DROP COLUMN IF EXISTS "avenue_banner_autoplay_delay",
      DROP COLUMN IF EXISTS "avenue_banner_autoplay",
      DROP COLUMN IF EXISTS "highteen_banner_autoplay_delay",
      DROP COLUMN IF EXISTS "highteen_banner_autoplay",
      DROP COLUMN IF EXISTS "kids_banner_autoplay_delay",
      DROP COLUMN IF EXISTS "kids_banner_autoplay",
      DROP COLUMN IF EXISTS "exam_banner_autoplay_delay",
      DROP COLUMN IF EXISTS "exam_banner_autoplay",
      DROP COLUMN IF EXISTS "art_banner_autoplay_delay",
      DROP COLUMN IF EXISTS "art_banner_autoplay";
  `)
}
