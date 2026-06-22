import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "footer_center_infos"
      ADD COLUMN IF NOT EXISTS "youtube_url" varchar,
      ADD COLUMN IF NOT EXISTS "naver_blog_url" varchar,
      ADD COLUMN IF NOT EXISTS "instagram_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "footer_center_infos"
      DROP COLUMN IF EXISTS "youtube_url",
      DROP COLUMN IF EXISTS "naver_blog_url",
      DROP COLUMN IF EXISTS "instagram_url";
  `)
}
