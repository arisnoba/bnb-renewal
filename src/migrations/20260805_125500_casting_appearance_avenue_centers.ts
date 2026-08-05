import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TEMP TABLE "casting_appearance_avenue_targets" ON COMMIT DROP AS
    SELECT "casting_appearances"."id"
    FROM "casting_appearances"
    WHERE "casting_appearances"."display_status" = 'published'
      AND EXISTS (
        SELECT 1
        FROM "casting_appearances_centers"
        WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
          AND "casting_appearances_centers"."value"::text = 'art'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "casting_appearances_centers"
        WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
          AND "casting_appearances_centers"."value"::text IN ('avenue', 'all')
      );

    DO $$
    DECLARE
      target_count integer;
      inserted_count integer;
      remaining_gap integer;
    BEGIN
      SELECT count(*) INTO target_count
      FROM "casting_appearance_avenue_targets";

      IF target_count <> 153 THEN
        RAISE EXCEPTION '애비뉴센터 연결 대상이 예상한 153건과 다릅니다: %건', target_count;
      END IF;

      INSERT INTO "casting_appearances_centers" ("order", "parent_id", "value")
      SELECT
        COALESCE(
          (
            SELECT max("existing"."order")
            FROM "casting_appearances_centers" AS "existing"
            WHERE "existing"."parent_id" = "targets"."id"
          ),
          -1
        ) + 1,
        "targets"."id",
        'avenue'::"enum_casting_appearances_centers"
      FROM "casting_appearance_avenue_targets" AS "targets"
      ORDER BY "targets"."id";

      GET DIAGNOSTICS inserted_count = ROW_COUNT;

      IF inserted_count <> target_count THEN
        RAISE EXCEPTION '애비뉴센터 연결 추가 건수가 대상 건수와 다릅니다: 대상 %, 추가 %', target_count, inserted_count;
      END IF;

      UPDATE "casting_appearances"
      SET "updated_at" = now()
      WHERE "id" IN (
        SELECT "id"
        FROM "casting_appearance_avenue_targets"
      );

      SELECT count(*) INTO remaining_gap
      FROM "casting_appearances"
      WHERE "casting_appearances"."display_status" = 'published'
        AND EXISTS (
          SELECT 1
          FROM "casting_appearances_centers"
          WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
            AND "casting_appearances_centers"."value"::text = 'art'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "casting_appearances_centers"
          WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
            AND "casting_appearances_centers"."value"::text IN ('avenue', 'all')
        );

      IF remaining_gap <> 0 THEN
        RAISE EXCEPTION '마이그레이션 후 애비뉴센터 미연결 문서가 남아 있습니다: %건', remaining_gap;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TEMP TABLE "casting_appearance_avenue_rollback_targets" ON COMMIT DROP AS
    SELECT "casting_appearances"."id"
    FROM "casting_appearances"
    WHERE "casting_appearances"."display_status" = 'published'
      AND EXISTS (
        SELECT 1
        FROM "casting_appearances_centers"
        WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
          AND "casting_appearances_centers"."value"::text = 'art'
      )
      AND EXISTS (
        SELECT 1
        FROM "casting_appearances_centers"
        WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
          AND "casting_appearances_centers"."value"::text = 'avenue'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "casting_appearances_centers"
        WHERE "casting_appearances_centers"."parent_id" = "casting_appearances"."id"
          AND "casting_appearances_centers"."value"::text NOT IN ('art', 'avenue')
      );

    DO $$
    DECLARE
      target_count integer;
      deleted_count integer;
    BEGIN
      SELECT count(*) INTO target_count
      FROM "casting_appearance_avenue_rollback_targets";

      IF target_count <> 153 THEN
        RAISE EXCEPTION '애비뉴센터 연결 롤백 대상이 예상한 153건과 다릅니다: %건', target_count;
      END IF;

      DELETE FROM "casting_appearances_centers"
      WHERE "value"::text = 'avenue'
        AND "parent_id" IN (
          SELECT "id"
          FROM "casting_appearance_avenue_rollback_targets"
        );

      GET DIAGNOSTICS deleted_count = ROW_COUNT;

      IF deleted_count <> target_count THEN
        RAISE EXCEPTION '애비뉴센터 연결 삭제 건수가 대상 건수와 다릅니다: 대상 %, 삭제 %', target_count, deleted_count;
      END IF;

      UPDATE "casting_appearances"
      SET "updated_at" = now()
      WHERE "id" IN (
        SELECT "id"
        FROM "casting_appearance_avenue_rollback_targets"
      );
    END $$;
  `)
}
