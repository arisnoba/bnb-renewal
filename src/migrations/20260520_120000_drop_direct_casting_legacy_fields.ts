import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "direct_castings_source_center_idx";

    ALTER TABLE "direct_castings"
      DROP COLUMN IF EXISTS "source_center",
      DROP COLUMN IF EXISTS "thumbnail_path",
      DROP COLUMN IF EXISTS "body_html",
      DROP COLUMN IF EXISTS "source_db",
      DROP COLUMN IF EXISTS "source_table",
      DROP COLUMN IF EXISTS "source_id",
      DROP COLUMN IF EXISTS "legacy_meta";

    DROP TYPE IF EXISTS "public"."enum_direct_castings_source_center";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_direct_castings_source_center" AS ENUM('art', 'kids', 'highteen');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "direct_castings"
      ADD COLUMN IF NOT EXISTS "source_center" "public"."enum_direct_castings_source_center",
      ADD COLUMN IF NOT EXISTS "thumbnail_path" varchar,
      ADD COLUMN IF NOT EXISTS "body_html" varchar,
      ADD COLUMN IF NOT EXISTS "source_db" varchar,
      ADD COLUMN IF NOT EXISTS "source_table" varchar,
      ADD COLUMN IF NOT EXISTS "source_id" numeric,
      ADD COLUMN IF NOT EXISTS "legacy_meta" jsonb;

    CREATE INDEX IF NOT EXISTS "direct_castings_source_center_idx"
      ON "direct_castings" USING btree ("source_center");
  `)
}
