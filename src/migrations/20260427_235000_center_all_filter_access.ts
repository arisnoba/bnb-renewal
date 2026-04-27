import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      has_all boolean;
      item record;
    BEGIN
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
          ('enum_exam_results_centers', 'exam_results_centers'),
          ('enum_curriculums_centers', 'curriculums_centers'),
          ('enum_exam_school_logos_centers', 'exam_school_logos_centers')
        ) AS values("type_name", "center_table")
      LOOP
        SELECT EXISTS (
          SELECT 1
          FROM pg_enum
          JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
          WHERE pg_type.typname = item."type_name"
            AND pg_enum.enumlabel = 'all'
        ) INTO has_all;

        IF NOT has_all THEN
          EXECUTE format(
            'CREATE TYPE %I AS ENUM (''art'', ''exam'', ''kids'', ''highteen'', ''avenue'', ''all'')',
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
        END IF;
      END LOOP;
    END $$;

    DELETE FROM "agencies_centers";

    INSERT INTO "agencies_centers" ("order", "parent_id", "value")
    SELECT
      0,
      "agencies"."id",
      'all'::"enum_agencies_centers"
    FROM "agencies";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "agencies_centers"
    SET "value" = 'art'::"enum_agencies_centers"
    WHERE "value"::text = 'all';

    DO $$
    DECLARE
      has_all boolean;
      item record;
    BEGIN
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
          ('enum_exam_results_centers', 'exam_results_centers'),
          ('enum_curriculums_centers', 'curriculums_centers'),
          ('enum_exam_school_logos_centers', 'exam_school_logos_centers')
        ) AS values("type_name", "center_table")
      LOOP
        EXECUTE format(
          'SELECT EXISTS (SELECT 1 FROM %I WHERE "value"::text = ''all'')',
          item."center_table"
        ) INTO has_all;

        IF has_all THEN
          RAISE EXCEPTION '% 테이블에 all 센터 값이 남아 있어 enum을 되돌릴 수 없습니다.', item."center_table";
        END IF;

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
  `)
}
