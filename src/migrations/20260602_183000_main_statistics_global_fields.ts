import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

type Center = 'art' | 'exam' | 'kids' | 'highteen' | 'avenue'

function centerColumnSql(center: Center) {
  return sql.raw(`
    ADD COLUMN IF NOT EXISTS "${center}_total_work_count" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "${center}_monthly_lead_supporting_audition_count" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "${center}_monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "${center}_monthly_minor_extra_listup_count" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "${center}_monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0
  `)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "main_statistics" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "main_statistics"
      ${centerColumnSql('art')},
      ${centerColumnSql('exam')},
      ${centerColumnSql('kids')},
      ${centerColumnSql('highteen')},
      ${centerColumnSql('avenue')};

    INSERT INTO "main_statistics" ("created_at", "updated_at")
    SELECT now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM "main_statistics");

    WITH "target" AS (
      SELECT min("id") AS "id" FROM "main_statistics"
    )
    UPDATE "main_statistics"
    SET
      "art_total_work_count" = coalesce((
        SELECT "total_work_count" FROM "main_statistics"
        WHERE "center" = 'art'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "art_total_work_count", 0),
      "art_monthly_lead_supporting_audition_count" = coalesce((
        SELECT "monthly_lead_supporting_audition_count" FROM "main_statistics"
        WHERE "center" = 'art'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "art_monthly_lead_supporting_audition_count", 0),
      "art_monthly_lead_supporting_director_meeting_count" = coalesce((
        SELECT "monthly_lead_supporting_director_meeting_count" FROM "main_statistics"
        WHERE "center" = 'art'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "art_monthly_lead_supporting_director_meeting_count", 0),
      "art_monthly_minor_extra_listup_count" = coalesce((
        SELECT "monthly_minor_extra_listup_count" FROM "main_statistics"
        WHERE "center" = 'art'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "art_monthly_minor_extra_listup_count", 0),
      "art_monthly_minor_extra_casting_confirmed_count" = coalesce((
        SELECT "monthly_minor_extra_casting_confirmed_count" FROM "main_statistics"
        WHERE "center" = 'art'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "art_monthly_minor_extra_casting_confirmed_count", 0),
      "exam_total_work_count" = coalesce((
        SELECT "total_work_count" FROM "main_statistics"
        WHERE "center" = 'exam'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "exam_total_work_count", 0),
      "exam_monthly_lead_supporting_audition_count" = coalesce((
        SELECT "monthly_lead_supporting_audition_count" FROM "main_statistics"
        WHERE "center" = 'exam'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "exam_monthly_lead_supporting_audition_count", 0),
      "exam_monthly_lead_supporting_director_meeting_count" = coalesce((
        SELECT "monthly_lead_supporting_director_meeting_count" FROM "main_statistics"
        WHERE "center" = 'exam'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "exam_monthly_lead_supporting_director_meeting_count", 0),
      "exam_monthly_minor_extra_listup_count" = coalesce((
        SELECT "monthly_minor_extra_listup_count" FROM "main_statistics"
        WHERE "center" = 'exam'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "exam_monthly_minor_extra_listup_count", 0),
      "exam_monthly_minor_extra_casting_confirmed_count" = coalesce((
        SELECT "monthly_minor_extra_casting_confirmed_count" FROM "main_statistics"
        WHERE "center" = 'exam'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "exam_monthly_minor_extra_casting_confirmed_count", 0),
      "kids_total_work_count" = coalesce((
        SELECT "total_work_count" FROM "main_statistics"
        WHERE "center" = 'kids'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "kids_total_work_count", 0),
      "kids_monthly_lead_supporting_audition_count" = coalesce((
        SELECT "monthly_lead_supporting_audition_count" FROM "main_statistics"
        WHERE "center" = 'kids'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "kids_monthly_lead_supporting_audition_count", 0),
      "kids_monthly_lead_supporting_director_meeting_count" = coalesce((
        SELECT "monthly_lead_supporting_director_meeting_count" FROM "main_statistics"
        WHERE "center" = 'kids'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "kids_monthly_lead_supporting_director_meeting_count", 0),
      "kids_monthly_minor_extra_listup_count" = coalesce((
        SELECT "monthly_minor_extra_listup_count" FROM "main_statistics"
        WHERE "center" = 'kids'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "kids_monthly_minor_extra_listup_count", 0),
      "kids_monthly_minor_extra_casting_confirmed_count" = coalesce((
        SELECT "monthly_minor_extra_casting_confirmed_count" FROM "main_statistics"
        WHERE "center" = 'kids'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "kids_monthly_minor_extra_casting_confirmed_count", 0),
      "highteen_total_work_count" = coalesce((
        SELECT "total_work_count" FROM "main_statistics"
        WHERE "center" = 'highteen'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "highteen_total_work_count", 0),
      "highteen_monthly_lead_supporting_audition_count" = coalesce((
        SELECT "monthly_lead_supporting_audition_count" FROM "main_statistics"
        WHERE "center" = 'highteen'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "highteen_monthly_lead_supporting_audition_count", 0),
      "highteen_monthly_lead_supporting_director_meeting_count" = coalesce((
        SELECT "monthly_lead_supporting_director_meeting_count" FROM "main_statistics"
        WHERE "center" = 'highteen'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "highteen_monthly_lead_supporting_director_meeting_count", 0),
      "highteen_monthly_minor_extra_listup_count" = coalesce((
        SELECT "monthly_minor_extra_listup_count" FROM "main_statistics"
        WHERE "center" = 'highteen'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "highteen_monthly_minor_extra_listup_count", 0),
      "highteen_monthly_minor_extra_casting_confirmed_count" = coalesce((
        SELECT "monthly_minor_extra_casting_confirmed_count" FROM "main_statistics"
        WHERE "center" = 'highteen'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "highteen_monthly_minor_extra_casting_confirmed_count", 0),
      "avenue_total_work_count" = coalesce((
        SELECT "total_work_count" FROM "main_statistics"
        WHERE "center" = 'avenue'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "avenue_total_work_count", 0),
      "avenue_monthly_lead_supporting_audition_count" = coalesce((
        SELECT "monthly_lead_supporting_audition_count" FROM "main_statistics"
        WHERE "center" = 'avenue'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "avenue_monthly_lead_supporting_audition_count", 0),
      "avenue_monthly_lead_supporting_director_meeting_count" = coalesce((
        SELECT "monthly_lead_supporting_director_meeting_count" FROM "main_statistics"
        WHERE "center" = 'avenue'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "avenue_monthly_lead_supporting_director_meeting_count", 0),
      "avenue_monthly_minor_extra_listup_count" = coalesce((
        SELECT "monthly_minor_extra_listup_count" FROM "main_statistics"
        WHERE "center" = 'avenue'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "avenue_monthly_minor_extra_listup_count", 0),
      "avenue_monthly_minor_extra_casting_confirmed_count" = coalesce((
        SELECT "monthly_minor_extra_casting_confirmed_count" FROM "main_statistics"
        WHERE "center" = 'avenue'
        ORDER BY "updated_at" DESC NULLS LAST, "id" DESC
        LIMIT 1
      ), "avenue_monthly_minor_extra_casting_confirmed_count", 0)
    WHERE "id" = (SELECT "id" FROM "target");

    DELETE FROM "main_statistics"
    WHERE "id" <> (SELECT min("id") FROM "main_statistics");

    DROP INDEX IF EXISTS "main_statistics_center_unique_idx";
    ALTER TABLE "main_statistics"
      DROP COLUMN IF EXISTS "title",
      DROP COLUMN IF EXISTS "center",
      DROP COLUMN IF EXISTS "total_work_count",
      DROP COLUMN IF EXISTS "monthly_lead_supporting_audition_count",
      DROP COLUMN IF EXISTS "monthly_lead_supporting_director_meeting_count",
      DROP COLUMN IF EXISTS "monthly_minor_extra_listup_count",
      DROP COLUMN IF EXISTS "monthly_minor_extra_casting_confirmed_count";
    DROP TYPE IF EXISTS "public"."enum_main_statistics_center";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "main_statistics"
      ADD COLUMN IF NOT EXISTS "title" varchar,
      ADD COLUMN IF NOT EXISTS "total_work_count" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "monthly_minor_extra_listup_count" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_main_statistics_center" AS ENUM(
        'art',
        'exam',
        'kids',
        'highteen',
        'avenue'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "main_statistics"
      ADD COLUMN IF NOT EXISTS "center" "public"."enum_main_statistics_center";

    DROP INDEX IF EXISTS "main_statistics_center_unique_idx";

    ALTER TABLE "main_statistics"
      DROP COLUMN IF EXISTS "avenue_monthly_minor_extra_casting_confirmed_count",
      DROP COLUMN IF EXISTS "avenue_monthly_minor_extra_listup_count",
      DROP COLUMN IF EXISTS "avenue_monthly_lead_supporting_director_meeting_count",
      DROP COLUMN IF EXISTS "avenue_monthly_lead_supporting_audition_count",
      DROP COLUMN IF EXISTS "avenue_total_work_count",
      DROP COLUMN IF EXISTS "highteen_monthly_minor_extra_casting_confirmed_count",
      DROP COLUMN IF EXISTS "highteen_monthly_minor_extra_listup_count",
      DROP COLUMN IF EXISTS "highteen_monthly_lead_supporting_director_meeting_count",
      DROP COLUMN IF EXISTS "highteen_monthly_lead_supporting_audition_count",
      DROP COLUMN IF EXISTS "highteen_total_work_count",
      DROP COLUMN IF EXISTS "kids_monthly_minor_extra_casting_confirmed_count",
      DROP COLUMN IF EXISTS "kids_monthly_minor_extra_listup_count",
      DROP COLUMN IF EXISTS "kids_monthly_lead_supporting_director_meeting_count",
      DROP COLUMN IF EXISTS "kids_monthly_lead_supporting_audition_count",
      DROP COLUMN IF EXISTS "kids_total_work_count",
      DROP COLUMN IF EXISTS "exam_monthly_minor_extra_casting_confirmed_count",
      DROP COLUMN IF EXISTS "exam_monthly_minor_extra_listup_count",
      DROP COLUMN IF EXISTS "exam_monthly_lead_supporting_director_meeting_count",
      DROP COLUMN IF EXISTS "exam_monthly_lead_supporting_audition_count",
      DROP COLUMN IF EXISTS "exam_total_work_count",
      DROP COLUMN IF EXISTS "art_monthly_minor_extra_casting_confirmed_count",
      DROP COLUMN IF EXISTS "art_monthly_minor_extra_listup_count",
      DROP COLUMN IF EXISTS "art_monthly_lead_supporting_director_meeting_count",
      DROP COLUMN IF EXISTS "art_monthly_lead_supporting_audition_count",
      DROP COLUMN IF EXISTS "art_total_work_count";
  `)
}
