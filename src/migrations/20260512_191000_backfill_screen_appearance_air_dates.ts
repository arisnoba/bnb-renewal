import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "screen_appearances"
    SET "air_date_label" = "published_at"
    WHERE "air_date_label" IS NULL
      AND "published_at" IS NOT NULL;
  `)
}

export async function down(args: MigrateDownArgs): Promise<void> {
  void args

  return
}
