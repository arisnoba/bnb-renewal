import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "screen_appearances"
      ADD COLUMN IF NOT EXISTS "intro_text" varchar;

    CREATE TABLE IF NOT EXISTS "screen_appearances_career_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "content" varchar
    );

    CREATE TABLE IF NOT EXISTS "screen_appearances_body_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_career_items_parent_id_fk'
      ) THEN
        ALTER TABLE "screen_appearances_career_items"
        ADD CONSTRAINT "screen_appearances_career_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."screen_appearances"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_body_images_parent_id_fk'
      ) THEN
        ALTER TABLE "screen_appearances_body_images"
        ADD CONSTRAINT "screen_appearances_body_images_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."screen_appearances"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'screen_appearances_body_images_image_id_media_id_fk'
      ) THEN
        ALTER TABLE "screen_appearances_body_images"
        ADD CONSTRAINT "screen_appearances_body_images_image_id_media_id_fk"
        FOREIGN KEY ("image_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "screen_appearances_career_items_order_idx"
      ON "screen_appearances_career_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "screen_appearances_career_items_parent_id_idx"
      ON "screen_appearances_career_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "screen_appearances_body_images_order_idx"
      ON "screen_appearances_body_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "screen_appearances_body_images_parent_id_idx"
      ON "screen_appearances_body_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "screen_appearances_body_images_image_idx"
      ON "screen_appearances_body_images" USING btree ("image_id");

    CREATE OR REPLACE FUNCTION "public"."_screen_appearance_clean_text"("raw_value" text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT nullif(
        btrim(
          regexp_replace(
            replace(replace(replace(coalesce("raw_value", ''), chr(160), ' '), chr(8203), ''), chr(65279), ''),
            '[ \t]+',
            ' ',
            'g'
          )
        ),
        ''
      )
    $$;

    CREATE OR REPLACE FUNCTION "public"."_screen_appearance_node_text"("node" jsonb)
    RETURNS text
    LANGUAGE plpgsql
    IMMUTABLE
    AS $$
    DECLARE
      "child" jsonb;
      "result" text := '';
    BEGIN
      IF "node" IS NULL THEN
        RETURN '';
      END IF;

      IF "node"->>'type' = 'text' THEN
        RETURN coalesce("node"->>'text', '');
      END IF;

      IF "node"->>'type' = 'linebreak' THEN
        RETURN E'\n';
      END IF;

      IF jsonb_typeof("node"->'children') = 'array' THEN
        FOR "child" IN SELECT value FROM jsonb_array_elements("node"->'children')
        LOOP
          "result" := "result" || "public"."_screen_appearance_node_text"("child");
        END LOOP;
      END IF;

      RETURN "result";
    END
    $$;

    CREATE OR REPLACE FUNCTION "public"."_screen_appearance_intro_text"("body_value" jsonb)
    RETURNS text
    LANGUAGE plpgsql
    IMMUTABLE
    AS $$
    DECLARE
      "child" jsonb;
      "line" text;
      "cleaned" text;
    BEGIN
      IF "body_value" IS NULL THEN
        RETURN NULL;
      END IF;

      FOR "child" IN
        SELECT value
        FROM jsonb_array_elements(coalesce("body_value"->'root'->'children', '[]'::jsonb))
      LOOP
        IF "child"->>'type' != 'paragraph' THEN
          CONTINUE;
        END IF;

        FOREACH "line" IN ARRAY regexp_split_to_array("public"."_screen_appearance_node_text"("child"), E'\n')
        LOOP
          "cleaned" := "public"."_screen_appearance_clean_text"("line");

          IF "cleaned" IS NOT NULL AND "cleaned" !~ '^방영(기간|일자)?\s*:' THEN
            RETURN "cleaned";
          END IF;
        END LOOP;
      END LOOP;

      RETURN NULL;
    END
    $$;

    CREATE OR REPLACE FUNCTION "public"."_screen_appearance_career_groups"("body_value" jsonb)
    RETURNS TABLE("row_order" integer, "item_title" text, "item_content" text)
    LANGUAGE plpgsql
    IMMUTABLE
    AS $$
    DECLARE
      "list_node" jsonb;
      "item_node" jsonb;
      "line" text;
      "lines" text[];
      "cleaned" text;
      "start_index" integer;
      "line_index" integer;
      "current_title" text;
      "current_lines" text[] := ARRAY[]::text[];
      "next_order" integer := 1;
      "career_categories" text[] := ARRAY[
        '드라마',
        '영화',
        '독립영화',
        '상업영화',
        '단편영화',
        '웹드라마',
        'CF',
        '광고',
        '방송',
        '예능',
        '연극',
        '뮤지컬',
        '뮤직비디오',
        'MV',
        '기타'
      ];
    BEGIN
      IF "body_value" IS NULL THEN
        RETURN;
      END IF;

      FOR "list_node" IN
        SELECT value
        FROM jsonb_array_elements(coalesce("body_value"->'root'->'children', '[]'::jsonb))
        WHERE value->>'type' = 'list'
      LOOP
        FOR "item_node" IN
          SELECT value
          FROM jsonb_array_elements(coalesce("list_node"->'children', '[]'::jsonb))
        LOOP
          "lines" := regexp_split_to_array("public"."_screen_appearance_node_text"("item_node"), E'\n');
          "start_index" := NULL;

          FOR "line_index" IN 1..coalesce(array_length("lines", 1), 0)
          LOOP
            "cleaned" := "public"."_screen_appearance_clean_text"("lines"["line_index"]);

            IF "cleaned" IS NOT NULL AND ("cleaned" = '경력' OR "cleaned" LIKE '경력%') THEN
              "start_index" := "line_index" + 1;
              EXIT;
            END IF;
          END LOOP;

          IF "start_index" IS NULL THEN
            CONTINUE;
          END IF;

          FOR "line_index" IN "start_index"..coalesce(array_length("lines", 1), 0)
          LOOP
            "line" := "public"."_screen_appearance_clean_text"("lines"["line_index"]);

            IF "line" IS NULL OR "line" ~ '^외\s*다수$' THEN
              CONTINUE;
            END IF;

            IF "line" = ANY ("career_categories") THEN
              IF "current_title" IS NOT NULL AND array_length("current_lines", 1) > 0 THEN
                "row_order" := "next_order";
                "item_title" := "current_title";
                "item_content" := array_to_string("current_lines", E'\n');
                "next_order" := "next_order" + 1;
                RETURN NEXT;
              END IF;

              "current_title" := "line";
              "current_lines" := ARRAY[]::text[];
              CONTINUE;
            END IF;

            IF "current_title" IS NULL THEN
              "current_title" := '기타';
              "current_lines" := ARRAY[]::text[];
            END IF;

            "current_lines" := array_append("current_lines", "line");
          END LOOP;
        END LOOP;
      END LOOP;

      IF "current_title" IS NOT NULL AND array_length("current_lines", 1) > 0 THEN
        "row_order" := "next_order";
        "item_title" := "current_title";
        "item_content" := array_to_string("current_lines", E'\n');
        RETURN NEXT;
      END IF;

      RETURN;
    END
    $$;

    UPDATE "screen_appearances"
    SET "intro_text" = "public"."_screen_appearance_intro_text"("body");

    DELETE FROM "screen_appearances_career_items";
    DELETE FROM "screen_appearances_body_images";

    INSERT INTO "screen_appearances_career_items" (
      "_order",
      "_parent_id",
      "id",
      "title",
      "content"
    )
    SELECT
      "groups"."row_order",
      "screen_appearances"."id",
      md5("screen_appearances"."id"::text || ':career:' || "groups"."row_order"::text),
      "groups"."item_title",
      "groups"."item_content"
    FROM "screen_appearances"
    CROSS JOIN LATERAL "public"."_screen_appearance_career_groups"("screen_appearances"."body") AS "groups";

    WITH "upload_nodes" AS (
      SELECT
        "screen_appearances"."id" AS "parent_id",
        ("child"->>'value')::integer AS "media_id",
        row_number() OVER (
          PARTITION BY "screen_appearances"."id"
          ORDER BY "node_order"
        ) AS "upload_order"
      FROM "screen_appearances"
      CROSS JOIN LATERAL jsonb_array_elements(coalesce("screen_appearances"."body"->'root'->'children', '[]'::jsonb))
        WITH ORDINALITY AS "nodes"("child", "node_order")
      WHERE "child"->>'type' = 'upload'
        AND ("child"->>'value') ~ '^[0-9]+$'
    )
    INSERT INTO "screen_appearances_body_images" (
      "_order",
      "_parent_id",
      "id",
      "image_id"
    )
    SELECT
      "upload_order" - 1,
      "parent_id",
      md5("parent_id"::text || ':body-image:' || "upload_order"::text || ':' || "media_id"::text),
      "media_id"
    FROM "upload_nodes"
    WHERE "upload_order" > 1
    ON CONFLICT ("id") DO UPDATE SET
      "_order" = EXCLUDED."_order",
      "_parent_id" = EXCLUDED."_parent_id",
      "image_id" = EXCLUDED."image_id";

    DROP FUNCTION IF EXISTS "public"."_screen_appearance_career_groups"(jsonb);
    DROP FUNCTION IF EXISTS "public"."_screen_appearance_intro_text"(jsonb);
    DROP FUNCTION IF EXISTS "public"."_screen_appearance_node_text"(jsonb);
    DROP FUNCTION IF EXISTS "public"."_screen_appearance_clean_text"(text);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "screen_appearances_body_images" CASCADE;
    DROP TABLE IF EXISTS "screen_appearances_career_items" CASCADE;

    ALTER TABLE "screen_appearances"
      DROP COLUMN IF EXISTS "intro_text";
  `)
}
