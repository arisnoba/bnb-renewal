import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "news_published_at_idx"
      ON "news" USING btree ("published_at");

    CREATE INDEX IF NOT EXISTS "news_slug_prefix_idx"
      ON "news" USING btree ("slug" varchar_pattern_ops);

    CREATE INDEX IF NOT EXISTS "news_centers_value_parent_idx"
      ON "news_centers" USING btree ("value", "parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "news_centers_value_parent_idx";
    DROP INDEX IF EXISTS "news_slug_prefix_idx";
    DROP INDEX IF EXISTS "news_published_at_idx";
  `)
}
