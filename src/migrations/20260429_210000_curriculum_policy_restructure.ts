import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'subject'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'title'
      ) THEN
        ALTER TABLE "curriculums" RENAME COLUMN "subject" TO "title";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'category'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'class_name'
      ) THEN
        ALTER TABLE "curriculums" RENAME COLUMN "category" TO "class_name";
      END IF;
    END $$;

    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "class_name" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_monday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_tuesday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_wednesday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_thursday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_friday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_saturday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_day_sunday" boolean DEFAULT false;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_start_time" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_end_time" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "education_start_date" timestamp(3) with time zone;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "capacity" numeric;
    ALTER TABLE "curriculums" ALTER COLUMN "capacity" SET DEFAULT 8;

    UPDATE "curriculums"
    SET "title" = coalesce(nullif(trim("title"), ''), nullif(trim("class_name"), ''), '커리큘럼')
    WHERE "title" IS NULL
      OR trim("title") = '';

    UPDATE "curriculums"
    SET "class_name" = CASE "class_name"
      WHEN '1' THEN '초급 I Class'
      WHEN '2' THEN '중급 R Class'
      WHEN '3' THEN '고급 U Class'
      WHEN '4' THEN '전문 D Class'
      WHEN '5' THEN '배우 A Class'
      WHEN '6' THEN '애비뉴 S Class'
      WHEN '7' THEN '특강반'
      ELSE "class_name"
    END
    WHERE "class_name" IN ('1', '2', '3', '4', '5', '6', '7');

    UPDATE "curriculums"
    SET
      "education_day_monday" = coalesce("education_day_monday", false),
      "education_day_tuesday" = coalesce("education_day_tuesday", false),
      "education_day_wednesday" = coalesce("education_day_wednesday", false),
      "education_day_thursday" = coalesce("education_day_thursday", false),
      "education_day_friday" = coalesce("education_day_friday", false),
      "education_day_saturday" = coalesce("education_day_saturday", false),
      "education_day_sunday" = coalesce("education_day_sunday", false);

    UPDATE "curriculums"
    SET "capacity" = 8
    WHERE "capacity" IS NULL;

    ALTER TABLE "curriculums" ALTER COLUMN "title" SET NOT NULL;

    DO $$
    BEGIN
      IF to_regclass('public.curriculums_weekly_lessons') IS NOT NULL
        AND to_regclass('public.curriculums_curriculum_lessons') IS NULL THEN
        ALTER TABLE "curriculums_weekly_lessons" RENAME TO "curriculums_curriculum_lessons";
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "curriculums_curriculum_lessons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar,
      "content" varchar
    );

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_curriculum_lessons'
          AND column_name = 'lesson_subject'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_curriculum_lessons'
          AND column_name = 'topic'
      ) THEN
        ALTER TABLE "curriculums_curriculum_lessons" RENAME COLUMN "lesson_subject" TO "topic";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_curriculum_lessons'
          AND column_name = 'lesson_content'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_curriculum_lessons'
          AND column_name = 'content'
      ) THEN
        ALTER TABLE "curriculums_curriculum_lessons" RENAME COLUMN "lesson_content" TO "content";
      END IF;
    END $$;

    ALTER TABLE "curriculums_curriculum_lessons" ADD COLUMN IF NOT EXISTS "topic" varchar;
    ALTER TABLE "curriculums_curriculum_lessons" ADD COLUMN IF NOT EXISTS "content" varchar;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_weekly_lessons_parent_id_fk'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_curriculum_lessons_parent_id_fk'
      ) THEN
        ALTER TABLE "curriculums_curriculum_lessons"
        RENAME CONSTRAINT "curriculums_weekly_lessons_parent_id_fk"
        TO "curriculums_curriculum_lessons_parent_id_fk";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_curriculum_lessons_parent_id_fk'
      ) THEN
        ALTER TABLE "curriculums_curriculum_lessons"
        ADD CONSTRAINT "curriculums_curriculum_lessons_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."curriculums"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF to_regclass('public.curriculums_weekly_lessons_order_idx') IS NOT NULL
        AND to_regclass('public.curriculums_curriculum_lessons_order_idx') IS NULL THEN
        ALTER INDEX "curriculums_weekly_lessons_order_idx"
        RENAME TO "curriculums_curriculum_lessons_order_idx";
      END IF;

      IF to_regclass('public.curriculums_weekly_lessons_parent_id_idx') IS NOT NULL
        AND to_regclass('public.curriculums_curriculum_lessons_parent_id_idx') IS NULL THEN
        ALTER INDEX "curriculums_weekly_lessons_parent_id_idx"
        RENAME TO "curriculums_curriculum_lessons_parent_id_idx";
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "curriculums_curriculum_lessons_order_idx"
      ON "curriculums_curriculum_lessons" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "curriculums_curriculum_lessons_parent_id_idx"
      ON "curriculums_curriculum_lessons" USING btree ("_parent_id");

    DROP TABLE IF EXISTS "curriculums_weekly_lessons" CASCADE;

    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "category";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "teacher_name";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "resolved_teacher_id";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "resolved_teacher_slug";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "subject";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "title_raw";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "content_raw";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums" ALTER COLUMN "title" DROP NOT NULL;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'title'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'subject'
      ) THEN
        ALTER TABLE "curriculums" RENAME COLUMN "title" TO "subject";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'class_name'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums'
          AND column_name = 'category'
      ) THEN
        ALTER TABLE "curriculums" RENAME COLUMN "class_name" TO "category";
      END IF;
    END $$;

    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "category" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "teacher_name" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "resolved_teacher_id" numeric;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "resolved_teacher_slug" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "subject" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "title_raw" varchar;
    ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "content_raw" varchar;

    DO $$
    BEGIN
      IF to_regclass('public.curriculums_curriculum_lessons') IS NOT NULL
        AND to_regclass('public.curriculums_weekly_lessons') IS NULL THEN
        ALTER TABLE "curriculums_curriculum_lessons" RENAME TO "curriculums_weekly_lessons";
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "curriculums_weekly_lessons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "lesson_subject" varchar,
      "lesson_content" varchar
    );

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_weekly_lessons'
          AND column_name = 'topic'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_weekly_lessons'
          AND column_name = 'lesson_subject'
      ) THEN
        ALTER TABLE "curriculums_weekly_lessons" RENAME COLUMN "topic" TO "lesson_subject";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_weekly_lessons'
          AND column_name = 'content'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'curriculums_weekly_lessons'
          AND column_name = 'lesson_content'
      ) THEN
        ALTER TABLE "curriculums_weekly_lessons" RENAME COLUMN "content" TO "lesson_content";
      END IF;
    END $$;

    ALTER TABLE "curriculums_weekly_lessons" ADD COLUMN IF NOT EXISTS "lesson_subject" varchar;
    ALTER TABLE "curriculums_weekly_lessons" ADD COLUMN IF NOT EXISTS "lesson_content" varchar;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_curriculum_lessons_parent_id_fk'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_weekly_lessons_parent_id_fk'
      ) THEN
        ALTER TABLE "curriculums_weekly_lessons"
        RENAME CONSTRAINT "curriculums_curriculum_lessons_parent_id_fk"
        TO "curriculums_weekly_lessons_parent_id_fk";
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_weekly_lessons_parent_id_fk'
      ) THEN
        ALTER TABLE "curriculums_weekly_lessons"
        ADD CONSTRAINT "curriculums_weekly_lessons_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."curriculums"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF to_regclass('public.curriculums_curriculum_lessons_order_idx') IS NOT NULL
        AND to_regclass('public.curriculums_weekly_lessons_order_idx') IS NULL THEN
        ALTER INDEX "curriculums_curriculum_lessons_order_idx"
        RENAME TO "curriculums_weekly_lessons_order_idx";
      END IF;

      IF to_regclass('public.curriculums_curriculum_lessons_parent_id_idx') IS NOT NULL
        AND to_regclass('public.curriculums_weekly_lessons_parent_id_idx') IS NULL THEN
        ALTER INDEX "curriculums_curriculum_lessons_parent_id_idx"
        RENAME TO "curriculums_weekly_lessons_parent_id_idx";
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "curriculums_weekly_lessons_order_idx"
      ON "curriculums_weekly_lessons" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "curriculums_weekly_lessons_parent_id_idx"
      ON "curriculums_weekly_lessons" USING btree ("_parent_id");

    DROP TABLE IF EXISTS "curriculums_curriculum_lessons" CASCADE;

    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "class_name";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_monday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_tuesday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_wednesday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_thursday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_friday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_saturday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_day_sunday";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_start_time";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_end_time";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "education_start_date";
    ALTER TABLE "curriculums" DROP COLUMN IF EXISTS "capacity";
  `)
}
