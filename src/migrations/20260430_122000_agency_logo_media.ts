import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agencies"
      ADD COLUMN IF NOT EXISTS "logo_media_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'agencies_logo_media_id_media_id_fk'
      ) THEN
        ALTER TABLE "agencies"
        ADD CONSTRAINT "agencies_logo_media_id_media_id_fk"
        FOREIGN KEY ("logo_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "agencies_logo_media_idx"
      ON "agencies" USING btree ("logo_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "agencies_logo_media_idx";

    ALTER TABLE "agencies"
      DROP CONSTRAINT IF EXISTS "agencies_logo_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "logo_media_id";
  `)
}
