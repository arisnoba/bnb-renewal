import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const legacyPublishedTables = [
  'artist_press',
  'audition_schedules',
  'casting_appearances',
  'casting_directors',
  'exam_passed_reviews',
  'exam_passed_videos',
  'exam_results',
  'news',
  'profiles',
  'screen_appearances',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of legacyPublishedTables) {
    await db.execute(sql.raw(`
      UPDATE "${table}"
      SET "created_at" = "published_at"
      WHERE "source_id" IS NOT NULL
        AND "published_at" IS NOT NULL
        AND "created_at" IS DISTINCT FROM "published_at";
    `))
  }
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // The original import-time created_at values cannot be reconstructed safely.
}
