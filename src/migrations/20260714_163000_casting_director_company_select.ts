import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "casting_directors"
    WHERE "company" NOT IN (
      'BNB Casting',
      'CNA Agency',
      'ARKO LAB',
      'IMGround',
      'BX Model Agency'
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_casting_directors_company" AS ENUM (
        'BNB Casting',
        'CNA Agency',
        'ARKO LAB',
        'IMGround',
        'BX Model Agency'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

  `)

  await db.execute(sql`
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
  `)

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_casting_directors_company";
  `)
}
