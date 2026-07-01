import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "media"
    SET "prefix" = 'media/uploads'
    WHERE "prefix" IS NULL OR btrim("prefix") = '';

    DROP INDEX IF EXISTS "media_filename_idx";

    CREATE INDEX IF NOT EXISTS "media_filename_idx"
      ON "media" USING btree ("filename");

    CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_compound_idx"
      ON "media" USING btree ("prefix", "filename");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "media_filename_compound_idx";

    DROP INDEX IF EXISTS "media_filename_idx";

    CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx"
      ON "media" USING btree ("filename");
  `)
}
