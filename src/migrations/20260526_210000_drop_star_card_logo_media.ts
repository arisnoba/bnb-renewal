import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "star_cards_logo_media_idx";

    ALTER TABLE "star_cards"
      DROP CONSTRAINT IF EXISTS "star_cards_logo_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "logo_media_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "star_cards"
      ADD COLUMN IF NOT EXISTS "logo_media_id" integer;

    ALTER TABLE "star_cards"
      DROP CONSTRAINT IF EXISTS "star_cards_logo_media_id_media_id_fk";

    ALTER TABLE "star_cards"
      ADD CONSTRAINT "star_cards_logo_media_id_media_id_fk"
      FOREIGN KEY ("logo_media_id")
      REFERENCES "public"."media"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;

    CREATE INDEX IF NOT EXISTS "star_cards_logo_media_idx"
      ON "star_cards" USING btree ("logo_media_id");
  `)
}
