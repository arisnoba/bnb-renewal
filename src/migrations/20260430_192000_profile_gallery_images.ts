import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "photo_image1" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "photo_image2" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "photo_image3" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "photo_image4" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "photo_image5" varchar;
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "photo_image6" varchar;

    ALTER TABLE "_profiles_v" ADD COLUMN IF NOT EXISTS "version_photo_image1" varchar;
    ALTER TABLE "_profiles_v" ADD COLUMN IF NOT EXISTS "version_photo_image2" varchar;
    ALTER TABLE "_profiles_v" ADD COLUMN IF NOT EXISTS "version_photo_image3" varchar;
    ALTER TABLE "_profiles_v" ADD COLUMN IF NOT EXISTS "version_photo_image4" varchar;
    ALTER TABLE "_profiles_v" ADD COLUMN IF NOT EXISTS "version_photo_image5" varchar;
    ALTER TABLE "_profiles_v" ADD COLUMN IF NOT EXISTS "version_photo_image6" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_profiles_v" DROP COLUMN IF EXISTS "version_photo_image6";
    ALTER TABLE "_profiles_v" DROP COLUMN IF EXISTS "version_photo_image5";
    ALTER TABLE "_profiles_v" DROP COLUMN IF EXISTS "version_photo_image4";
    ALTER TABLE "_profiles_v" DROP COLUMN IF EXISTS "version_photo_image3";
    ALTER TABLE "_profiles_v" DROP COLUMN IF EXISTS "version_photo_image2";
    ALTER TABLE "_profiles_v" DROP COLUMN IF EXISTS "version_photo_image1";

    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "photo_image6";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "photo_image5";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "photo_image4";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "photo_image3";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "photo_image2";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "photo_image1";
  `)
}
