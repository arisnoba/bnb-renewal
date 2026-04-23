import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('master', 'admin', 'manager');
  CREATE TYPE "public"."enum_users_center" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'unknown');
  CREATE TYPE "public"."enum_teachers_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_teachers_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_news_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_news_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_profiles_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_profiles_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_agencies_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_artist_press_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_artist_press_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_audition_schedules_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_audition_schedules_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_casting_directors_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_casting_directors_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_casting_appearances_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_casting_appearances_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_screen_appearances_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_screen_appearances_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_exam_passed_reviews_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_exam_passed_reviews_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_exam_passed_videos_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_exam_passed_videos_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_exam_results_centers" AS ENUM('art', 'exam', 'kids', 'highteen', 'avenue', 'all', 'unknown');
  CREATE TYPE "public"."enum_exam_results_display_status" AS ENUM('draft', 'published', 'archived');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'manager' NOT NULL,
  	"permission_level" numeric DEFAULT 50 NOT NULL,
  	"center" "enum_users_center" DEFAULT 'art' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "teachers_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_teachers_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "teachers_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "teachers_representative_works" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"poster_path" varchar,
  	"description" varchar,
  	"display_order" numeric DEFAULT 0
  );
  
  CREATE TABLE "teachers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"summary" varchar,
  	"bio_html" varchar NOT NULL,
  	"profile_image_path" varchar,
  	"photo_image1" varchar,
  	"photo_image2" varchar,
  	"photo_image3" varchar,
  	"photo_image4" varchar,
  	"photo_image5" varchar,
  	"photo_image6" varchar,
  	"display_order" numeric DEFAULT 0,
  	"status" "enum_teachers_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "curriculums" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" varchar,
  	"teacher_name" varchar,
  	"resolved_teacher_id" numeric,
  	"resolved_teacher_slug" varchar,
  	"subject" varchar,
  	"title_raw" varchar,
  	"content_raw" varchar,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "news_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_news_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"category" varchar,
  	"body_html" varchar NOT NULL,
  	"excerpt" varchar,
  	"thumbnail_path" varchar,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_news_display_status" DEFAULT 'published' NOT NULL,
  	"view_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "profiles_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_profiles_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"filter" varchar,
  	"english_name" varchar,
  	"height" varchar,
  	"weight" varchar,
  	"body_html" varchar NOT NULL,
  	"profile_image_path" varchar,
  	"excerpt" varchar,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_profiles_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "agencies_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_agencies_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "agencies_actors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generation" varchar,
  	"profile_image_path" varchar
  );
  
  CREATE TABLE "agencies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar,
  	"subject" varchar NOT NULL,
  	"summary" varchar,
  	"body_html" varchar,
  	"profile_image_path" varchar,
  	"display_order" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artist_press_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_artist_press_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "artist_press" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"actor_name" varchar NOT NULL,
  	"generation" varchar NOT NULL,
  	"body_html" varchar,
  	"agency_logo_path" varchar,
  	"thumbnail_path" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_artist_press_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audition_schedules_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_audition_schedules_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "audition_schedules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"dedupe_key" varchar NOT NULL,
  	"event_type" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body_html" varchar,
  	"schedule_start_date" timestamp(3) with time zone NOT NULL,
  	"schedule_end_date" timestamp(3) with time zone NOT NULL,
  	"schedule_start_raw" varchar NOT NULL,
  	"schedule_end_raw" varchar NOT NULL,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_audition_schedules_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "casting_directors_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_casting_directors_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "casting_directors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"person_name" varchar NOT NULL,
  	"company" varchar NOT NULL,
  	"category" varchar,
  	"body_html" varchar,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_casting_directors_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "casting_appearances_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_casting_appearances_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "casting_appearances" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body_html" varchar,
  	"broadcaster" varchar,
  	"production_company" varchar,
  	"directors" varchar,
  	"writers" varchar,
  	"casting_status" varchar,
  	"casting_company" varchar,
  	"thumbnail_path" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_casting_appearances_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "screen_appearances_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_screen_appearances_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "screen_appearances" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"appearance_type" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body_html" varchar,
  	"performer_name" varchar NOT NULL,
  	"class_name" varchar,
  	"project_title" varchar,
  	"role_name" varchar,
  	"air_date_label" varchar,
  	"profile_image_path" varchar,
  	"thumbnail_path" varchar,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_screen_appearances_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exam_passed_reviews_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_exam_passed_reviews_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "exam_passed_reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"school_name" varchar NOT NULL,
  	"school_logo_slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body_html" varchar,
  	"school_logo_path" varchar NOT NULL,
  	"student_image_path" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_exam_passed_reviews_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exam_passed_videos_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_exam_passed_videos_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "exam_passed_videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body_html" varchar,
  	"youtube_code" varchar NOT NULL,
  	"youtube_url" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_exam_passed_videos_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exam_results_centers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_exam_results_centers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "exam_results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_db" varchar NOT NULL,
  	"source_table" varchar NOT NULL,
  	"source_id" numeric NOT NULL,
  	"slug" varchar NOT NULL,
  	"result_type" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body_html" varchar,
  	"thumbnail_path" varchar,
  	"thumbnail_source" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"display_status" "enum_exam_results_display_status" DEFAULT 'published' NOT NULL,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exam_school_logos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"school_name" varchar NOT NULL,
  	"school_slug" varchar NOT NULL,
  	"logo_path" varchar NOT NULL,
  	"logo_original_name" varchar,
  	"logo_file" varchar NOT NULL,
  	"logo_width" numeric,
  	"logo_height" numeric,
  	"review_count" numeric DEFAULT 0,
  	"legacy_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"teachers_id" integer,
  	"curriculums_id" integer,
  	"news_id" integer,
  	"profiles_id" integer,
  	"agencies_id" integer,
  	"artist_press_id" integer,
  	"audition_schedules_id" integer,
  	"casting_directors_id" integer,
  	"casting_appearances_id" integer,
  	"screen_appearances_id" integer,
  	"exam_passed_reviews_id" integer,
  	"exam_passed_videos_id" integer,
  	"exam_results_id" integer,
  	"exam_school_logos_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "teachers_centers" ADD CONSTRAINT "teachers_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "teachers_gallery" ADD CONSTRAINT "teachers_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "teachers_representative_works" ADD CONSTRAINT "teachers_representative_works_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_centers" ADD CONSTRAINT "news_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_centers" ADD CONSTRAINT "profiles_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agencies_centers" ADD CONSTRAINT "agencies_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agencies_actors" ADD CONSTRAINT "agencies_actors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artist_press_centers" ADD CONSTRAINT "artist_press_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artist_press"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audition_schedules_centers" ADD CONSTRAINT "audition_schedules_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."audition_schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casting_directors_centers" ADD CONSTRAINT "casting_directors_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."casting_directors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casting_appearances_centers" ADD CONSTRAINT "casting_appearances_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."casting_appearances"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "screen_appearances_centers" ADD CONSTRAINT "screen_appearances_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."screen_appearances"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exam_passed_reviews_centers" ADD CONSTRAINT "exam_passed_reviews_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exam_passed_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exam_passed_videos_centers" ADD CONSTRAINT "exam_passed_videos_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exam_passed_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exam_results_centers" ADD CONSTRAINT "exam_results_centers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exam_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teachers_fk" FOREIGN KEY ("teachers_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_curriculums_fk" FOREIGN KEY ("curriculums_id") REFERENCES "public"."curriculums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agencies_fk" FOREIGN KEY ("agencies_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artist_press_fk" FOREIGN KEY ("artist_press_id") REFERENCES "public"."artist_press"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audition_schedules_fk" FOREIGN KEY ("audition_schedules_id") REFERENCES "public"."audition_schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_casting_directors_fk" FOREIGN KEY ("casting_directors_id") REFERENCES "public"."casting_directors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_casting_appearances_fk" FOREIGN KEY ("casting_appearances_id") REFERENCES "public"."casting_appearances"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_screen_appearances_fk" FOREIGN KEY ("screen_appearances_id") REFERENCES "public"."screen_appearances"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_passed_reviews_fk" FOREIGN KEY ("exam_passed_reviews_id") REFERENCES "public"."exam_passed_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_passed_videos_fk" FOREIGN KEY ("exam_passed_videos_id") REFERENCES "public"."exam_passed_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_results_fk" FOREIGN KEY ("exam_results_id") REFERENCES "public"."exam_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_school_logos_fk" FOREIGN KEY ("exam_school_logos_id") REFERENCES "public"."exam_school_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "teachers_centers_order_idx" ON "teachers_centers" USING btree ("order");
  CREATE INDEX "teachers_centers_parent_idx" ON "teachers_centers" USING btree ("parent_id");
  CREATE INDEX "teachers_gallery_order_idx" ON "teachers_gallery" USING btree ("_order");
  CREATE INDEX "teachers_gallery_parent_id_idx" ON "teachers_gallery" USING btree ("_parent_id");
  CREATE INDEX "teachers_representative_works_order_idx" ON "teachers_representative_works" USING btree ("_order");
  CREATE INDEX "teachers_representative_works_parent_id_idx" ON "teachers_representative_works" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "teachers_slug_idx" ON "teachers" USING btree ("slug");
  CREATE INDEX "teachers_updated_at_idx" ON "teachers" USING btree ("updated_at");
  CREATE INDEX "teachers_created_at_idx" ON "teachers" USING btree ("created_at");
  CREATE UNIQUE INDEX "curriculums_slug_idx" ON "curriculums" USING btree ("slug");
  CREATE INDEX "curriculums_updated_at_idx" ON "curriculums" USING btree ("updated_at");
  CREATE INDEX "curriculums_created_at_idx" ON "curriculums" USING btree ("created_at");
  CREATE INDEX "news_centers_order_idx" ON "news_centers" USING btree ("order");
  CREATE INDEX "news_centers_parent_idx" ON "news_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "profiles_centers_order_idx" ON "profiles_centers" USING btree ("order");
  CREATE INDEX "profiles_centers_parent_idx" ON "profiles_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "profiles_slug_idx" ON "profiles" USING btree ("slug");
  CREATE INDEX "profiles_updated_at_idx" ON "profiles" USING btree ("updated_at");
  CREATE INDEX "profiles_created_at_idx" ON "profiles" USING btree ("created_at");
  CREATE INDEX "agencies_centers_order_idx" ON "agencies_centers" USING btree ("order");
  CREATE INDEX "agencies_centers_parent_idx" ON "agencies_centers" USING btree ("parent_id");
  CREATE INDEX "agencies_actors_order_idx" ON "agencies_actors" USING btree ("_order");
  CREATE INDEX "agencies_actors_parent_id_idx" ON "agencies_actors" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "agencies_slug_idx" ON "agencies" USING btree ("slug");
  CREATE INDEX "agencies_updated_at_idx" ON "agencies" USING btree ("updated_at");
  CREATE INDEX "agencies_created_at_idx" ON "agencies" USING btree ("created_at");
  CREATE INDEX "artist_press_centers_order_idx" ON "artist_press_centers" USING btree ("order");
  CREATE INDEX "artist_press_centers_parent_idx" ON "artist_press_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "artist_press_slug_idx" ON "artist_press" USING btree ("slug");
  CREATE INDEX "artist_press_updated_at_idx" ON "artist_press" USING btree ("updated_at");
  CREATE INDEX "artist_press_created_at_idx" ON "artist_press" USING btree ("created_at");
  CREATE INDEX "audition_schedules_centers_order_idx" ON "audition_schedules_centers" USING btree ("order");
  CREATE INDEX "audition_schedules_centers_parent_idx" ON "audition_schedules_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "audition_schedules_slug_idx" ON "audition_schedules" USING btree ("slug");
  CREATE UNIQUE INDEX "audition_schedules_dedupe_key_idx" ON "audition_schedules" USING btree ("dedupe_key");
  CREATE INDEX "audition_schedules_updated_at_idx" ON "audition_schedules" USING btree ("updated_at");
  CREATE INDEX "audition_schedules_created_at_idx" ON "audition_schedules" USING btree ("created_at");
  CREATE INDEX "casting_directors_centers_order_idx" ON "casting_directors_centers" USING btree ("order");
  CREATE INDEX "casting_directors_centers_parent_idx" ON "casting_directors_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "casting_directors_slug_idx" ON "casting_directors" USING btree ("slug");
  CREATE UNIQUE INDEX "casting_directors_person_name_idx" ON "casting_directors" USING btree ("person_name");
  CREATE INDEX "casting_directors_updated_at_idx" ON "casting_directors" USING btree ("updated_at");
  CREATE INDEX "casting_directors_created_at_idx" ON "casting_directors" USING btree ("created_at");
  CREATE INDEX "casting_appearances_centers_order_idx" ON "casting_appearances_centers" USING btree ("order");
  CREATE INDEX "casting_appearances_centers_parent_idx" ON "casting_appearances_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "casting_appearances_slug_idx" ON "casting_appearances" USING btree ("slug");
  CREATE INDEX "casting_appearances_updated_at_idx" ON "casting_appearances" USING btree ("updated_at");
  CREATE INDEX "casting_appearances_created_at_idx" ON "casting_appearances" USING btree ("created_at");
  CREATE INDEX "screen_appearances_centers_order_idx" ON "screen_appearances_centers" USING btree ("order");
  CREATE INDEX "screen_appearances_centers_parent_idx" ON "screen_appearances_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "screen_appearances_slug_idx" ON "screen_appearances" USING btree ("slug");
  CREATE INDEX "screen_appearances_updated_at_idx" ON "screen_appearances" USING btree ("updated_at");
  CREATE INDEX "screen_appearances_created_at_idx" ON "screen_appearances" USING btree ("created_at");
  CREATE INDEX "exam_passed_reviews_centers_order_idx" ON "exam_passed_reviews_centers" USING btree ("order");
  CREATE INDEX "exam_passed_reviews_centers_parent_idx" ON "exam_passed_reviews_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "exam_passed_reviews_slug_idx" ON "exam_passed_reviews" USING btree ("slug");
  CREATE INDEX "exam_passed_reviews_updated_at_idx" ON "exam_passed_reviews" USING btree ("updated_at");
  CREATE INDEX "exam_passed_reviews_created_at_idx" ON "exam_passed_reviews" USING btree ("created_at");
  CREATE INDEX "exam_passed_videos_centers_order_idx" ON "exam_passed_videos_centers" USING btree ("order");
  CREATE INDEX "exam_passed_videos_centers_parent_idx" ON "exam_passed_videos_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "exam_passed_videos_slug_idx" ON "exam_passed_videos" USING btree ("slug");
  CREATE UNIQUE INDEX "exam_passed_videos_youtube_code_idx" ON "exam_passed_videos" USING btree ("youtube_code");
  CREATE INDEX "exam_passed_videos_updated_at_idx" ON "exam_passed_videos" USING btree ("updated_at");
  CREATE INDEX "exam_passed_videos_created_at_idx" ON "exam_passed_videos" USING btree ("created_at");
  CREATE INDEX "exam_results_centers_order_idx" ON "exam_results_centers" USING btree ("order");
  CREATE INDEX "exam_results_centers_parent_idx" ON "exam_results_centers" USING btree ("parent_id");
  CREATE UNIQUE INDEX "exam_results_slug_idx" ON "exam_results" USING btree ("slug");
  CREATE INDEX "exam_results_updated_at_idx" ON "exam_results" USING btree ("updated_at");
  CREATE INDEX "exam_results_created_at_idx" ON "exam_results" USING btree ("created_at");
  CREATE UNIQUE INDEX "exam_school_logos_school_slug_idx" ON "exam_school_logos" USING btree ("school_slug");
  CREATE INDEX "exam_school_logos_updated_at_idx" ON "exam_school_logos" USING btree ("updated_at");
  CREATE INDEX "exam_school_logos_created_at_idx" ON "exam_school_logos" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_teachers_id_idx" ON "payload_locked_documents_rels" USING btree ("teachers_id");
  CREATE INDEX "payload_locked_documents_rels_curriculums_id_idx" ON "payload_locked_documents_rels" USING btree ("curriculums_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("profiles_id");
  CREATE INDEX "payload_locked_documents_rels_agencies_id_idx" ON "payload_locked_documents_rels" USING btree ("agencies_id");
  CREATE INDEX "payload_locked_documents_rels_artist_press_id_idx" ON "payload_locked_documents_rels" USING btree ("artist_press_id");
  CREATE INDEX "payload_locked_documents_rels_audition_schedules_id_idx" ON "payload_locked_documents_rels" USING btree ("audition_schedules_id");
  CREATE INDEX "payload_locked_documents_rels_casting_directors_id_idx" ON "payload_locked_documents_rels" USING btree ("casting_directors_id");
  CREATE INDEX "payload_locked_documents_rels_casting_appearances_id_idx" ON "payload_locked_documents_rels" USING btree ("casting_appearances_id");
  CREATE INDEX "payload_locked_documents_rels_screen_appearances_id_idx" ON "payload_locked_documents_rels" USING btree ("screen_appearances_id");
  CREATE INDEX "payload_locked_documents_rels_exam_passed_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_passed_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_exam_passed_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_passed_videos_id");
  CREATE INDEX "payload_locked_documents_rels_exam_results_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_results_id");
  CREATE INDEX "payload_locked_documents_rels_exam_school_logos_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_school_logos_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "teachers_centers" CASCADE;
  DROP TABLE "teachers_gallery" CASCADE;
  DROP TABLE "teachers_representative_works" CASCADE;
  DROP TABLE "teachers" CASCADE;
  DROP TABLE "curriculums" CASCADE;
  DROP TABLE "news_centers" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "profiles_centers" CASCADE;
  DROP TABLE "profiles" CASCADE;
  DROP TABLE "agencies_centers" CASCADE;
  DROP TABLE "agencies_actors" CASCADE;
  DROP TABLE "agencies" CASCADE;
  DROP TABLE "artist_press_centers" CASCADE;
  DROP TABLE "artist_press" CASCADE;
  DROP TABLE "audition_schedules_centers" CASCADE;
  DROP TABLE "audition_schedules" CASCADE;
  DROP TABLE "casting_directors_centers" CASCADE;
  DROP TABLE "casting_directors" CASCADE;
  DROP TABLE "casting_appearances_centers" CASCADE;
  DROP TABLE "casting_appearances" CASCADE;
  DROP TABLE "screen_appearances_centers" CASCADE;
  DROP TABLE "screen_appearances" CASCADE;
  DROP TABLE "exam_passed_reviews_centers" CASCADE;
  DROP TABLE "exam_passed_reviews" CASCADE;
  DROP TABLE "exam_passed_videos_centers" CASCADE;
  DROP TABLE "exam_passed_videos" CASCADE;
  DROP TABLE "exam_results_centers" CASCADE;
  DROP TABLE "exam_results" CASCADE;
  DROP TABLE "exam_school_logos" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_center";
  DROP TYPE "public"."enum_teachers_centers";
  DROP TYPE "public"."enum_teachers_status";
  DROP TYPE "public"."enum_news_centers";
  DROP TYPE "public"."enum_news_display_status";
  DROP TYPE "public"."enum_profiles_centers";
  DROP TYPE "public"."enum_profiles_display_status";
  DROP TYPE "public"."enum_agencies_centers";
  DROP TYPE "public"."enum_artist_press_centers";
  DROP TYPE "public"."enum_artist_press_display_status";
  DROP TYPE "public"."enum_audition_schedules_centers";
  DROP TYPE "public"."enum_audition_schedules_display_status";
  DROP TYPE "public"."enum_casting_directors_centers";
  DROP TYPE "public"."enum_casting_directors_display_status";
  DROP TYPE "public"."enum_casting_appearances_centers";
  DROP TYPE "public"."enum_casting_appearances_display_status";
  DROP TYPE "public"."enum_screen_appearances_centers";
  DROP TYPE "public"."enum_screen_appearances_display_status";
  DROP TYPE "public"."enum_exam_passed_reviews_centers";
  DROP TYPE "public"."enum_exam_passed_reviews_display_status";
  DROP TYPE "public"."enum_exam_passed_videos_centers";
  DROP TYPE "public"."enum_exam_passed_videos_display_status";
  DROP TYPE "public"."enum_exam_results_centers";
  DROP TYPE "public"."enum_exam_results_display_status";`)
}
