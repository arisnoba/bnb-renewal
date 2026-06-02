import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "main_statistics" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "total_work_count" numeric DEFAULT 0,
      "monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      "monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      "monthly_minor_extra_listup_count" numeric DEFAULT 0,
      "monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "main_statistics_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_main_statistics_fk"
        FOREIGN KEY ("main_statistics_id")
        REFERENCES "public"."main_statistics"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "main_statistics_updated_at_idx"
      ON "main_statistics" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "main_statistics_created_at_idx"
      ON "main_statistics" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_main_statistics_id_idx"
      ON "payload_locked_documents_rels" USING btree ("main_statistics_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_main_statistics_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_main_statistics_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "main_statistics_id";

    DROP INDEX IF EXISTS "main_statistics_created_at_idx";
    DROP INDEX IF EXISTS "main_statistics_updated_at_idx";
    DROP TABLE IF EXISTS "main_statistics" CASCADE;
  `)
}
