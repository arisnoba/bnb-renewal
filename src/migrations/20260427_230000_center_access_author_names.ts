import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "artist_press" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "casting_appearances" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "exam_passed_reviews" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "exam_passed_videos" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "exam_results" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "exam_school_logos" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "screen_appearances" ADD COLUMN IF NOT EXISTS "author_name" varchar;
    ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "author_name" varchar;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_curriculums_centers'
      ) THEN
        CREATE TYPE "public"."enum_curriculums_centers" AS ENUM (
          'art',
          'exam',
          'kids',
          'highteen',
          'avenue'
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_exam_school_logos_centers'
      ) THEN
        CREATE TYPE "public"."enum_exam_school_logos_centers" AS ENUM (
          'art',
          'exam',
          'kids',
          'highteen',
          'avenue'
        );
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "curriculums_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_curriculums_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "exam_school_logos_centers" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_exam_school_logos_centers",
      "id" serial PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_centers_parent_fk'
      ) THEN
        ALTER TABLE "curriculums_centers"
        ADD CONSTRAINT "curriculums_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."curriculums"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'exam_school_logos_centers_parent_fk'
      ) THEN
        ALTER TABLE "exam_school_logos_centers"
        ADD CONSTRAINT "exam_school_logos_centers_parent_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "public"."exam_school_logos"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "curriculums_centers_order_idx"
      ON "curriculums_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "curriculums_centers_parent_idx"
      ON "curriculums_centers" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "exam_school_logos_centers_order_idx"
      ON "exam_school_logos_centers" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "exam_school_logos_centers_parent_idx"
      ON "exam_school_logos_centers" USING btree ("parent_id");

    INSERT INTO "curriculums_centers" ("order", "parent_id", "value")
    SELECT
      "teachers_centers"."order",
      "curriculums"."id",
      "teachers_centers"."value"::text::"enum_curriculums_centers"
    FROM "curriculums"
    JOIN "teachers_centers"
      ON "teachers_centers"."parent_id" = "curriculums"."teacher_id"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "curriculums_centers"
      WHERE "curriculums_centers"."parent_id" = "curriculums"."id"
        AND "curriculums_centers"."value"::text = "teachers_centers"."value"::text
    );

    INSERT INTO "curriculums_centers" ("order", "parent_id", "value")
    SELECT
      0,
      "curriculums"."id",
      CASE "curriculums"."source_db"
        WHEN 'baewoo' THEN 'art'::"enum_curriculums_centers"
        WHEN 'kidscenter' THEN 'kids'::"enum_curriculums_centers"
        WHEN 'bnbhighteen' THEN 'highteen'::"enum_curriculums_centers"
        ELSE NULL
      END
    FROM "curriculums"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "curriculums_centers"
      WHERE "curriculums_centers"."parent_id" = "curriculums"."id"
    )
      AND CASE "curriculums"."source_db"
        WHEN 'baewoo' THEN 'art'
        WHEN 'kidscenter' THEN 'kids'
        WHEN 'bnbhighteen' THEN 'highteen'
        ELSE NULL
      END IS NOT NULL;

    INSERT INTO "exam_school_logos_centers" ("order", "parent_id", "value")
    SELECT
      0,
      "exam_school_logos"."id",
      'exam'::"enum_exam_school_logos_centers"
    FROM "exam_school_logos"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "exam_school_logos_centers"
      WHERE "exam_school_logos_centers"."parent_id" = "exam_school_logos"."id"
    );

    DO $$
    DECLARE
      has_invalid boolean;
      item record;
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "users" WHERE "center"::text = 'unknown'
      ) THEN
        RAISE EXCEPTION 'users.center에 unknown 값이 남아 있습니다.';
      END IF;

      FOR item IN
        SELECT * FROM (VALUES
          ('teachers_centers'),
          ('news_centers'),
          ('profiles_centers'),
          ('agencies_centers'),
          ('artist_press_centers'),
          ('audition_schedules_centers'),
          ('casting_directors_centers'),
          ('casting_appearances_centers'),
          ('screen_appearances_centers'),
          ('exam_passed_reviews_centers'),
          ('exam_passed_videos_centers'),
          ('exam_results_centers')
        ) AS values("center_table")
      LOOP
        EXECUTE format(
          'SELECT EXISTS (SELECT 1 FROM %I WHERE "value"::text IN (''all'', ''unknown''))',
          item."center_table"
        ) INTO has_invalid;

        IF has_invalid THEN
          RAISE EXCEPTION '% 테이블에 all/unknown 센터 값이 남아 있습니다.', item."center_table";
        END IF;
      END LOOP;
    END $$;

    DO $$
    DECLARE
      item record;
    BEGIN
      ALTER TABLE "users" ALTER COLUMN "center" DROP DEFAULT;
      CREATE TYPE "public"."enum_users_center_new" AS ENUM (
        'art',
        'exam',
        'kids',
        'highteen',
        'avenue'
      );
      ALTER TABLE "users"
        ALTER COLUMN "center" TYPE "enum_users_center_new"
        USING "center"::text::"enum_users_center_new";
      DROP TYPE "public"."enum_users_center";
      ALTER TYPE "public"."enum_users_center_new" RENAME TO "enum_users_center";
      ALTER TABLE "users"
        ALTER COLUMN "center" SET DEFAULT 'art'::"enum_users_center";

      FOR item IN
        SELECT * FROM (VALUES
          ('enum_teachers_centers', 'teachers_centers'),
          ('enum_news_centers', 'news_centers'),
          ('enum_profiles_centers', 'profiles_centers'),
          ('enum_agencies_centers', 'agencies_centers'),
          ('enum_artist_press_centers', 'artist_press_centers'),
          ('enum_audition_schedules_centers', 'audition_schedules_centers'),
          ('enum_casting_directors_centers', 'casting_directors_centers'),
          ('enum_casting_appearances_centers', 'casting_appearances_centers'),
          ('enum_screen_appearances_centers', 'screen_appearances_centers'),
          ('enum_exam_passed_reviews_centers', 'exam_passed_reviews_centers'),
          ('enum_exam_passed_videos_centers', 'exam_passed_videos_centers'),
          ('enum_exam_results_centers', 'exam_results_centers')
        ) AS values("type_name", "center_table")
      LOOP
        EXECUTE format(
          'CREATE TYPE %I AS ENUM (''art'', ''exam'', ''kids'', ''highteen'', ''avenue'')',
          item."type_name" || '_new'
        );
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN "value" TYPE %I USING "value"::text::%I',
          item."center_table",
          item."type_name" || '_new',
          item."type_name" || '_new'
        );
        EXECUTE format('DROP TYPE "public".%I', item."type_name");
        EXECUTE format(
          'ALTER TYPE %I RENAME TO %I',
          item."type_name" || '_new',
          item."type_name"
        );
      END LOOP;
    END $$;

    DO $$
    DECLARE
      has_missing boolean;
      item record;
    BEGIN
      FOR item IN
        SELECT * FROM (VALUES
          ('agencies', 'agencies_centers'),
          ('artist_press', 'artist_press_centers'),
          ('audition_schedules', 'audition_schedules_centers'),
          ('casting_appearances', 'casting_appearances_centers'),
          ('casting_directors', 'casting_directors_centers'),
          ('curriculums', 'curriculums_centers'),
          ('exam_passed_reviews', 'exam_passed_reviews_centers'),
          ('exam_passed_videos', 'exam_passed_videos_centers'),
          ('exam_results', 'exam_results_centers'),
          ('exam_school_logos', 'exam_school_logos_centers'),
          ('news', 'news_centers'),
          ('profiles', 'profiles_centers'),
          ('screen_appearances', 'screen_appearances_centers'),
          ('teachers', 'teachers_centers')
        ) AS values("doc_table", "center_table")
      LOOP
        EXECUTE format(
          'SELECT EXISTS (
            SELECT 1 FROM %I AS docs
            WHERE NOT EXISTS (
              SELECT 1 FROM %I AS centers
              WHERE centers."parent_id" = docs."id"
            )
          )',
          item."doc_table",
          item."center_table"
        ) INTO has_missing;

        IF has_missing THEN
          RAISE EXCEPTION '% 테이블에 센터가 없는 데이터가 남아 있습니다.', item."doc_table";
        END IF;
      END LOOP;
    END $$;

    CREATE TEMP TABLE "_center_author_names" (
      "center" text PRIMARY KEY,
      "author_name" text NOT NULL
    ) ON COMMIT DROP;

    INSERT INTO "_center_author_names" ("center", "author_name") VALUES
      ('art', '배우앤배움 아트센터'),
      ('exam', '배우앤배움 입시센터'),
      ('kids', '배우앤배움 키즈센터'),
      ('highteen', '배우앤배움 하이틴센터'),
      ('avenue', '배우앤배움 애비뉴센터');

    DO $$
    DECLARE
      item record;
    BEGIN
      FOR item IN
        SELECT * FROM (VALUES
          ('agencies', 'agencies_centers'),
          ('artist_press', 'artist_press_centers'),
          ('audition_schedules', 'audition_schedules_centers'),
          ('casting_appearances', 'casting_appearances_centers'),
          ('casting_directors', 'casting_directors_centers'),
          ('curriculums', 'curriculums_centers'),
          ('exam_passed_reviews', 'exam_passed_reviews_centers'),
          ('exam_passed_videos', 'exam_passed_videos_centers'),
          ('exam_results', 'exam_results_centers'),
          ('exam_school_logos', 'exam_school_logos_centers'),
          ('news', 'news_centers'),
          ('profiles', 'profiles_centers'),
          ('screen_appearances', 'screen_appearances_centers'),
          ('teachers', 'teachers_centers')
        ) AS values("doc_table", "center_table")
      LOOP
        EXECUTE format(
          'WITH center_counts AS (
            SELECT
              "parent_id",
              count(*) AS "center_count",
              min("value"::text) AS "center"
            FROM %I
            GROUP BY "parent_id"
          )
          UPDATE %I AS docs
          SET "author_name" = CASE
            WHEN center_counts."center_count" = 1 THEN author_names."author_name"
            ELSE ''배우앤배움 아트센터''
          END
          FROM center_counts
          LEFT JOIN "_center_author_names" AS author_names
            ON author_names."center" = center_counts."center"
          WHERE docs."id" = center_counts."parent_id"',
          item."center_table",
          item."doc_table"
        );
      END LOOP;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agencies" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "artist_press" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "casting_appearances" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "exam_passed_reviews" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "exam_passed_videos" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "exam_results" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "exam_school_logos" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "screen_appearances" DROP COLUMN IF EXISTS "author_name";
    ALTER TABLE "teachers" DROP COLUMN IF EXISTS "author_name";

    DROP TABLE IF EXISTS "curriculums_centers" CASCADE;
    DROP TABLE IF EXISTS "exam_school_logos_centers" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_curriculums_centers";
    DROP TYPE IF EXISTS "public"."enum_exam_school_logos_centers";

    ALTER TYPE "public"."enum_users_center" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_teachers_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_teachers_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_news_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_news_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_profiles_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_profiles_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_agencies_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_agencies_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_artist_press_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_artist_press_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_audition_schedules_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_audition_schedules_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_casting_directors_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_casting_directors_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_casting_appearances_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_casting_appearances_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_screen_appearances_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_screen_appearances_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_exam_passed_reviews_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_exam_passed_reviews_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_exam_passed_videos_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_exam_passed_videos_centers" ADD VALUE IF NOT EXISTS 'unknown';
    ALTER TYPE "public"."enum_exam_results_centers" ADD VALUE IF NOT EXISTS 'all';
    ALTER TYPE "public"."enum_exam_results_centers" ADD VALUE IF NOT EXISTS 'unknown';
  `)
}
