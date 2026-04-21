import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "teachers_center" (
      "id" serial PRIMARY KEY,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum_teachers_center"
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'teachers_center_parent_fk'
      ) THEN
        ALTER TABLE "teachers_center"
          ADD CONSTRAINT "teachers_center_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "teachers"("id") ON DELETE cascade;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "teachers_center_order_idx" ON "teachers_center" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "teachers_center_parent_idx" ON "teachers_center" USING btree ("parent_id");

    DO $$
    DECLARE
      center_data_type text;
    BEGIN
      SELECT data_type INTO center_data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'teachers'
        AND column_name = 'center';

      IF center_data_type = 'ARRAY' THEN
        INSERT INTO "teachers_center" ("order", "parent_id", "value")
        SELECT
          values_by_teacher."order" AS "order",
          values_by_teacher.id AS "parent_id",
          values_by_teacher.value AS "value"
        FROM (
          SELECT
            "teachers"."id",
            center_values.value,
            center_values.ordinality::integer AS "order"
          FROM "teachers"
          CROSS JOIN LATERAL unnest("teachers"."center") WITH ORDINALITY AS center_values(value, ordinality)
        ) AS values_by_teacher
        WHERE NOT EXISTS (
          SELECT 1
          FROM "teachers_center"
          WHERE "teachers_center"."parent_id" = values_by_teacher.id
            AND "teachers_center"."value" = values_by_teacher.value
        );

        ALTER TABLE "teachers" DROP COLUMN "center";
      ELSIF center_data_type = 'USER-DEFINED' THEN
        EXECUTE $copy_scalar$
          INSERT INTO "teachers_center" ("order", "parent_id", "value")
          SELECT 1, "teachers"."id", "teachers"."center"
          FROM "teachers"
          WHERE NOT EXISTS (
            SELECT 1
            FROM "teachers_center"
            WHERE "teachers_center"."parent_id" = "teachers"."id"
          )
        $copy_scalar$;

        ALTER TABLE "teachers" DROP COLUMN "center";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "teachers"
      ADD COLUMN IF NOT EXISTS "center" "public"."enum_teachers_center"[] DEFAULT ARRAY['unknown'::"public"."enum_teachers_center"] NOT NULL;

    UPDATE "teachers"
    SET "center" = COALESCE(
      (
        SELECT array_agg("teachers_center"."value" ORDER BY "teachers_center"."order")
        FROM "teachers_center"
        WHERE "teachers_center"."parent_id" = "teachers"."id"
      ),
      ARRAY['unknown'::"public"."enum_teachers_center"]
    );

    DROP TABLE IF EXISTS "teachers_center";
  `)
}
