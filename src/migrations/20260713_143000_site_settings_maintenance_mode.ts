import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "site_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "maintenance_mode" boolean DEFAULT false,
      "maintenance_title" varchar DEFAULT '사이트 점검 중입니다.',
      "maintenance_message" varchar DEFAULT '더 안정적인 서비스 제공을 위해 잠시 점검을 진행하고 있습니다. 이용에 불편을 드려 죄송합니다.',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "site_settings_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_site_settings_fk"
        FOREIGN KEY ("site_settings_id")
        REFERENCES "public"."site_settings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "site_settings_updated_at_idx"
      ON "site_settings" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "site_settings_created_at_idx"
      ON "site_settings" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_site_settings_id_idx"
      ON "payload_locked_documents_rels" USING btree ("site_settings_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_site_settings_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_site_settings_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "site_settings_id";

    DROP INDEX IF EXISTS "site_settings_created_at_idx";
    DROP INDEX IF EXISTS "site_settings_updated_at_idx";
    DROP TABLE IF EXISTS "site_settings" CASCADE;
  `)
}
