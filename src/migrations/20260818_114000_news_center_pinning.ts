import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news"
      ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false;

    ALTER TABLE "_news_v"
      ADD COLUMN IF NOT EXISTS "version_is_pinned" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_news_v"
      DROP COLUMN IF EXISTS "version_is_pinned";

    ALTER TABLE "news"
      DROP COLUMN IF EXISTS "is_pinned";
  `)
}
