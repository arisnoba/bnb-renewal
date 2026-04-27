import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "casting_appearances_cast_members" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "actor_name" varchar,
      "role_name" varchar,
      "episode_numbers" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'casting_appearances_cast_members_parent_id_fk'
      ) THEN
        ALTER TABLE "casting_appearances_cast_members"
        ADD CONSTRAINT "casting_appearances_cast_members_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."casting_appearances"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "casting_appearances_cast_members_order_idx"
      ON "casting_appearances_cast_members" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "casting_appearances_cast_members_parent_id_idx"
      ON "casting_appearances_cast_members" USING btree ("_parent_id");

    WITH raw AS (
      SELECT
        "id" AS "parent_id",
        string_to_array(
          trim(both '|' from coalesce("legacy_meta" #>> '{rawFields,wr8}', '')),
          '|'
        ) AS "actors",
        string_to_array(
          trim(both '|' from coalesce("legacy_meta" #>> '{rawFields,wr9}', '')),
          '|'
        ) AS "roles",
        string_to_array(
          trim(both '|' from coalesce("legacy_meta" #>> '{rawFields,wr10}', '')),
          '|'
        ) AS "episodes"
      FROM "casting_appearances"
    ),
    rows AS (
      SELECT
        "parent_id",
        "index" AS "row_index",
        nullif(btrim("actors"["index"]), '') AS "actor_name",
        nullif(btrim("roles"["index"]), '') AS "role_name",
        nullif(btrim("episodes"["index"]), '') AS "episode_numbers"
      FROM raw
      CROSS JOIN LATERAL generate_series(
        1,
        greatest(cardinality("actors"), cardinality("roles"), cardinality("episodes"))
      ) AS "index"
    )
    INSERT INTO "casting_appearances_cast_members" (
      "_order",
      "_parent_id",
      "id",
      "actor_name",
      "role_name",
      "episode_numbers"
    )
    SELECT
      "row_index",
      "parent_id",
      md5("parent_id"::text || ':' || "row_index"::text),
      "actor_name",
      "role_name",
      "episode_numbers"
    FROM rows
    WHERE "actor_name" IS NOT NULL
      OR "role_name" IS NOT NULL
      OR "episode_numbers" IS NOT NULL
    ON CONFLICT ("id") DO UPDATE SET
      "_order" = EXCLUDED."_order",
      "_parent_id" = EXCLUDED."_parent_id",
      "actor_name" = EXCLUDED."actor_name",
      "role_name" = EXCLUDED."role_name",
      "episode_numbers" = EXCLUDED."episode_numbers";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "casting_appearances_cast_members" CASCADE;
  `)
}
