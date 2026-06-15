import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums"
      ADD COLUMN IF NOT EXISTS "classroom_id" integer;

    ALTER TABLE "curriculums"
      ADD COLUMN IF NOT EXISTS "tuition_fee" numeric;

    INSERT INTO "classrooms" ("title", "created_at", "updated_at")
    SELECT "title", now(), now()
    FROM (
      VALUES
        ('목업 강의실 A'),
        ('목업 강의실 B'),
        ('목업 강의실 C'),
        ('목업 강의실 D')
    ) AS "mock_classrooms"("title")
    WHERE NOT EXISTS (SELECT 1 FROM "classrooms");

    WITH mock_classrooms AS (
      SELECT
        "id",
        row_number() OVER (ORDER BY "id") AS "classroom_order"
      FROM "classrooms"
      WHERE "title" IN ('목업 강의실 A', '목업 강의실 B', '목업 강의실 C', '목업 강의실 D')
    ),
    media_candidates AS (
      SELECT
        "id",
        row_number() OVER (ORDER BY "id") AS "media_order"
      FROM "media"
      LIMIT 8
    )
    INSERT INTO "classrooms_rels" ("order", "parent_id", "path", "media_id")
    SELECT
      ((media_candidates."media_order" - 1) % 2) + 1,
      mock_classrooms."id",
      'photos',
      media_candidates."id"
    FROM mock_classrooms
    JOIN media_candidates
      ON ((media_candidates."media_order" - 1) / 2) + 1 = mock_classrooms."classroom_order"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "classrooms_rels"
      WHERE "classrooms_rels"."parent_id" = mock_classrooms."id"
        AND "classrooms_rels"."path" = 'photos'
    );

    WITH ordered_classrooms AS (
      SELECT
        "id",
        row_number() OVER (ORDER BY "id") AS "classroom_order",
        count(*) OVER () AS "classroom_count"
      FROM "classrooms"
    ),
    ordered_curriculums AS (
      SELECT
        "id",
        row_number() OVER (ORDER BY "id") AS "curriculum_order"
      FROM "curriculums"
    )
    UPDATE "curriculums"
    SET "classroom_id" = ordered_classrooms."id"
    FROM ordered_curriculums
    JOIN ordered_classrooms
      ON ((ordered_curriculums."curriculum_order" - 1) % ordered_classrooms."classroom_count") + 1
        = ordered_classrooms."classroom_order"
    WHERE "curriculums"."id" = ordered_curriculums."id"
      AND "curriculums"."classroom_id" IS NULL;

    UPDATE "curriculums"
    SET "tuition_fee" = CASE abs("id") % 6
      WHEN 0 THEN 380000
      WHEN 1 THEN 420000
      WHEN 2 THEN 480000
      WHEN 3 THEN 550000
      WHEN 4 THEN 620000
      ELSE 700000
    END
    WHERE "tuition_fee" IS NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'curriculums_classroom_id_classrooms_id_fk'
      ) THEN
        ALTER TABLE "curriculums"
          ADD CONSTRAINT "curriculums_classroom_id_classrooms_id_fk"
          FOREIGN KEY ("classroom_id")
          REFERENCES "public"."classrooms"("id")
          ON DELETE restrict
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "curriculums_classroom_idx"
      ON "curriculums" USING btree ("classroom_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "curriculums"
      DROP CONSTRAINT IF EXISTS "curriculums_classroom_id_classrooms_id_fk";

    DROP INDEX IF EXISTS "curriculums_classroom_idx";

    ALTER TABLE "curriculums"
      DROP COLUMN IF EXISTS "classroom_id";

    ALTER TABLE "curriculums"
      DROP COLUMN IF EXISTS "tuition_fee";
  `)
}
