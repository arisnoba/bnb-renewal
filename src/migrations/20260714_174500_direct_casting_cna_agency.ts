import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_direct_castings_company"
      ADD VALUE IF NOT EXISTS 'cna-agency';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "direct_castings_company"
      ALTER COLUMN "value" TYPE text
      USING "value"::text;

    DROP TYPE "public"."enum_direct_castings_company";

    CREATE TYPE "public"."enum_direct_castings_company" AS ENUM(
      'arko-lab',
      'imground',
      'bnb-casting',
      'bx-model-agency'
    );

    ALTER TABLE "direct_castings_company"
      ALTER COLUMN "value" TYPE "public"."enum_direct_castings_company"
      USING "value"::"public"."enum_direct_castings_company";
  `)
}
