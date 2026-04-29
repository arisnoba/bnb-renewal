import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "casting_directors"
      ALTER COLUMN "display_status" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "casting_directors"
    SET "display_status" = 'published'
    WHERE "display_status" IS NULL;

    ALTER TABLE "casting_directors"
      ALTER COLUMN "display_status" SET NOT NULL;
  `)
}
