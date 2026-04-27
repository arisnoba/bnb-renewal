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
      UPDATE ${sql.identifier(table)}
      SET display_status = 'archived'
      WHERE is_public = false
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of visibilityTables) {
    await db.execute(sql`
      UPDATE ${sql.identifier(table)}
      SET is_public = (display_status = 'published')
    `)
  }
}
