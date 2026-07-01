import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news"
      DROP COLUMN IF EXISTS "generate_slug";

    ALTER TABLE "_news_v"
      DROP COLUMN IF EXISTS "version_generate_slug";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true;

    ALTER TABLE "_news_v"
      ADD COLUMN IF NOT EXISTS "version_generate_slug" boolean DEFAULT true;
  `)
}
