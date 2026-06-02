import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_main_statistics_center" AS ENUM(
        'art',
        'exam',
        'kids',
        'highteen',
        'avenue'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "main_statistics"
      ADD COLUMN IF NOT EXISTS "center" "public"."enum_main_statistics_center";

    CREATE UNIQUE INDEX IF NOT EXISTS "main_statistics_center_unique_idx"
      ON "main_statistics" USING btree ("center")
      WHERE "center" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "main_statistics_center_unique_idx";
    ALTER TABLE "main_statistics"
      DROP COLUMN IF EXISTS "center";
    DROP TYPE IF EXISTS "public"."enum_main_statistics_center";
  `)
}
