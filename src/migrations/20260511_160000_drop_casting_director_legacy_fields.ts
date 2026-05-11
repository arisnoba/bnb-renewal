import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "casting_directors_slug_idx";

    ALTER TABLE "casting_directors"
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "legacy_meta",
      DROP COLUMN IF EXISTS "profile_image_path";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "casting_directors"
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "slug" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb,
      ADD COLUMN IF NOT EXISTS "profile_image_path" varchar;

    CREATE UNIQUE INDEX IF NOT EXISTS "casting_directors_slug_idx"
      ON "casting_directors" USING btree ("slug");
  `)
}
