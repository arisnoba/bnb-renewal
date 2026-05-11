import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_audition_schedules_event_type" AS ENUM (
        'shooting',
        'schedule',
        'audition'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "audition_schedules"
      ALTER COLUMN "event_type" SET DEFAULT 'schedule',
      ALTER COLUMN "event_type" TYPE "public"."enum_audition_schedules_event_type"
        USING "event_type"::"public"."enum_audition_schedules_event_type";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "audition_schedules"
      ALTER COLUMN "event_type" DROP DEFAULT,
      ALTER COLUMN "event_type" TYPE varchar
        USING "event_type"::varchar;

    DROP TYPE IF EXISTS "public"."enum_audition_schedules_event_type";
  `)
}
