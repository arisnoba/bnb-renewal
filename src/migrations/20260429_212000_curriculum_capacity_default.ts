import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums" ALTER COLUMN "capacity" SET DEFAULT 8;

    UPDATE "curriculums"
    SET "capacity" = 8
    WHERE "capacity" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums" ALTER COLUMN "capacity" DROP DEFAULT;
  `)
}
