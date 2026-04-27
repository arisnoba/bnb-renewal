import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "profiles_career_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "content" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_career_items_parent_id_fk'
      ) THEN
        ALTER TABLE "profiles_career_items"
        ADD CONSTRAINT "profiles_career_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "profiles_career_items_order_idx"
      ON "profiles_career_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "profiles_career_items_parent_id_idx"
      ON "profiles_career_items" USING btree ("_parent_id");

    ALTER TABLE "profiles"
      DROP COLUMN IF EXISTS "body_html";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles"
      ADD COLUMN IF NOT EXISTS "body_html" varchar NOT NULL DEFAULT '-';

    DROP TABLE IF EXISTS "profiles_career_items" CASCADE;
  `)
}
