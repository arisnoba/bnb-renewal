import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "histories" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "year" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "histories_months" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "month" numeric NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "histories_months_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "histories_months"
        ADD CONSTRAINT "histories_months_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."histories"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "histories_months_items"
        ADD CONSTRAINT "histories_months_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."histories_months"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

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

    CREATE INDEX IF NOT EXISTS "histories_updated_at_idx"
      ON "histories" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "histories_created_at_idx"
      ON "histories" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "histories_months_order_idx"
      ON "histories_months" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "histories_months_parent_id_idx"
      ON "histories_months" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "histories_months_items_order_idx"
      ON "histories_months_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "histories_months_items_parent_id_idx"
      ON "histories_months_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_histories_id_idx"
      ON "payload_locked_documents_rels" USING btree ("histories_id");

    DO $$
    DECLARE
      has_month boolean;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'histories'
          AND column_name = 'month'
      ) INTO has_month;

      IF NOT has_month THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "histories_year_idx"
          ON "histories" USING btree ("year");

        INSERT INTO "histories" ("year", "title")
        VALUES
          (2010, '2010년'),
          (2014, '2014년'),
          (2015, '2015년'),
          (2017, '2017년'),
          (2018, '2018년'),
          (2019, '2019년'),
          (2020, '2020년'),
          (2021, '2021년'),
          (2022, '2022년'),
          (2023, '2023년'),
          (2024, '2024년'),
          (2025, '2025년')
        ON CONFLICT ("year") DO UPDATE SET
          "title" = excluded."title",
          "updated_at" = now();

        INSERT INTO "histories_months" ("_order", "_parent_id", "id", "month")
        SELECT seed.month_order, histories.id, seed.id, seed.month
        FROM (
          VALUES
            (2010, 0, 'history-2010-01', 1),
            (2010, 1, 'history-2010-02', 2),
            (2014, 0, 'history-2014-09', 9),
            (2015, 0, 'history-2015-02', 2),
            (2017, 0, 'history-2017-04', 4),
            (2018, 0, 'history-2018-05', 5),
            (2019, 0, 'history-2019-09', 9),
            (2020, 0, 'history-2020-09', 9),
            (2021, 0, 'history-2021-07', 7),
            (2022, 0, 'history-2022-03', 3),
            (2022, 1, 'history-2022-08', 8),
            (2023, 0, 'history-2023-12', 12),
            (2024, 0, 'history-2024-01', 1),
            (2024, 1, 'history-2024-03', 3),
            (2024, 2, 'history-2024-08', 8),
            (2025, 0, 'history-2025-03', 3),
            (2025, 1, 'history-2025-04', 4),
            (2025, 2, 'history-2025-08', 8),
            (2025, 3, 'history-2025-10', 10)
        ) AS seed(year, month_order, id, month)
        JOIN "histories" ON "histories"."year" = seed.year
        ON CONFLICT ("id") DO UPDATE SET
          "_order" = excluded."_order",
          "_parent_id" = excluded."_parent_id",
          "month" = excluded."month";

        INSERT INTO "histories_months_items" ("_order", "_parent_id", "id", "title")
        VALUES
          (0, 'history-2010-01', 'history-2010-01-1', 'BNB INDUSTRY'),
          (1, 'history-2010-01', 'history-2010-01-2', 'Baewoo&Baewoom EnM'),
          (0, 'history-2010-02', 'history-2010-02-1', 'Baewoo&Baewoom Art Center'),
          (0, 'history-2014-09', 'history-2014-09-1', 'BISTUS Entertainment'),
          (0, 'history-2015-02', 'history-2015-02-1', 'U CASTING'),
          (0, 'history-2017-04', 'history-2017-04-1', 'Baewoo&Baewoom Exam Center'),
          (0, 'history-2018-05', 'history-2018-05-1', 'Baewoo&Baewoom Kids Center'),
          (0, 'history-2019-09', 'history-2019-09-1', 'Baewoo&Baewoom High-teen Center'),
          (0, 'history-2020-09', 'history-2020-09-1', 'BX Model Agency'),
          (0, 'history-2021-07', 'history-2021-07-1', 'BAEWOOHWA Studio'),
          (0, 'history-2022-03', 'history-2022-03-1', 'VorD INSIGHT'),
          (0, 'history-2022-08', 'history-2022-08-1', 'Perfect J Dance Studio'),
          (0, 'history-2023-12', 'history-2023-12-1', 'BAA Entertainment'),
          (0, 'history-2024-01', 'history-2024-01-1', 'Baewoo&Baewoom Avenue Center'),
          (0, 'history-2024-03', 'history-2024-03-1', 'BNB MUSIC'),
          (0, 'history-2024-08', 'history-2024-08-1', 'BNB PLAY'),
          (0, 'history-2025-03', 'history-2025-03-1', 'DEEPCON'),
          (0, 'history-2025-04', 'history-2025-04-1', 'BNB FANCONN'),
          (0, 'history-2025-08', 'history-2025-08-1', 'BNB CNX'),
          (0, 'history-2025-10', 'history-2025-10-1', 'X STREAM')
        ON CONFLICT ("id") DO UPDATE SET
          "_order" = excluded."_order",
          "_parent_id" = excluded."_parent_id",
          "title" = excluded."title";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_histories_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_histories_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "histories_id";

    DROP TABLE IF EXISTS "histories_months_items" CASCADE;
    DROP TABLE IF EXISTS "histories_months" CASCADE;
    DROP TABLE IF EXISTS "histories" CASCADE;
  `)
}
