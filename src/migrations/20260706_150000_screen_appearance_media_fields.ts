import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ADD COLUMN IF NOT EXISTS "thumbnail_media_id" integer,
      ADD COLUMN IF NOT EXISTS "profile_image_media_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_thumbnail_media_id_media_id_fk'
      ) THEN
        ALTER TABLE "screen_appearances"
        ADD CONSTRAINT "screen_appearances_thumbnail_media_id_media_id_fk"
        FOREIGN KEY ("thumbnail_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_profile_image_media_id_media_id_fk'
      ) THEN
        ALTER TABLE "screen_appearances"
        ADD CONSTRAINT "screen_appearances_profile_image_media_id_media_id_fk"
        FOREIGN KEY ("profile_image_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "screen_appearances_thumbnail_media_idx"
      ON "screen_appearances" USING btree ("thumbnail_media_id");

    CREATE INDEX IF NOT EXISTS "screen_appearances_profile_image_media_idx"
      ON "screen_appearances" USING btree ("profile_image_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "screen_appearances_profile_image_media_idx";
    DROP INDEX IF EXISTS "screen_appearances_thumbnail_media_idx";

    ALTER TABLE "screen_appearances"
      DROP CONSTRAINT IF EXISTS "screen_appearances_profile_image_media_id_media_id_fk",
      DROP CONSTRAINT IF EXISTS "screen_appearances_thumbnail_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "profile_image_media_id",
      DROP COLUMN IF EXISTS "thumbnail_media_id";
  `)
}
