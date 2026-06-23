import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "direct_castings"
      ALTER COLUMN "company" SET DATA TYPE text
      USING "company"::text;

    UPDATE "direct_castings"
    SET "company" = 'arko-lab'
    WHERE "company" = 'ucasting';

    DROP TYPE IF EXISTS "public"."enum_direct_castings_company";

    CREATE TYPE "public"."enum_direct_castings_company" AS ENUM(
      'arko-lab',
      'imground',
      'bnb-casting',
      'bx-model-agency'
    );

    ALTER TABLE "direct_castings"
      ALTER COLUMN "company" SET DATA TYPE "public"."enum_direct_castings_company"
      USING "company"::"public"."enum_direct_castings_company";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "direct_castings"
      ALTER COLUMN "company" SET DATA TYPE text
      USING "company"::text;

    UPDATE "direct_castings"
    SET "company" = 'ucasting'
    WHERE "company" = 'arko-lab';

    DROP TYPE IF EXISTS "public"."enum_direct_castings_company";

    CREATE TYPE "public"."enum_direct_castings_company" AS ENUM(
      'ucasting',
      'imground',
      'bnb-casting',
      'bx-model-agency'
    );

    ALTER TABLE "direct_castings"
      ALTER COLUMN "company" SET DATA TYPE "public"."enum_direct_castings_company"
      USING "company"::"public"."enum_direct_castings_company";
  `)
}
