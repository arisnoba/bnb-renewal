import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "source_db";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "source_table";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "legacy_meta";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "source_db" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "source_table" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "source_id" numeric;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    UPDATE "profiles"
    SET
      "source_db" = coalesce("source_db", 'mock'),
      "source_table" = coalesce("source_table", 'profiles'),
      "source_id" = coalesce("source_id", "id")
    WHERE "source_db" IS NULL
      OR "source_table" IS NULL
      OR "source_id" IS NULL;

    ALTER TABLE "profiles" ALTER COLUMN "source_db" SET NOT NULL;
    ALTER TABLE "profiles" ALTER COLUMN "source_table" SET NOT NULL;
    ALTER TABLE "profiles" ALTER COLUMN "source_id" SET NOT NULL;
  `)
}
