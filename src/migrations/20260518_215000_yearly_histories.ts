import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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

    DO $$
    DECLARE
      has_flat_month boolean;
      has_entries_table boolean;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'histories'
          AND column_name = 'month'
      ) INTO has_flat_month;

      SELECT to_regclass('public.histories_entries') IS NOT NULL
      INTO has_entries_table;

      IF has_flat_month THEN
        EXECUTE $transform$
          CREATE TEMP TABLE _history_flat_seed ON COMMIT DROP AS
          SELECT
            "year",
            "month",
            "title" AS item_title,
            row_number() OVER (
              PARTITION BY "year", "month"
              ORDER BY "display_order", "title", "id"
            ) - 1 AS item_order,
            dense_rank() OVER (
              PARTITION BY "year"
              ORDER BY "month"
            ) - 1 AS month_order
          FROM "histories"
        $transform$;

        DELETE FROM "histories_months_items";
        DELETE FROM "histories_months";
        DELETE FROM "histories";

        DROP INDEX IF EXISTS "histories_year_month_title_idx";
        ALTER TABLE "histories" DROP COLUMN IF EXISTS "month";

        INSERT INTO "histories" ("year", "title")
        SELECT
          "year",
          ("year"::int::text || '년') AS "title"
        FROM _history_flat_seed
        GROUP BY "year"
        ORDER BY "year";

        INSERT INTO "histories_months" ("_order", "_parent_id", "id", "month")
        SELECT
          seed.month_order::int,
          histories.id,
          (
            'history-' ||
            seed."year"::int::text ||
            '-' ||
            lpad(seed."month"::int::text, 2, '0')
          ) AS "id",
          seed."month"
        FROM (
          SELECT DISTINCT "year", "month", month_order
          FROM _history_flat_seed
        ) seed
        JOIN "histories" ON "histories"."year" = seed."year"
        ORDER BY seed."year", seed.month_order;

        INSERT INTO "histories_months_items" ("_order", "_parent_id", "id", "title")
        SELECT
          seed.item_order::int,
          (
            'history-' ||
            seed."year"::int::text ||
            '-' ||
            lpad(seed."month"::int::text, 2, '0')
          ) AS "_parent_id",
          (
            'history-' ||
            seed."year"::int::text ||
            '-' ||
            lpad(seed."month"::int::text, 2, '0') ||
            '-' ||
            (seed.item_order + 1)::int::text
          ) AS "id",
          seed.item_title
        FROM _history_flat_seed seed
        ORDER BY seed."year", seed.month_order, seed.item_order;
      ELSIF has_entries_table THEN
        CREATE TEMP TABLE _history_entries_seed ON COMMIT DROP AS
        SELECT
          histories."year",
          histories_entries."month",
          histories_entries."title" AS item_title,
          row_number() OVER (
            PARTITION BY histories."year", histories_entries."month"
            ORDER BY histories_entries."_order", histories_entries."title", histories_entries."id"
          ) - 1 AS item_order,
          dense_rank() OVER (
            PARTITION BY histories."year"
            ORDER BY histories_entries."month"
          ) - 1 AS month_order
        FROM "histories"
        JOIN "histories_entries"
          ON "histories_entries"."_parent_id" = "histories"."id";

        DELETE FROM "histories_months_items";
        DELETE FROM "histories_months";

        INSERT INTO "histories_months" ("_order", "_parent_id", "id", "month")
        SELECT
          seed.month_order::int,
          histories.id,
          (
            'history-' ||
            seed."year"::int::text ||
            '-' ||
            lpad(seed."month"::int::text, 2, '0')
          ) AS "id",
          seed."month"
        FROM (
          SELECT DISTINCT "year", "month", month_order
          FROM _history_entries_seed
        ) seed
        JOIN "histories" ON "histories"."year" = seed."year"
        ORDER BY seed."year", seed.month_order;

        INSERT INTO "histories_months_items" ("_order", "_parent_id", "id", "title")
        SELECT
          seed.item_order::int,
          (
            'history-' ||
            seed."year"::int::text ||
            '-' ||
            lpad(seed."month"::int::text, 2, '0')
          ) AS "_parent_id",
          (
            'history-' ||
            seed."year"::int::text ||
            '-' ||
            lpad(seed."month"::int::text, 2, '0') ||
            '-' ||
            (seed.item_order + 1)::int::text
          ) AS "id",
          seed.item_title
        FROM _history_entries_seed seed
        ORDER BY seed."year", seed.month_order, seed.item_order;

        DROP TABLE IF EXISTS "histories_entries" CASCADE;
      END IF;
    END $$;

    DROP TABLE IF EXISTS "histories_entries" CASCADE;

    CREATE UNIQUE INDEX IF NOT EXISTS "histories_year_idx"
      ON "histories" USING btree ("year");
    CREATE INDEX IF NOT EXISTS "histories_months_order_idx"
      ON "histories_months" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "histories_months_parent_id_idx"
      ON "histories_months" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "histories_months_items_order_idx"
      ON "histories_months_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "histories_months_items_parent_id_idx"
      ON "histories_months_items" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      has_month boolean;
      has_months boolean;
      has_items boolean;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'histories'
          AND column_name = 'month'
      ) INTO has_month;

      SELECT to_regclass('public.histories_months') IS NOT NULL INTO has_months;
      SELECT to_regclass('public.histories_months_items') IS NOT NULL INTO has_items;

      IF has_months AND has_items AND NOT has_month THEN
        CREATE TEMP TABLE _history_flat_seed ON COMMIT DROP AS
        SELECT
          histories."year",
          histories_months."month",
          histories_months_items."title",
          (
            (histories."year" - 2000) * 100 +
            histories_months."_order" * 10 +
            histories_months_items."_order"
          ) AS "display_order"
        FROM "histories"
        JOIN "histories_months"
          ON "histories_months"."_parent_id" = "histories"."id"
        JOIN "histories_months_items"
          ON "histories_months_items"."_parent_id" = "histories_months"."id"
        ORDER BY histories."year", histories_months."_order", histories_months_items."_order";

        DELETE FROM "histories_months_items";
        DELETE FROM "histories_months";
        DELETE FROM "histories";

        DROP INDEX IF EXISTS "histories_year_idx";
        ALTER TABLE "histories" ADD COLUMN IF NOT EXISTS "month" numeric;
        ALTER TABLE "histories" ADD COLUMN IF NOT EXISTS "display_order" numeric DEFAULT 0;

        INSERT INTO "histories" ("year", "month", "title", "display_order")
        SELECT "year", "month", "title", "display_order"
        FROM _history_flat_seed;

        ALTER TABLE "histories" ALTER COLUMN "month" SET NOT NULL;
      END IF;
    END $$;

    DROP TABLE IF EXISTS "histories_months_items" CASCADE;
    DROP TABLE IF EXISTS "histories_months" CASCADE;

    CREATE UNIQUE INDEX IF NOT EXISTS "histories_year_month_title_idx"
      ON "histories" USING btree ("year", "month", "title");
  `)
}
