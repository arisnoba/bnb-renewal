import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      ADD COLUMN IF NOT EXISTS "art_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "exam_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "kids_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "highteen_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "avenue_display_order" numeric;

    ALTER TABLE "_teachers_v"
      ADD COLUMN IF NOT EXISTS "version_art_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "version_exam_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "version_kids_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "version_highteen_display_order" numeric,
      ADD COLUMN IF NOT EXISTS "version_avenue_display_order" numeric;

    CREATE TEMP TABLE "teacher_center_order_seed" (
      "center" text NOT NULL,
      "position" integer NOT NULL,
      "name" text NOT NULL,
      PRIMARY KEY ("center", "position")
    ) ON COMMIT DROP;

    INSERT INTO "teacher_center_order_seed" ("center", "position", "name")
    VALUES
      ('art', 1, '송민지'),
      ('art', 2, '김민식'),
      ('art', 3, '장인섭'),
      ('art', 4, '송유현'),
      ('art', 5, '이달'),
      ('art', 6, '진예솔'),
      ('art', 7, '안창환'),
      ('art', 8, '송덕호'),
      ('art', 9, '박세준'),
      ('art', 10, '박정복'),
      ('art', 11, '박지홍'),
      ('art', 12, '여민구'),
      ('art', 13, '정유미'),
      ('art', 14, '유하나'),
      ('art', 15, '조재영'),
      ('art', 16, '박주환'),
      ('art', 17, '김한나'),
      ('art', 18, '오정택'),
      ('art', 19, '장찬호'),
      ('art', 20, '김한수'),
      ('art', 21, '박진감'),
      ('art', 22, '한서이'),
      ('art', 23, '변준호'),
      ('art', 24, '하태건'),
      ('art', 25, '오륭'),
      ('art', 26, '이운산'),
      ('art', 27, '강현우'),
      ('art', 28, '도건우'),
      ('art', 29, '유지연'),
      ('art', 30, '박정환'),
      ('art', 31, '김유진'),
      ('art', 32, '박찬우'),
      ('art', 33, '윤우중'),
      ('art', 34, '이은주'),
      ('art', 35, '장현동'),
      ('art', 36, '이재환'),
      ('art', 37, '장근영'),
      ('art', 38, '배보경'),
      ('art', 39, '하승아'),
      ('art', 40, '성건제'),
      ('art', 41, '손명구'),
      ('art', 42, '문현성'),
      ('art', 43, '김건보'),
      ('exam', 1, '김병현'),
      ('exam', 2, '김희원'),
      ('exam', 3, '문혜린'),
      ('exam', 4, '정태건'),
      ('exam', 5, '안서영'),
      ('exam', 6, '박범수'),
      ('exam', 7, '김홍교'),
      ('exam', 8, '정지영'),
      ('exam', 9, '김보은'),
      ('exam', 10, '인규식'),
      ('exam', 11, '곽지원'),
      ('exam', 12, '최은하'),
      ('exam', 13, '이다린'),
      ('exam', 14, '최시율'),
      ('exam', 15, '강민경'),
      ('exam', 16, '황윤정'),
      ('exam', 17, '신동해'),
      ('exam', 18, '양서윤'),
      ('exam', 19, '전범진'),
      ('exam', 20, '김민식'),
      ('exam', 21, '장인섭'),
      ('exam', 22, '변효준'),
      ('exam', 23, '김한수'),
      ('exam', 24, '김예슬'),
      ('exam', 25, '김예진'),
      ('exam', 26, '안서진'),
      ('exam', 27, '박소현'),
      ('exam', 28, '황해리'),
      ('exam', 29, '이연주'),
      ('highteen', 1, '김미지'),
      ('highteen', 2, '송민지'),
      ('highteen', 3, '김예슬'),
      ('highteen', 4, '안서진'),
      ('highteen', 5, '박소현'),
      ('highteen', 6, '김보은'),
      ('highteen', 7, '정태건'),
      ('highteen', 8, '신수항'),
      ('highteen', 9, '박지영'),
      ('highteen', 10, '황해리'),
      ('highteen', 11, '이재준'),
      ('highteen', 12, '오준혁'),
      ('highteen', 13, '김예진'),
      ('highteen', 14, '인규식'),
      ('highteen', 15, '강해리'),
      ('highteen', 16, '이다빛나'),
      ('highteen', 17, '이재혜'),
      ('highteen', 18, '조민경'),
      ('highteen', 19, '권미서'),
      ('highteen', 20, '양서윤'),
      ('highteen', 21, '전범진'),
      ('highteen', 22, '이현진'),
      ('highteen', 23, '이규학'),
      ('highteen', 24, '박하얀'),
      ('highteen', 25, '강동완'),
      ('kids', 1, '김미지'),
      ('kids', 2, '송민지'),
      ('kids', 3, '김현실'),
      ('kids', 4, '이연주'),
      ('kids', 5, '민지혜'),
      ('kids', 6, '이서아'),
      ('kids', 7, '문창준'),
      ('kids', 8, '안서영'),
      ('kids', 9, '이태라'),
      ('kids', 10, '이재혜'),
      ('kids', 11, '신수현'),
      ('kids', 12, '이서정'),
      ('kids', 13, '김민정'),
      ('kids', 14, '안서진'),
      ('kids', 15, '김자연'),
      ('kids', 16, '김예진'),
      ('kids', 17, '송예준'),
      ('kids', 18, '임지은'),
      ('kids', 19, '황해리'),
      ('kids', 20, '이현진');

    WITH "candidates" AS (
      SELECT
        "teachers"."id",
        "teachers"."display_order",
        "seed"."position",
        row_number() OVER (
          PARTITION BY "teachers"."name"
          ORDER BY ("teachers"."status"::text = 'published') DESC, "teachers"."id" DESC
        ) AS "name_rank"
      FROM "teachers"
      LEFT JOIN "teacher_center_order_seed" AS "seed"
        ON "seed"."center" = 'art'
        AND "seed"."name" = "teachers"."name"
      WHERE EXISTS (
        SELECT 1
        FROM "teachers_centers"
        WHERE "teachers_centers"."parent_id" = "teachers"."id"
          AND "teachers_centers"."value"::text IN ('art', 'all')
      )
    ),
    "ranked" AS (
      SELECT
        "id",
        row_number() OVER (
          ORDER BY
            CASE WHEN "position" IS NOT NULL AND "name_rank" = 1 THEN 0 ELSE 1 END,
            CASE WHEN "name_rank" = 1 THEN "position" END NULLS LAST,
            "display_order" NULLS LAST,
            "id"
        ) AS "display_order"
      FROM "candidates"
    )
    UPDATE "teachers"
    SET "art_display_order" = "ranked"."display_order"
    FROM "ranked"
    WHERE "teachers"."id" = "ranked"."id";

    WITH "candidates" AS (
      SELECT
        "teachers"."id",
        "teachers"."display_order",
        "seed"."position",
        row_number() OVER (
          PARTITION BY "teachers"."name"
          ORDER BY ("teachers"."status"::text = 'published') DESC, "teachers"."id" DESC
        ) AS "name_rank"
      FROM "teachers"
      LEFT JOIN "teacher_center_order_seed" AS "seed"
        ON "seed"."center" = 'exam'
        AND "seed"."name" = "teachers"."name"
      WHERE EXISTS (
        SELECT 1
        FROM "teachers_centers"
        WHERE "teachers_centers"."parent_id" = "teachers"."id"
          AND "teachers_centers"."value"::text IN ('exam', 'all')
      )
    ),
    "ranked" AS (
      SELECT
        "id",
        row_number() OVER (
          ORDER BY
            CASE WHEN "position" IS NOT NULL AND "name_rank" = 1 THEN 0 ELSE 1 END,
            CASE WHEN "name_rank" = 1 THEN "position" END NULLS LAST,
            "display_order" NULLS LAST,
            "id"
        ) AS "display_order"
      FROM "candidates"
    )
    UPDATE "teachers"
    SET "exam_display_order" = "ranked"."display_order"
    FROM "ranked"
    WHERE "teachers"."id" = "ranked"."id";

    WITH "candidates" AS (
      SELECT
        "teachers"."id",
        "teachers"."display_order",
        "seed"."position",
        row_number() OVER (
          PARTITION BY "teachers"."name"
          ORDER BY ("teachers"."status"::text = 'published') DESC, "teachers"."id" DESC
        ) AS "name_rank"
      FROM "teachers"
      LEFT JOIN "teacher_center_order_seed" AS "seed"
        ON "seed"."center" = 'kids'
        AND "seed"."name" = "teachers"."name"
      WHERE EXISTS (
        SELECT 1
        FROM "teachers_centers"
        WHERE "teachers_centers"."parent_id" = "teachers"."id"
          AND "teachers_centers"."value"::text IN ('kids', 'all')
      )
    ),
    "ranked" AS (
      SELECT
        "id",
        row_number() OVER (
          ORDER BY
            CASE WHEN "position" IS NOT NULL AND "name_rank" = 1 THEN 0 ELSE 1 END,
            CASE WHEN "name_rank" = 1 THEN "position" END NULLS LAST,
            "display_order" NULLS LAST,
            "id"
        ) AS "display_order"
      FROM "candidates"
    )
    UPDATE "teachers"
    SET "kids_display_order" = "ranked"."display_order"
    FROM "ranked"
    WHERE "teachers"."id" = "ranked"."id";

    WITH "candidates" AS (
      SELECT
        "teachers"."id",
        "teachers"."display_order",
        "seed"."position",
        row_number() OVER (
          PARTITION BY "teachers"."name"
          ORDER BY ("teachers"."status"::text = 'published') DESC, "teachers"."id" DESC
        ) AS "name_rank"
      FROM "teachers"
      LEFT JOIN "teacher_center_order_seed" AS "seed"
        ON "seed"."center" = 'highteen'
        AND "seed"."name" = "teachers"."name"
      WHERE EXISTS (
        SELECT 1
        FROM "teachers_centers"
        WHERE "teachers_centers"."parent_id" = "teachers"."id"
          AND "teachers_centers"."value"::text IN ('highteen', 'all')
      )
    ),
    "ranked" AS (
      SELECT
        "id",
        row_number() OVER (
          ORDER BY
            CASE WHEN "position" IS NOT NULL AND "name_rank" = 1 THEN 0 ELSE 1 END,
            CASE WHEN "name_rank" = 1 THEN "position" END NULLS LAST,
            "display_order" NULLS LAST,
            "id"
        ) AS "display_order"
      FROM "candidates"
    )
    UPDATE "teachers"
    SET "highteen_display_order" = "ranked"."display_order"
    FROM "ranked"
    WHERE "teachers"."id" = "ranked"."id";

    WITH "ranked" AS (
      SELECT
        "teachers"."id",
        row_number() OVER (
          ORDER BY "teachers"."display_order" NULLS LAST, "teachers"."id"
        ) AS "display_order"
      FROM "teachers"
      WHERE EXISTS (
        SELECT 1
        FROM "teachers_centers"
        WHERE "teachers_centers"."parent_id" = "teachers"."id"
          AND "teachers_centers"."value"::text IN ('avenue', 'all')
      )
    )
    UPDATE "teachers"
    SET "avenue_display_order" = "ranked"."display_order"
    FROM "ranked"
    WHERE "teachers"."id" = "ranked"."id";

    UPDATE "_teachers_v" AS "versions"
    SET
      "version_art_display_order" = "teachers"."art_display_order",
      "version_exam_display_order" = "teachers"."exam_display_order",
      "version_kids_display_order" = "teachers"."kids_display_order",
      "version_highteen_display_order" = "teachers"."highteen_display_order",
      "version_avenue_display_order" = "teachers"."avenue_display_order"
    FROM "teachers"
    WHERE "versions"."parent_id" = "teachers"."id";

    CREATE INDEX IF NOT EXISTS "teachers_art_display_order_idx"
      ON "teachers" USING btree ("art_display_order");
    CREATE INDEX IF NOT EXISTS "teachers_exam_display_order_idx"
      ON "teachers" USING btree ("exam_display_order");
    CREATE INDEX IF NOT EXISTS "teachers_kids_display_order_idx"
      ON "teachers" USING btree ("kids_display_order");
    CREATE INDEX IF NOT EXISTS "teachers_highteen_display_order_idx"
      ON "teachers" USING btree ("highteen_display_order");
    CREATE INDEX IF NOT EXISTS "teachers_avenue_display_order_idx"
      ON "teachers" USING btree ("avenue_display_order");

    CREATE INDEX IF NOT EXISTS "_teachers_v_version_art_display_order_idx"
      ON "_teachers_v" USING btree ("version_art_display_order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_exam_display_order_idx"
      ON "_teachers_v" USING btree ("version_exam_display_order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_kids_display_order_idx"
      ON "_teachers_v" USING btree ("version_kids_display_order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_highteen_display_order_idx"
      ON "_teachers_v" USING btree ("version_highteen_display_order");
    CREATE INDEX IF NOT EXISTS "_teachers_v_version_avenue_display_order_idx"
      ON "_teachers_v" USING btree ("version_avenue_display_order");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_teachers_v_version_avenue_display_order_idx";
    DROP INDEX IF EXISTS "_teachers_v_version_highteen_display_order_idx";
    DROP INDEX IF EXISTS "_teachers_v_version_kids_display_order_idx";
    DROP INDEX IF EXISTS "_teachers_v_version_exam_display_order_idx";
    DROP INDEX IF EXISTS "_teachers_v_version_art_display_order_idx";

    DROP INDEX IF EXISTS "teachers_avenue_display_order_idx";
    DROP INDEX IF EXISTS "teachers_highteen_display_order_idx";
    DROP INDEX IF EXISTS "teachers_kids_display_order_idx";
    DROP INDEX IF EXISTS "teachers_exam_display_order_idx";
    DROP INDEX IF EXISTS "teachers_art_display_order_idx";

    ALTER TABLE "_teachers_v"
      DROP COLUMN IF EXISTS "version_avenue_display_order",
      DROP COLUMN IF EXISTS "version_highteen_display_order",
      DROP COLUMN IF EXISTS "version_kids_display_order",
      DROP COLUMN IF EXISTS "version_exam_display_order",
      DROP COLUMN IF EXISTS "version_art_display_order";

    ALTER TABLE "teachers"
      DROP COLUMN IF EXISTS "avenue_display_order",
      DROP COLUMN IF EXISTS "highteen_display_order",
      DROP COLUMN IF EXISTS "kids_display_order",
      DROP COLUMN IF EXISTS "exam_display_order",
      DROP COLUMN IF EXISTS "art_display_order";
  `)
}
