import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "broadcast_stations" (
      "id" serial PRIMARY KEY NOT NULL,
      "station_name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "logo_media_id" integer,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "screen_appearances"
      ADD COLUMN IF NOT EXISTS "broadcast_station_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "broadcast_stations_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "broadcast_stations"
        ADD CONSTRAINT "broadcast_stations_logo_media_id_media_id_fk"
        FOREIGN KEY ("logo_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "screen_appearances"
        ADD CONSTRAINT "screen_appearances_broadcast_station_id_broadcast_stations_id_f"
        FOREIGN KEY ("broadcast_station_id")
        REFERENCES "public"."broadcast_stations"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_broadcast_stations_fk"
        FOREIGN KEY ("broadcast_stations_id")
        REFERENCES "public"."broadcast_stations"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "broadcast_stations_slug_idx"
      ON "broadcast_stations" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "broadcast_stations_logo_media_idx"
      ON "broadcast_stations" USING btree ("logo_media_id");
    CREATE INDEX IF NOT EXISTS "broadcast_stations_created_at_idx"
      ON "broadcast_stations" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "broadcast_stations_updated_at_idx"
      ON "broadcast_stations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "screen_appearances_broadcast_station_idx"
      ON "screen_appearances" USING btree ("broadcast_station_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_broadcast_stations_id_idx"
      ON "payload_locked_documents_rels" USING btree ("broadcast_stations_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_broadcast_stations_id_idx";
    DROP INDEX IF EXISTS "screen_appearances_broadcast_station_idx";
    DROP INDEX IF EXISTS "broadcast_stations_updated_at_idx";
    DROP INDEX IF EXISTS "broadcast_stations_created_at_idx";
    DROP INDEX IF EXISTS "broadcast_stations_logo_media_idx";
    DROP INDEX IF EXISTS "broadcast_stations_slug_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_broadcast_stations_fk",
      DROP COLUMN IF EXISTS "broadcast_stations_id";

    ALTER TABLE "screen_appearances"
      DROP CONSTRAINT IF EXISTS "screen_appearances_broadcast_station_id_broadcast_stations_id_f",
      DROP COLUMN IF EXISTS "broadcast_station_id";

    DROP TABLE IF EXISTS "broadcast_stations" CASCADE;
  `)
}
