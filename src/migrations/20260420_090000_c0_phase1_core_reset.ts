import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { assertDestructiveC0Allowed } from '../../scripts/c0/runtime'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertDestructiveC0Allowed()

  await db.execute(sql`
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photo_image1" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photo_image2" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photo_image3" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photo_image4" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photo_image5" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photo_image6" varchar;

    CREATE TABLE IF NOT EXISTS "agencies_actors" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "generation" varchar,
      "profile_image_path" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'agencies_actors_parent_id_fk'
      ) THEN
        ALTER TABLE "agencies_actors"
          ADD CONSTRAINT "agencies_actors_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."agencies"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "agencies_actors_order_idx" ON "agencies_actors" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "agencies_actors_parent_id_idx" ON "agencies_actors" USING btree ("_parent_id");

    TRUNCATE TABLE
      "teachers_gallery",
      "teachers",
      "news",
      "profiles",
      "agencies_actors",
      "agencies"
    RESTART IDENTITY CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "agencies_actors";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "photo_image1";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "photo_image2";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "photo_image3";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "photo_image4";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "photo_image5";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "photo_image6";
  `)
}
