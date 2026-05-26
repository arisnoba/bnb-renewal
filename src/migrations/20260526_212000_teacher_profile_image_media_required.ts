import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "_teachers_v"
    SET "version_profile_image_media_id" = "teachers"."profile_image_media_id"
    FROM "teachers"
    WHERE "_teachers_v"."parent_id" = "teachers"."id"
      AND "_teachers_v"."version_profile_image_media_id" IS NULL;

    ALTER TABLE "teachers"
      ALTER COLUMN "profile_image_media_id" SET NOT NULL,
      DROP COLUMN IF EXISTS "profile_image_path";

    ALTER TABLE "_teachers_v"
      ALTER COLUMN "version_profile_image_media_id" SET NOT NULL,
      DROP COLUMN IF EXISTS "version_profile_image_path";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_teachers_v"
      ADD COLUMN IF NOT EXISTS "version_profile_image_path" varchar,
      ALTER COLUMN "version_profile_image_media_id" DROP NOT NULL;

    ALTER TABLE "teachers"
      ADD COLUMN IF NOT EXISTS "profile_image_path" varchar,
      ALTER COLUMN "profile_image_media_id" DROP NOT NULL;
  `)
}
