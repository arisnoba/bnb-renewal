import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean;

    UPDATE "teachers"
    SET "generate_slug" = false
    WHERE "generate_slug" IS DISTINCT FROM false;

    ALTER TABLE "teachers"
      ALTER COLUMN "generate_slug" SET DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      DROP COLUMN IF EXISTS "generate_slug";
  `)
}
