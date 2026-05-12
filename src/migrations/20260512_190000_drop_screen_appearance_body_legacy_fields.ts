import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "screen_appearances_slug_idx";

    ALTER TABLE "screen_appearances"
      DROP COLUMN IF EXISTS "body",
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ADD COLUMN IF NOT EXISTS "body" jsonb,
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "slug" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "screen_appearances"
    SET
      "source_db" = coalesce("source_db", 'legacy'),
      "source_table" = coalesce("source_table", 'screen_appearances'),
      "source_id" = coalesce("source_id", "id"),
      "slug" = coalesce("slug", concat('screen-appearance-', "id"))
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL
      OR "slug" IS NULL;

    ALTER TABLE "screen_appearances" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "screen_appearances" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "screen_appearances" ALTER COLUMN "source_id" SET NOT NULL;
    ALTER TABLE "screen_appearances" ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "screen_appearances_slug_idx"
      ON "screen_appearances" USING btree ("slug");
  `)
}
