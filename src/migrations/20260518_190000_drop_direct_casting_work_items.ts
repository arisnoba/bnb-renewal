import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "direct_castings_work_items_parent_id_idx";
    DROP INDEX IF EXISTS "direct_castings_work_items_order_idx";
    DROP TABLE IF EXISTS "direct_castings_work_items" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "direct_castings_work_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "year" varchar NOT NULL,
      "content" varchar NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "direct_castings_work_items"
        ADD CONSTRAINT "direct_castings_work_items_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."direct_castings"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "direct_castings_work_items_order_idx"
      ON "direct_castings_work_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "direct_castings_work_items_parent_id_idx"
      ON "direct_castings_work_items" USING btree ("_parent_id");
  `)
}
