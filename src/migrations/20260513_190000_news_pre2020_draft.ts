import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "news"
    SET "display_status" = 'draft'
    WHERE "published_at" < '2020-01-01'
      AND "display_status" = 'published';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "news"
    SET "display_status" = 'published'
    WHERE "published_at" < '2020-01-01'
      AND "display_status" = 'draft';
  `)
}
