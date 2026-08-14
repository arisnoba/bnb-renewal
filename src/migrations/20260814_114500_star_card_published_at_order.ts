import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const createPublishedAtMapping = sql`
  CREATE TEMP TABLE "star_card_published_at_mapping" (
    "id" integer PRIMARY KEY,
    "display_order" numeric NOT NULL,
    "before_published_at" timestamp(3) with time zone NOT NULL,
    "after_published_at" timestamp(3) with time zone NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO "star_card_published_at_mapping" (
    "id",
    "display_order",
    "before_published_at",
    "after_published_at"
  ) VALUES
    (4, 1, '2026-08-10T12:00:55.000Z', '2023-04-10T15:43:55.000Z'),
    (9, 2, '2023-07-20T15:43:55.000Z', '2023-04-15T14:14:58.000Z'),
    (14, 3, '2023-07-17T15:43:55.000Z', '2023-04-25T15:43:55.000Z'),
    (16, 4, '2023-07-14T15:43:55.000Z', '2023-05-01T15:43:55.000Z'),
    (20, 5, '2023-07-10T15:43:55.000Z', '2023-05-05T15:43:55.000Z'),
    (39, 6, '2026-05-26T10:55:33.995Z', '2023-05-10T15:43:55.000Z'),
    (13, 7, '2023-07-05T15:43:55.000Z', '2023-05-15T15:43:55.000Z'),
    (15, 8, '2023-07-01T15:43:55.000Z', '2023-05-20T15:43:55.000Z'),
    (29, 9, '2023-06-25T15:43:55.000Z', '2023-05-25T15:43:55.000Z'),
    (17, 10, '2023-06-20T15:43:55.000Z', '2023-05-26T15:43:55.000Z'),
    (32, 11, '2023-06-18T13:55:50.000Z', '2023-06-01T15:43:55.000Z'),
    (40, 12, '2026-05-26T10:55:36.133Z', '2023-06-05T15:43:55.000Z'),
    (28, 13, '2023-06-15T15:43:55.000Z', '2023-06-10T15:43:55.000Z'),
    (34, 14, '2023-06-14T10:47:06.000Z', '2023-06-14T10:47:06.000Z'),
    (2, 15, '2023-06-10T15:43:55.000Z', '2023-06-15T15:43:55.000Z'),
    (23, 16, '2023-06-05T15:43:55.000Z', '2023-06-18T13:55:50.000Z'),
    (22, 17, '2023-06-01T15:43:55.000Z', '2023-06-20T15:43:55.000Z'),
    (30, 18, '2023-05-26T15:43:55.000Z', '2023-06-25T15:43:55.000Z'),
    (8, 19, '2023-05-25T15:43:55.000Z', '2023-07-01T15:43:55.000Z'),
    (24, 20, '2023-05-20T15:43:55.000Z', '2023-07-05T15:43:55.000Z'),
    (21, 21, '2023-05-15T15:43:55.000Z', '2023-07-10T15:43:55.000Z'),
    (11, 22, '2023-05-10T15:43:55.000Z', '2023-07-14T15:43:55.000Z'),
    (27, 23, '2023-05-05T15:43:55.000Z', '2023-07-17T15:43:55.000Z'),
    (18, 24, '2023-05-01T15:43:55.000Z', '2023-07-20T15:43:55.000Z'),
    (19, 25, '2023-04-25T15:43:55.000Z', '2026-05-26T10:55:33.995Z'),
    (33, 26, '2023-04-15T14:14:58.000Z', '2026-05-26T10:55:36.133Z'),
    (1, 27, '2023-04-10T15:43:55.000Z', '2026-08-10T12:00:55.000Z');
`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ${createPublishedAtMapping}

    DO $$
    DECLARE
      mismatch_count integer;
      invalid_order_count integer;
    BEGIN
      SELECT count(*) INTO mismatch_count
      FROM "star_card_published_at_mapping" AS "mapping"
      LEFT JOIN "star_cards" AS "star_card" ON "star_card"."id" = "mapping"."id"
      WHERE "star_card"."id" IS NULL
        OR "star_card"."display_order" IS DISTINCT FROM "mapping"."display_order"
        OR "star_card"."published_at" IS DISTINCT FROM "mapping"."before_published_at";

      IF mismatch_count <> 0 THEN
        RAISE EXCEPTION '스타카드 기존 정렬 또는 발행일이 기준 스냅샷과 다릅니다: %건', mismatch_count;
      END IF;

      UPDATE "star_cards" AS "star_card"
      SET "published_at" = "mapping"."after_published_at"
      FROM "star_card_published_at_mapping" AS "mapping"
      WHERE "star_card"."id" = "mapping"."id";

      SELECT count(*) INTO invalid_order_count
      FROM (
        SELECT
          "star_card"."published_at",
          lag("star_card"."published_at") OVER (
            ORDER BY "mapping"."display_order", "mapping"."id"
          ) AS "previous_published_at"
        FROM "star_card_published_at_mapping" AS "mapping"
        INNER JOIN "star_cards" AS "star_card" ON "star_card"."id" = "mapping"."id"
      ) AS "ordered"
      WHERE "previous_published_at" IS NOT NULL
        AND "published_at" <= "previous_published_at";

      IF invalid_order_count <> 0 THEN
        RAISE EXCEPTION '스타카드 발행일 오름차순 검증에 실패했습니다: %건', invalid_order_count;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ${createPublishedAtMapping}

    DO $$
    DECLARE
      mismatch_count integer;
    BEGIN
      SELECT count(*) INTO mismatch_count
      FROM "star_card_published_at_mapping" AS "mapping"
      LEFT JOIN "star_cards" AS "star_card" ON "star_card"."id" = "mapping"."id"
      WHERE "star_card"."id" IS NULL
        OR "star_card"."published_at" IS DISTINCT FROM "mapping"."after_published_at";

      IF mismatch_count <> 0 THEN
        RAISE EXCEPTION '스타카드 롤백 대상 발행일이 마이그레이션 결과와 다릅니다: %건', mismatch_count;
      END IF;

      UPDATE "star_cards" AS "star_card"
      SET "published_at" = "mapping"."before_published_at"
      FROM "star_card_published_at_mapping" AS "mapping"
      WHERE "star_card"."id" = "mapping"."id";
    END $$;
  `)
}
