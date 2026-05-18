import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "histories_display_order_idx";
    ALTER TABLE "histories"
      DROP COLUMN IF EXISTS "display_order";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "histories"
      ADD COLUMN IF NOT EXISTS "display_order" numeric DEFAULT 0;

    UPDATE "histories"
    SET "display_order" = "year"
    WHERE "display_order" IS NULL;

    CREATE INDEX IF NOT EXISTS "histories_display_order_idx"
      ON "histories" USING btree ("display_order");
  `)
}
