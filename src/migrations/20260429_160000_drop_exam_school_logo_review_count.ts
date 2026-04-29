import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_school_logos"
      DROP COLUMN IF EXISTS "review_count";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_school_logos"
      ADD COLUMN IF NOT EXISTS "review_count" numeric DEFAULT 0;
  `)
}
