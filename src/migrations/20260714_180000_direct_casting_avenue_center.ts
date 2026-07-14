import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_direct_castings_centers"
      ADD VALUE IF NOT EXISTS 'avenue';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "direct_castings_centers"
      ALTER COLUMN "value" TYPE text
      USING "value"::text;

    DROP TYPE "public"."enum_direct_castings_centers";

    CREATE TYPE "public"."enum_direct_castings_centers" AS ENUM(
      'art',
      'kids',
      'highteen'
    );

    ALTER TABLE "direct_castings_centers"
      ALTER COLUMN "value" TYPE "public"."enum_direct_castings_centers"
      USING "value"::"public"."enum_direct_castings_centers";
  `)
}
