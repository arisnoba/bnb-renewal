import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "casting_directors"
      ADD COLUMN IF NOT EXISTS "profile_image_path" varchar,
      ADD COLUMN IF NOT EXISTS "profile_image_media_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'casting_directors_profile_image_media_id_media_id_fk'
      ) THEN
        ALTER TABLE "casting_directors"
        ADD CONSTRAINT "casting_directors_profile_image_media_id_media_id_fk"
        FOREIGN KEY ("profile_image_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "casting_directors_profile_image_media_idx"
      ON "casting_directors" USING btree ("profile_image_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "casting_directors_profile_image_media_idx";

    ALTER TABLE "casting_directors"
      DROP CONSTRAINT IF EXISTS "casting_directors_profile_image_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "profile_image_media_id",
      DROP COLUMN IF EXISTS "profile_image_path";
  `)
}
