import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artist_press_agencies"
      ADD COLUMN IF NOT EXISTS "slug" varchar;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'artist_press_agencies'
          AND column_name = 'normalized_key'
      ) THEN
        UPDATE "artist_press_agencies"
        SET "slug" = coalesce(nullif("slug", ''), nullif("normalized_key", ''), concat('agency-', "id"))
        WHERE "slug" IS NULL OR "slug" = '';
      ELSE
        UPDATE "artist_press_agencies"
        SET "slug" = coalesce(nullif("slug", ''), concat('agency-', "id"))
        WHERE "slug" IS NULL OR "slug" = '';
      END IF;
    END $$;

    ALTER TABLE "artist_press_agencies"
      ALTER COLUMN "slug" SET NOT NULL;

    DROP INDEX IF EXISTS "artist_press_agencies_normalized_key_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "artist_press_agencies_slug_idx"
      ON "artist_press_agencies" USING btree ("slug");

    ALTER TABLE "artist_press_agencies"
      DROP COLUMN IF EXISTS "normalized_key";

    DROP TABLE IF EXISTS "artist_press_agencies_legacy_aliases" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artist_press_agencies"
      ADD COLUMN IF NOT EXISTS "normalized_key" varchar;

    UPDATE "artist_press_agencies"
    SET "normalized_key" = coalesce(nullif("normalized_key", ''), nullif("slug", ''), concat('agency-', "id"))
    WHERE "normalized_key" IS NULL OR "normalized_key" = '';

    ALTER TABLE "artist_press_agencies"
      ALTER COLUMN "normalized_key" SET NOT NULL;

    DROP INDEX IF EXISTS "artist_press_agencies_slug_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "artist_press_agencies_normalized_key_idx"
      ON "artist_press_agencies" USING btree ("normalized_key");

    ALTER TABLE "artist_press_agencies"
      DROP COLUMN IF EXISTS "slug";

    CREATE TABLE IF NOT EXISTS "artist_press_agencies_legacy_aliases" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "original_name" varchar NOT NULL,
      "use_count" numeric,
      "sample_title" varchar
    );

    DO $$
    BEGIN
      ALTER TABLE "artist_press_agencies_legacy_aliases"
        ADD CONSTRAINT "artist_press_agencies_legacy_aliases_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."artist_press_agencies"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "artist_press_agencies_legacy_aliases_order_idx"
      ON "artist_press_agencies_legacy_aliases" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "artist_press_agencies_legacy_aliases_parent_id_idx"
      ON "artist_press_agencies_legacy_aliases" USING btree ("_parent_id");
  `)
}
