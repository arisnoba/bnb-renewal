import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "main_banners_linked_exam_review_items"
      ADD COLUMN IF NOT EXISTS "school_id" integer;

    CREATE TABLE IF NOT EXISTS "main_banners_linked_exam_review_items_reviews" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "review_id" integer
    );

    INSERT INTO "main_banners_linked_exam_review_items_reviews" (
      "_order",
      "_parent_id",
      "id",
      "review_id"
    )
    SELECT
      0,
      "id",
      "id" || '-review-1',
      "review_id"
    FROM "main_banners_linked_exam_review_items"
    WHERE "review_id" IS NOT NULL
    ON CONFLICT ("id") DO NOTHING;

    UPDATE "main_banners_linked_exam_review_items" AS "item"
    SET "school_id" = "review"."school_id"
    FROM "exam_passed_reviews" AS "review"
    WHERE "item"."review_id" = "review"."id"
      AND "item"."school_id" IS NULL;

    ALTER TABLE "main_banners_linked_exam_review_items"
      DROP COLUMN IF EXISTS "review_id";

    DO $$
    BEGIN
      ALTER TABLE "main_banners_linked_exam_review_items"
        ADD CONSTRAINT "main_banners_linked_exam_review_items_school_id_exam_school_logos_id_fk"
        FOREIGN KEY ("school_id")
        REFERENCES "public"."exam_school_logos"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "main_banners_linked_exam_review_items_reviews"
        ADD CONSTRAINT "main_banners_linked_exam_review_items_reviews_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."main_banners_linked_exam_review_items"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "main_banners_linked_exam_review_items_reviews"
        ADD CONSTRAINT "main_banners_linked_exam_review_items_reviews_review_id_exam_passed_reviews_id_fk"
        FOREIGN KEY ("review_id")
        REFERENCES "public"."exam_passed_reviews"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_school_idx"
      ON "main_banners_linked_exam_review_items" USING btree ("school_id");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_reviews_order_idx"
      ON "main_banners_linked_exam_review_items_reviews" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_reviews_parent_id_idx"
      ON "main_banners_linked_exam_review_items_reviews" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_reviews_review_idx"
      ON "main_banners_linked_exam_review_items_reviews" USING btree ("review_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "main_banners_linked_exam_review_items"
      ADD COLUMN IF NOT EXISTS "review_id" integer;

    UPDATE "main_banners_linked_exam_review_items" AS "item"
    SET "review_id" = "review"."review_id"
    FROM (
      SELECT DISTINCT ON ("_parent_id")
        "_parent_id",
        "review_id"
      FROM "main_banners_linked_exam_review_items_reviews"
      WHERE "review_id" IS NOT NULL
      ORDER BY "_parent_id", "_order"
    ) AS "review"
    WHERE "item"."id" = "review"."_parent_id";

    DO $$
    BEGIN
      ALTER TABLE "main_banners_linked_exam_review_items"
        ADD CONSTRAINT "main_banners_linked_exam_review_items_review_id_exam_passed_reviews_id_fk"
        FOREIGN KEY ("review_id")
        REFERENCES "public"."exam_passed_reviews"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_review_idx"
      ON "main_banners_linked_exam_review_items" USING btree ("review_id");

    ALTER TABLE "main_banners_linked_exam_review_items"
      DROP CONSTRAINT IF EXISTS "main_banners_linked_exam_review_items_school_id_exam_school_logos_id_fk";
    DROP INDEX IF EXISTS "main_banners_linked_exam_review_items_school_idx";
    ALTER TABLE "main_banners_linked_exam_review_items"
      DROP COLUMN IF EXISTS "school_id";

    DROP TABLE IF EXISTS "main_banners_linked_exam_review_items_reviews" CASCADE;
  `)
}
