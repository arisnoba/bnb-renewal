import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "highteen_special_classes"
      ADD COLUMN IF NOT EXISTS "thumbnail_media_id" integer;

    ALTER TABLE "highteen_special_classes_gallery_images"
      ADD COLUMN IF NOT EXISTS "image_media_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "highteen_special_classes"
        ADD CONSTRAINT "highteen_special_classes_thumbnail_media_id_media_id_fk"
        FOREIGN KEY ("thumbnail_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "highteen_special_classes_gallery_images"
        ADD CONSTRAINT "highteen_special_classes_gallery_images_image_media_id_media_id_fk"
        FOREIGN KEY ("image_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "highteen_special_classes_thumbnail_media_idx"
      ON "highteen_special_classes" USING btree ("thumbnail_media_id");
    CREATE INDEX IF NOT EXISTS "highteen_special_classes_gallery_images_image_media_idx"
      ON "highteen_special_classes_gallery_images" USING btree ("image_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "highteen_special_classes_gallery_images_image_media_idx";
    DROP INDEX IF EXISTS "highteen_special_classes_thumbnail_media_idx";

    ALTER TABLE "highteen_special_classes_gallery_images"
      DROP CONSTRAINT IF EXISTS "highteen_special_classes_gallery_images_image_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "image_media_id";

    ALTER TABLE "highteen_special_classes"
      DROP CONSTRAINT IF EXISTS "highteen_special_classes_thumbnail_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "thumbnail_media_id";
  `)
}
