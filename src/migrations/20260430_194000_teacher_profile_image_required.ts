import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      ALTER COLUMN "profile_image_path" SET NOT NULL;

    ALTER TABLE "_teachers_v"
      ALTER COLUMN "version_profile_image_path" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_teachers_v"
      ALTER COLUMN "version_profile_image_path" DROP NOT NULL;

    ALTER TABLE "teachers"
      ALTER COLUMN "profile_image_path" DROP NOT NULL;
  `)
}
