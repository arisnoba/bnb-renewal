import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_inquiry_type" AS ENUM(
        'art',
        'admission',
        'highteen',
        'kids',
        'avenue',
        'partnership'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_center" AS ENUM(
        'art',
        'exam',
        'highteen',
        'kids',
        'avenue'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_gender" AS ENUM('male', 'female');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_preferred_time" AS ENUM(
        '오전',
        '오후',
        '저녁',
        '상담 후 조율'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_region" AS ENUM(
        '서울',
        '부산',
        '대구',
        '대전',
        '광주',
        '울산',
        '인천',
        '경기',
        '경남',
        '경북',
        '강원',
        '전남',
        '전북',
        '제주',
        '충남',
        '충북',
        '세종'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_occupation" AS ENUM('student', 'worker', 'other');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_school_level" AS ENUM('middle', 'high', 'other');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_acting_major" AS ENUM('major', 'nonMajor');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_has_training" AS ENUM('yes', 'no');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_has_performance" AS ENUM('yes', 'no');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_inflow_source" AS ENUM(
        '랜딩',
        '포털',
        'SNS',
        '네이버카페',
        '지인소개',
        'AI',
        '기타'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_inquiries_status" AS ENUM(
        'new',
        'inProgress',
        'completed',
        'spam'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "inquiries" (
      "id" serial PRIMARY KEY NOT NULL,
      "display_name" varchar,
      "inquiry_type" "enum_inquiries_inquiry_type" NOT NULL,
      "center" "enum_inquiries_center",
      "preferred_date" timestamp(3) with time zone,
      "preferred_time" "enum_inquiries_preferred_time",
      "applicant_name" varchar,
      "gender" "enum_inquiries_gender",
      "birth_date" timestamp(3) with time zone,
      "phone" varchar,
      "guardian_phone" varchar,
      "primary_phone" varchar,
      "region" "enum_inquiries_region",
      "occupation" "enum_inquiries_occupation",
      "school_level" "enum_inquiries_school_level",
      "acting_major" "enum_inquiries_acting_major",
      "has_training" "enum_inquiries_has_training",
      "has_performance" "enum_inquiries_has_performance",
      "inflow_source" "enum_inquiries_inflow_source",
      "inflow_source_other" varchar,
      "company_name" varchar,
      "company_website" varchar,
      "job_title" varchar,
      "contact_person_name" varchar,
      "partner_phone" varchar,
      "partner_email" varchar,
      "attachment_media_id" integer,
      "partnership_content" varchar,
      "privacy_consent" boolean NOT NULL,
      "status" "enum_inquiries_status" DEFAULT 'new' NOT NULL,
      "memo" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$
    BEGIN
      ALTER TABLE "inquiries"
        ADD CONSTRAINT "inquiries_attachment_media_id_media_id_fk"
        FOREIGN KEY ("attachment_media_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "inquiries_id" integer;

    DO $$
    BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk"
        FOREIGN KEY ("inquiries_id")
        REFERENCES "public"."inquiries"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "inquiries_inquiry_type_idx"
      ON "inquiries" USING btree ("inquiry_type");
    CREATE INDEX IF NOT EXISTS "inquiries_center_idx"
      ON "inquiries" USING btree ("center");
    CREATE INDEX IF NOT EXISTS "inquiries_primary_phone_idx"
      ON "inquiries" USING btree ("primary_phone");
    CREATE INDEX IF NOT EXISTS "inquiries_status_idx"
      ON "inquiries" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "inquiries_attachment_media_idx"
      ON "inquiries" USING btree ("attachment_media_id");
    CREATE INDEX IF NOT EXISTS "inquiries_updated_at_idx"
      ON "inquiries" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "inquiries_created_at_idx"
      ON "inquiries" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inquiries_id_idx"
      ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inquiries_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_inquiries_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "inquiries_id";

    DROP INDEX IF EXISTS "inquiries_created_at_idx";
    DROP INDEX IF EXISTS "inquiries_updated_at_idx";
    DROP INDEX IF EXISTS "inquiries_attachment_media_idx";
    DROP INDEX IF EXISTS "inquiries_status_idx";
    DROP INDEX IF EXISTS "inquiries_primary_phone_idx";
    DROP INDEX IF EXISTS "inquiries_center_idx";
    DROP INDEX IF EXISTS "inquiries_inquiry_type_idx";

    ALTER TABLE "inquiries"
      DROP CONSTRAINT IF EXISTS "inquiries_attachment_media_id_media_id_fk";
    DROP TABLE IF EXISTS "inquiries" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_inquiries_status";
    DROP TYPE IF EXISTS "public"."enum_inquiries_inflow_source";
    DROP TYPE IF EXISTS "public"."enum_inquiries_has_performance";
    DROP TYPE IF EXISTS "public"."enum_inquiries_has_training";
    DROP TYPE IF EXISTS "public"."enum_inquiries_acting_major";
    DROP TYPE IF EXISTS "public"."enum_inquiries_school_level";
    DROP TYPE IF EXISTS "public"."enum_inquiries_occupation";
    DROP TYPE IF EXISTS "public"."enum_inquiries_region";
    DROP TYPE IF EXISTS "public"."enum_inquiries_preferred_time";
    DROP TYPE IF EXISTS "public"."enum_inquiries_gender";
    DROP TYPE IF EXISTS "public"."enum_inquiries_center";
    DROP TYPE IF EXISTS "public"."enum_inquiries_inquiry_type";
  `)
}
