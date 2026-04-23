import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'teachers'
          AND column_name = 'center'
          AND data_type <> 'ARRAY'
      ) THEN
        ALTER TABLE "teachers" ALTER COLUMN "center" DROP DEFAULT;
        ALTER TABLE "teachers"
          ALTER COLUMN "center" TYPE "public"."enum_teachers_center"[]
          USING ARRAY[COALESCE("center", 'unknown'::"public"."enum_teachers_center")];
        ALTER TABLE "teachers"
          ALTER COLUMN "center" SET DEFAULT ARRAY['unknown'::"public"."enum_teachers_center"];
        ALTER TABLE "teachers" ALTER COLUMN "center" SET NOT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'teachers'
          AND column_name = 'center'
          AND data_type = 'ARRAY'
      ) THEN
        ALTER TABLE "teachers" ALTER COLUMN "center" DROP DEFAULT;
        ALTER TABLE "teachers"
          ALTER COLUMN "center" TYPE "public"."enum_teachers_center"
          USING COALESCE("center"[1], 'unknown'::"public"."enum_teachers_center");
        ALTER TABLE "teachers"
          ALTER COLUMN "center" SET DEFAULT 'unknown'::"public"."enum_teachers_center";
        ALTER TABLE "teachers" ALTER COLUMN "center" SET NOT NULL;
      END IF;
    END $$;
  `)
}
