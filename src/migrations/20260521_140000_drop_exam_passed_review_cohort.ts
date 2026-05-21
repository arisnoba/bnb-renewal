import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_passed_reviews"
      DROP COLUMN IF EXISTS "cohort";

    ALTER TABLE "_exam_passed_reviews_v"
      DROP COLUMN IF EXISTS "version_cohort";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exam_passed_reviews"
      ADD COLUMN IF NOT EXISTS "cohort" varchar;

    ALTER TABLE "_exam_passed_reviews_v"
      ADD COLUMN IF NOT EXISTS "version_cohort" varchar;
  `)
}
