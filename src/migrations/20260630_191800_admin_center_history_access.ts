import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_main_statistics_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "version_art_total_work_count" numeric DEFAULT 0,
      "version_art_monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      "version_art_monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      "version_art_monthly_minor_extra_listup_count" numeric DEFAULT 0,
      "version_art_monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0,
      "version_exam_total_work_count" numeric DEFAULT 0,
      "version_exam_monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      "version_exam_monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      "version_exam_monthly_minor_extra_listup_count" numeric DEFAULT 0,
      "version_exam_monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0,
      "version_kids_total_work_count" numeric DEFAULT 0,
      "version_kids_monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      "version_kids_monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      "version_kids_monthly_minor_extra_listup_count" numeric DEFAULT 0,
      "version_kids_monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0,
      "version_highteen_total_work_count" numeric DEFAULT 0,
      "version_highteen_monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      "version_highteen_monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      "version_highteen_monthly_minor_extra_listup_count" numeric DEFAULT 0,
      "version_highteen_monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0,
      "version_avenue_total_work_count" numeric DEFAULT 0,
      "version_avenue_monthly_lead_supporting_audition_count" numeric DEFAULT 0,
      "version_avenue_monthly_lead_supporting_director_meeting_count" numeric DEFAULT 0,
      "version_avenue_monthly_minor_extra_listup_count" numeric DEFAULT 0,
      "version_avenue_monthly_minor_extra_casting_confirmed_count" numeric DEFAULT 0,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_footer_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_footer_v_version_center_infos" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "center_name" varchar NOT NULL,
      "url" varchar NOT NULL,
      "operation_registration_number" varchar NOT NULL,
      "address" varchar NOT NULL,
      "youtube_url" varchar,
      "naver_blog_url" varchar,
      "instagram_url" varchar,
      "_uuid" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_footer_v_version_center_infos_parent_id_fk'
      ) THEN
        ALTER TABLE "_footer_v_version_center_infos"
        ADD CONSTRAINT "_footer_v_version_center_infos_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_footer_v"("id")
        ON DELETE cascade
        ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "_main_statistics_v_created_at_idx"
      ON "_main_statistics_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_main_statistics_v_updated_at_idx"
      ON "_main_statistics_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_footer_v_created_at_idx"
      ON "_footer_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_footer_v_updated_at_idx"
      ON "_footer_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_footer_v_version_center_infos_order_idx"
      ON "_footer_v_version_center_infos" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_footer_v_version_center_infos_parent_id_idx"
      ON "_footer_v_version_center_infos" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_footer_v_version_center_infos" CASCADE;
    DROP TABLE IF EXISTS "_footer_v" CASCADE;
    DROP TABLE IF EXISTS "_main_statistics_v" CASCADE;
  `)
}
