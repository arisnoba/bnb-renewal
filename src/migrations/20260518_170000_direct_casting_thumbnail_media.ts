import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "direct_castings"
      ADD COLUMN IF NOT EXISTS "thumbnail_media_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "direct_castings"
        ADD CONSTRAINT "direct_castings_thumbnail_media_id_media_id_fk"
        FOREIGN KEY ("thumbnail_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "direct_castings_thumbnail_media_idx"
      ON "direct_castings" USING btree ("thumbnail_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "direct_castings_thumbnail_media_idx";

    ALTER TABLE "direct_castings"
      DROP CONSTRAINT IF EXISTS "direct_castings_thumbnail_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "thumbnail_media_id";
  `)
}
