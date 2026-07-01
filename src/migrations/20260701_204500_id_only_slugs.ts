import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      target_table text;
      table_names text[] := ARRAY[
        'artist_press',
        'artist_press_agencies',
        'broadcast_stations',
        'casting_appearances',
        'curriculums',
        'direct_castings',
        'exam_passed_reviews',
        'exam_passed_videos',
        'exam_results',
        'faqs',
        'highteen_special_classes',
        'news',
        'screen_appearances',
        'star_cards'
      ];
    BEGIN
      FOREACH target_table IN ARRAY table_names LOOP
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = target_table
            AND column_name = 'slug'
        ) THEN
          EXECUTE format(
            'UPDATE %I SET slug = %L || id::text',
            target_table,
            'id-slug-migrating-20260701-' || target_table || '-'
          );

          EXECUTE format('UPDATE %I SET slug = id::text', target_table);
        END IF;
      END LOOP;
    END $$;

    ALTER TABLE "artist_press"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "casting_appearances"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "curriculums"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "direct_castings"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "exam_passed_reviews"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "exam_passed_videos"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "exam_results"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "faqs"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "highteen_special_classes"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "news"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "screen_appearances"
      DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "star_cards"
      DROP COLUMN IF EXISTS "generate_slug";

    ALTER TABLE "_artist_press_v"
      DROP COLUMN IF EXISTS "version_generate_slug";
    ALTER TABLE "_exam_passed_reviews_v"
      DROP COLUMN IF EXISTS "version_generate_slug";
    ALTER TABLE "_news_v"
      DROP COLUMN IF EXISTS "version_generate_slug";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1;`)
}
