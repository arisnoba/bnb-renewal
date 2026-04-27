import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const visibilityTables = [
  'news',
  'profiles',
  'artist_press',
  'audition_schedules',
  'casting_directors',
  'casting_appearances',
  'screen_appearances',
  'exam_passed_reviews',
  'exam_passed_videos',
  'exam_results',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of visibilityTables) {
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = '${sql.raw(table)}'
            AND column_name = 'is_public'
        ) THEN
          EXECUTE format(
            'UPDATE %I SET display_status = ''archived'' WHERE is_public = false',
            '${sql.raw(table)}'
          );
        END IF;
      END $$;
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of visibilityTables) {
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = '${sql.raw(table)}'
            AND column_name = 'is_public'
        ) THEN
          EXECUTE format(
            'UPDATE %I SET is_public = (display_status = ''published'')',
            '${sql.raw(table)}'
          );
        END IF;
      END $$;
    `)
  }
}
