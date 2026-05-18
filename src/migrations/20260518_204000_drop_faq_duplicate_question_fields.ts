import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "faqs"
      DROP COLUMN IF EXISTS "canonical_question",
      DROP COLUMN IF EXISTS "review_memo";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "faqs"
      ADD COLUMN IF NOT EXISTS "canonical_question" varchar,
      ADD COLUMN IF NOT EXISTS "review_memo" varchar;
  `)
}
