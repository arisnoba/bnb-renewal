import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "histories" (
      "id" serial PRIMARY KEY NOT NULL,
      "year" numeric NOT NULL,
      "month" numeric NOT NULL,
      "title" varchar NOT NULL,
      "display_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "histories_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_histories_fk"
        FOREIGN KEY ("histories_id")
        REFERENCES "public"."histories"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "histories_year_month_title_idx"
      ON "histories" USING btree ("year", "month", "title");
    CREATE INDEX IF NOT EXISTS "histories_display_order_idx"
      ON "histories" USING btree ("display_order");
    CREATE INDEX IF NOT EXISTS "histories_updated_at_idx"
      ON "histories" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "histories_created_at_idx"
      ON "histories" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_histories_id_idx"
      ON "payload_locked_documents_rels" USING btree ("histories_id");

    INSERT INTO "histories" ("year", "month", "title", "display_order")
    VALUES
      (2010, 1, 'BNB INDUSTRY', 10),
      (2010, 1, 'Baewoo&Baewoom EnM', 20),
      (2010, 2, 'Baewoo&Baewoom Art Center', 30),
      (2014, 9, 'BISTUS Entertainment', 40),
      (2015, 2, 'U CASTING', 50),
      (2017, 4, 'Baewoo&Baewoom Exam Center', 60),
      (2018, 5, 'Baewoo&Baewoom Kids Center', 70),
      (2019, 9, 'Baewoo&Baewoom High-teen Center', 80),
      (2020, 9, 'BX Model Agency', 90),
      (2021, 7, 'BAEWOOHWA Studio', 100),
      (2022, 3, 'VorD INSIGHT', 110),
      (2022, 8, 'Perfect J Dance Studio', 120),
      (2023, 12, 'BAA Entertainment', 130),
      (2024, 1, 'Baewoo&Baewoom Avenue Center', 140),
      (2024, 3, 'BNB MUSIC', 150),
      (2024, 8, 'BNB PLAY', 160),
      (2025, 3, 'DEEPCON', 170),
      (2025, 4, 'BNB FANCONN', 180),
      (2025, 8, 'BNB CNX', 190),
      (2025, 10, 'X STREAM', 200)
    ON CONFLICT ("year", "month", "title") DO UPDATE SET
      "display_order" = excluded."display_order",
      "updated_at" = now();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_histories_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_histories_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "histories_id";

    DROP TABLE IF EXISTS "histories" CASCADE;
  `)
}
