import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "casting_directors_career_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "content" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'casting_directors_career_items_parent_id_fk'
      ) THEN
        ALTER TABLE "casting_directors_career_items"
        ADD CONSTRAINT "casting_directors_career_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."casting_directors"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "casting_directors_career_items_order_idx"
      ON "casting_directors_career_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "casting_directors_career_items_parent_id_idx"
      ON "casting_directors_career_items" USING btree ("_parent_id");

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'casting_directors'
          AND column_name = 'body_html'
      ) THEN
        EXECUTE $career_items$
          WITH html_rows AS (
            SELECT
              "casting_directors"."id" AS "parent_id",
              "parts"."row_index",
              "parts"."row_html"
            FROM "casting_directors"
            CROSS JOIN LATERAL regexp_split_to_table(
              coalesce("casting_directors"."body_html", ''),
              '<tr[^>]*>',
              'i'
            ) WITH ORDINALITY AS "parts"("row_html", "row_index")
            WHERE "parts"."row_html" ~* '<th[^>]*>.*</th>'
              AND "parts"."row_html" ~* '<td[^>]*>.*</td>'
          ),
          cells AS (
            SELECT
              "parent_id",
              "row_index",
              (regexp_match("row_html", '<th[^>]*>([^<]*)</th>', 'is'))[1] AS "title_html",
              (regexp_match("row_html", '<td[^>]*>(.*)</td>', 'is'))[1] AS "content_html"
            FROM html_rows
          ),
          cleaned AS (
            SELECT
              "parent_id",
              "row_index",
              nullif(
                btrim(
                  regexp_replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            regexp_replace(coalesce("title_html", ''), '<[^>]+>', '', 'gi'),
                            '&nbsp;',
                            ' '
                          ),
                          '&amp;',
                          '&'
                        ),
                        '&lt;',
                        '<'
                      ),
                      '&gt;',
                      '>'
                    ),
                    '[[:space:]]+',
                    ' ',
                    'g'
                  )
                ),
                ''
              ) AS "title",
              nullif(
                btrim(
                  regexp_replace(
                    regexp_replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              regexp_replace(
                                regexp_replace(
                                  regexp_replace(coalesce("content_html", ''), '<br[[:space:]]*/?>', E'\n', 'gi'),
                                  '</?(p|div|li|td|th)[^>]*>',
                                  E'\n',
                                  'gi'
                                ),
                                '<[^>]+>',
                                '',
                                'gi'
                              ),
                              '&nbsp;',
                              ' '
                            ),
                            '&amp;',
                            '&'
                          ),
                          '&lt;',
                          '<'
                        ),
                        '&gt;',
                        '>'
                      ),
                      E'[ \\t]*\\r\\n?[ \\t]*|[ \\t]*\\n[ \\t]*',
                      E'\n',
                      'g'
                    ),
                    E'\n{2,}',
                    E'\n',
                    'g'
                  )
                ),
                ''
              ) AS "content"
            FROM cells
          ),
          ordered AS (
            SELECT
              row_number() OVER (
                PARTITION BY "parent_id"
                ORDER BY "row_index" DESC
              ) AS "item_order",
              "parent_id",
              "row_index",
              "title",
              "content"
            FROM cleaned
            WHERE "title" IS NOT NULL
              AND "content" IS NOT NULL
          )
          INSERT INTO "casting_directors_career_items" (
            "_order",
            "_parent_id",
            "id",
            "title",
            "content"
          )
          SELECT
            "item_order",
            "parent_id",
            md5("parent_id"::text || ':' || "row_index"::text),
            "title",
            "content"
          FROM ordered
          ON CONFLICT ("id") DO UPDATE SET
            "_order" = EXCLUDED."_order",
            "_parent_id" = EXCLUDED."_parent_id",
            "title" = EXCLUDED."title",
            "content" = EXCLUDED."content";
        $career_items$;
      END IF;
    END $$;

    ALTER TABLE "casting_directors"
      DROP COLUMN IF EXISTS "body_html";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "casting_directors"
      ADD COLUMN IF NOT EXISTS "body_html" varchar;

    DROP TABLE IF EXISTS "casting_directors_career_items" CASCADE;
  `)
}
