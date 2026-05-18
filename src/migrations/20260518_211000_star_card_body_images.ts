import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "star_cards_body_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "source_file" varchar NOT NULL,
      "image_path" varchar NOT NULL,
      "display_order" numeric DEFAULT 0
    );

    DO $$
    BEGIN
      ALTER TABLE "star_cards_body_images"
        ADD CONSTRAINT "star_cards_body_images_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."star_cards"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "star_cards_body_images_order_idx"
      ON "star_cards_body_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "star_cards_body_images_parent_id_idx"
      ON "star_cards_body_images" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "star_cards_body_images" CASCADE;
  `)
}
