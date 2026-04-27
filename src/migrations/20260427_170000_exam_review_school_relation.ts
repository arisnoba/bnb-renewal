import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exam_passed_reviews" ALTER COLUMN "school_name" DROP NOT NULL;
  ALTER TABLE "exam_passed_reviews" ALTER COLUMN "school_logo_slug" DROP NOT NULL;
  ALTER TABLE "exam_passed_reviews" ALTER COLUMN "school_logo_path" DROP NOT NULL;
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_passed_reviews' AND column_name = 'school_logo_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_passed_reviews' AND column_name = 'school_id'
    ) THEN
      ALTER TABLE "exam_passed_reviews" RENAME COLUMN "school_logo_id" TO "school_id";
    END IF;
  END $$;
  ALTER TABLE "exam_passed_reviews" ADD COLUMN IF NOT EXISTS "school_id" integer;
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_passed_reviews' AND column_name = 'school_logo_id'
    ) THEN
      EXECUTE 'UPDATE "exam_passed_reviews" SET "school_id" = "school_logo_id" WHERE "school_id" IS NULL';
    END IF;
  END $$;
  UPDATE "exam_passed_reviews"
  SET "school_id" = "exam_school_logos"."id"
  FROM "exam_school_logos"
  WHERE "exam_passed_reviews"."school_id" IS NULL
    AND (
      "exam_passed_reviews"."school_logo_slug" = "exam_school_logos"."school_slug"
      OR "exam_passed_reviews"."school_name" = "exam_school_logos"."school_name"
    );
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'exam_passed_reviews_school_id_exam_school_logos_id_fk'
    ) THEN
      ALTER TABLE "exam_passed_reviews" ADD CONSTRAINT "exam_passed_reviews_school_id_exam_school_logos_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."exam_school_logos"("id") ON DELETE restrict ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "exam_passed_reviews_school_idx" ON "exam_passed_reviews" USING btree ("school_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exam_passed_reviews" DROP CONSTRAINT IF EXISTS "exam_passed_reviews_school_id_exam_school_logos_id_fk";
  
  DROP INDEX IF EXISTS "exam_passed_reviews_school_idx";
  UPDATE "exam_passed_reviews" SET "school_name" = '' WHERE "school_name" IS NULL;
  UPDATE "exam_passed_reviews" SET "school_logo_slug" = '' WHERE "school_logo_slug" IS NULL;
  UPDATE "exam_passed_reviews" SET "school_logo_path" = '' WHERE "school_logo_path" IS NULL;
  ALTER TABLE "exam_passed_reviews" ALTER COLUMN "school_name" SET NOT NULL;
  ALTER TABLE "exam_passed_reviews" ALTER COLUMN "school_logo_slug" SET NOT NULL;
  ALTER TABLE "exam_passed_reviews" ALTER COLUMN "school_logo_path" SET NOT NULL;
  ALTER TABLE "exam_passed_reviews" DROP COLUMN "school_id";`)
}
