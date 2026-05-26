import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'screen_appearances'
          AND column_name = 'source_db'
      ) THEN
        UPDATE "screen_appearances"
        SET "centers" = CASE "source_db"
          WHEN 'baewoo' THEN 'art'::"enum_screen_appearances_centers"
          WHEN 'bnbhighteen' THEN 'highteen'::"enum_screen_appearances_centers"
          WHEN 'kidscenter' THEN 'kids'::"enum_screen_appearances_centers"
          ELSE 'art'::"enum_screen_appearances_centers"
        END
        WHERE "centers" IS NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1;`)
}
