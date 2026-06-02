import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "main_banners_linked_profile_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "profile_id" integer,
      "role_label" varchar
    );

    CREATE TABLE IF NOT EXISTS "main_banners_linked_exam_review_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "review_id" integer,
      "result_label" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'main_banners_linked_profile_items_parent_id_fk'
      ) THEN
        ALTER TABLE "main_banners_linked_profile_items"
          ADD CONSTRAINT "main_banners_linked_profile_items_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."main_banners"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'main_banners_linked_profile_items_profile_id_profiles_id_fk'
      ) THEN
        ALTER TABLE "main_banners_linked_profile_items"
          ADD CONSTRAINT "main_banners_linked_profile_items_profile_id_profiles_id_fk"
          FOREIGN KEY ("profile_id")
          REFERENCES "public"."profiles"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'main_banners_linked_exam_review_items_parent_id_fk'
      ) THEN
        ALTER TABLE "main_banners_linked_exam_review_items"
          ADD CONSTRAINT "main_banners_linked_exam_review_items_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."main_banners"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'main_banners_linked_exam_review_items_review_id_exam_passed_reviews_id_fk'
      ) THEN
        ALTER TABLE "main_banners_linked_exam_review_items"
          ADD CONSTRAINT "main_banners_linked_exam_review_items_review_id_exam_passed_reviews_id_fk"
          FOREIGN KEY ("review_id")
          REFERENCES "public"."exam_passed_reviews"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "main_banners_linked_profile_items_order_idx"
      ON "main_banners_linked_profile_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_profile_items_parent_id_idx"
      ON "main_banners_linked_profile_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_profile_items_profile_idx"
      ON "main_banners_linked_profile_items" USING btree ("profile_id");

    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_order_idx"
      ON "main_banners_linked_exam_review_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_parent_id_idx"
      ON "main_banners_linked_exam_review_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "main_banners_linked_exam_review_items_review_idx"
      ON "main_banners_linked_exam_review_items" USING btree ("review_id");

    DROP TABLE IF EXISTS "main_banners_rels" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "main_banners_linked_exam_review_items" CASCADE;
    DROP TABLE IF EXISTS "main_banners_linked_profile_items" CASCADE;

    CREATE TABLE IF NOT EXISTS "main_banners_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "profiles_id" integer,
      "exam_passed_reviews_id" integer
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_rels_parent_fk'
      ) THEN
        ALTER TABLE "main_banners_rels"
          ADD CONSTRAINT "main_banners_rels_parent_fk"
          FOREIGN KEY ("parent_id")
          REFERENCES "public"."main_banners"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_rels_profiles_fk'
      ) THEN
        ALTER TABLE "main_banners_rels"
          ADD CONSTRAINT "main_banners_rels_profiles_fk"
          FOREIGN KEY ("profiles_id")
          REFERENCES "public"."profiles"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'main_banners_rels_exam_passed_reviews_fk'
      ) THEN
        ALTER TABLE "main_banners_rels"
          ADD CONSTRAINT "main_banners_rels_exam_passed_reviews_fk"
          FOREIGN KEY ("exam_passed_reviews_id")
          REFERENCES "public"."exam_passed_reviews"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "main_banners_rels_order_idx"
      ON "main_banners_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_parent_idx"
      ON "main_banners_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_path_idx"
      ON "main_banners_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_profiles_id_idx"
      ON "main_banners_rels" USING btree ("profiles_id");
    CREATE INDEX IF NOT EXISTS "main_banners_rels_exam_passed_reviews_id_idx"
      ON "main_banners_rels" USING btree ("exam_passed_reviews_id");
  `)
}
