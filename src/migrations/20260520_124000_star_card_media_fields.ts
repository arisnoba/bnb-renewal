import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      ADD COLUMN IF NOT EXISTS "logo_media_id" integer;

    ALTER TABLE "star_cards_body_images"
      ADD COLUMN IF NOT EXISTS "image_media_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "star_cards"
        ADD CONSTRAINT "star_cards_logo_media_id_media_id_fk"
        FOREIGN KEY ("logo_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "star_cards_body_images"
        ADD CONSTRAINT "star_cards_body_images_image_media_id_media_id_fk"
        FOREIGN KEY ("image_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "star_cards_logo_media_idx"
      ON "star_cards" USING btree ("logo_media_id");
    CREATE INDEX IF NOT EXISTS "star_cards_body_images_image_media_idx"
      ON "star_cards_body_images" USING btree ("image_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "star_cards_body_images_image_media_idx";
    DROP INDEX IF EXISTS "star_cards_logo_media_idx";

    ALTER TABLE "star_cards_body_images"
      DROP CONSTRAINT IF EXISTS "star_cards_body_images_image_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "image_media_id";

    ALTER TABLE "star_cards"
      DROP CONSTRAINT IF EXISTS "star_cards_logo_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "logo_media_id";
  `)
}
