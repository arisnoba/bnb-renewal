import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "casting_directors"
    SET "company" = 'ARKO LAB'
    WHERE "company" IN ('아르코랩', 'ARKO', '유캐스팅', 'U CASTING');

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_casting_directors_company" AS ENUM (
        'BNB Casting',
        'CNA Agency',
        'ARKO LAB',
        'IMGround',
        'BX Model Agency',
        '라인업'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "casting_directors"
      ALTER COLUMN "company" TYPE "public"."enum_casting_directors_company"
      USING "company"::"public"."enum_casting_directors_company";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "casting_directors"
      ALTER COLUMN "company" TYPE varchar
      USING "company"::varchar;

    DROP TYPE IF EXISTS "public"."enum_casting_directors_company";
  `)
}
