import * as migration_20260423_083425 from './20260423_083425'
import * as migration_20260427_162500_display_status_visibility from './20260427_162500_display_status_visibility'
import * as migration_20260427_170000_exam_review_school_relation from './20260427_170000_exam_review_school_relation'
import * as migration_20260427_180000_casting_appearance_cast_members from './20260427_180000_casting_appearance_cast_members'
import * as migration_20260427_190000_curriculum_weekly_lessons from './20260427_190000_curriculum_weekly_lessons'
import * as migration_20260427_200000_curriculum_teacher_relationship from './20260427_200000_curriculum_teacher_relationship'
import * as migration_20260427_210000_dedupe_curriculums from './20260427_210000_dedupe_curriculums'
import * as migration_20260427_220000_profile_career_items from './20260427_220000_profile_career_items'
import * as migration_20260427_230000_center_access_author_names from './20260427_230000_center_access_author_names'
import * as migration_20260427_235000_center_all_filter_access from './20260427_235000_center_all_filter_access'
import * as migration_20260428_010000_teacher_career_items from './20260428_010000_teacher_career_items'
import * as migration_20260429_120000_casting_director_profile_image_media from './20260429_120000_casting_director_profile_image_media'
import * as migration_20260429_130000_casting_director_career_items from './20260429_130000_casting_director_career_items'
import * as migration_20260429_140000_casting_director_optional_display_status from './20260429_140000_casting_director_optional_display_status'
import * as migration_20260429_150000_global_optional_archived_status from './20260429_150000_global_optional_archived_status'
import * as migration_20260429_160000_drop_exam_school_logo_review_count from './20260429_160000_drop_exam_school_logo_review_count'
import * as migration_20260429_170000_drop_exam_school_logo_legacy_fields from './20260429_170000_drop_exam_school_logo_legacy_fields'
import * as migration_20260429_190000_teacher_generate_slug from './20260429_190000_teacher_generate_slug'
import * as migration_20260429_195000_delete_draft_teachers from './20260429_195000_delete_draft_teachers'
import * as migration_20260429_200000_drop_teacher_representative_work_display_order from './20260429_200000_drop_teacher_representative_work_display_order'
import * as migration_20260429_210000_curriculum_policy_restructure from './20260429_210000_curriculum_policy_restructure'
import * as migration_20260429_211000_curriculum_class_options from './20260429_211000_curriculum_class_options'
import * as migration_20260429_212000_curriculum_capacity_default from './20260429_212000_curriculum_capacity_default'
import * as migration_20260429_213000_drop_curriculum_legacy_fields from './20260429_213000_drop_curriculum_legacy_fields'
import * as migration_20260430_120000_drop_agency_body_html from './20260430_120000_drop_agency_body_html'
import * as migration_20260430_121000_drop_agency_actor_profile_image_path from './20260430_121000_drop_agency_actor_profile_image_path'
import * as migration_20260430_122000_agency_logo_media from './20260430_122000_agency_logo_media'
import * as migration_20260430_123000_drop_agency_profile_image_path from './20260430_123000_drop_agency_profile_image_path'
import * as migration_20260430_124000_drop_agency_legacy_fields from './20260430_124000_drop_agency_legacy_fields'
import * as migration_20260430_130000_exam_passed_video_dates_slugs from './20260430_130000_exam_passed_video_dates_slugs'
import * as migration_20260430_140000_drop_unused_template_collections from './20260430_140000_drop_unused_template_collections'
import * as migration_20260430_150000_align_legacy_created_at from './20260430_150000_align_legacy_created_at'
import * as migration_20260430_160000_exam_result_slugs_local_paths from './20260430_160000_exam_result_slugs_local_paths'
import * as migration_20260430_170000_drop_exam_result_legacy_fields from './20260430_170000_drop_exam_result_legacy_fields'
import * as migration_20260430_180000_drop_exam_passed_video_legacy_fields from './20260430_180000_drop_exam_passed_video_legacy_fields'

export const migrations = [
  {
    up: migration_20260423_083425.up,
    down: migration_20260423_083425.down,
    name: '20260423_083425',
  },
  {
    up: migration_20260427_162500_display_status_visibility.up,
    down: migration_20260427_162500_display_status_visibility.down,
    name: '20260427_162500_display_status_visibility',
  },
  {
    up: migration_20260427_170000_exam_review_school_relation.up,
    down: migration_20260427_170000_exam_review_school_relation.down,
    name: '20260427_170000_exam_review_school_relation',
  },
  {
    up: migration_20260427_180000_casting_appearance_cast_members.up,
    down: migration_20260427_180000_casting_appearance_cast_members.down,
    name: '20260427_180000_casting_appearance_cast_members',
  },
  {
    up: migration_20260427_190000_curriculum_weekly_lessons.up,
    down: migration_20260427_190000_curriculum_weekly_lessons.down,
    name: '20260427_190000_curriculum_weekly_lessons',
  },
  {
    up: migration_20260427_200000_curriculum_teacher_relationship.up,
    down: migration_20260427_200000_curriculum_teacher_relationship.down,
    name: '20260427_200000_curriculum_teacher_relationship',
  },
  {
    up: migration_20260427_210000_dedupe_curriculums.up,
    down: migration_20260427_210000_dedupe_curriculums.down,
    name: '20260427_210000_dedupe_curriculums',
  },
  {
    up: migration_20260427_220000_profile_career_items.up,
    down: migration_20260427_220000_profile_career_items.down,
    name: '20260427_220000_profile_career_items',
  },
  {
    up: migration_20260427_230000_center_access_author_names.up,
    down: migration_20260427_230000_center_access_author_names.down,
    name: '20260427_230000_center_access_author_names',
  },
  {
    up: migration_20260427_235000_center_all_filter_access.up,
    down: migration_20260427_235000_center_all_filter_access.down,
    name: '20260427_235000_center_all_filter_access',
  },
  {
    up: migration_20260428_010000_teacher_career_items.up,
    down: migration_20260428_010000_teacher_career_items.down,
    name: '20260428_010000_teacher_career_items',
  },
  {
    up: migration_20260429_120000_casting_director_profile_image_media.up,
    down: migration_20260429_120000_casting_director_profile_image_media.down,
    name: '20260429_120000_casting_director_profile_image_media',
  },
  {
    up: migration_20260429_130000_casting_director_career_items.up,
    down: migration_20260429_130000_casting_director_career_items.down,
    name: '20260429_130000_casting_director_career_items',
  },
  {
    up: migration_20260429_140000_casting_director_optional_display_status.up,
    down: migration_20260429_140000_casting_director_optional_display_status.down,
    name: '20260429_140000_casting_director_optional_display_status',
  },
  {
    up: migration_20260429_150000_global_optional_archived_status.up,
    down: migration_20260429_150000_global_optional_archived_status.down,
    name: '20260429_150000_global_optional_archived_status',
  },
  {
    up: migration_20260429_160000_drop_exam_school_logo_review_count.up,
    down: migration_20260429_160000_drop_exam_school_logo_review_count.down,
    name: '20260429_160000_drop_exam_school_logo_review_count',
  },
  {
    up: migration_20260429_170000_drop_exam_school_logo_legacy_fields.up,
    down: migration_20260429_170000_drop_exam_school_logo_legacy_fields.down,
    name: '20260429_170000_drop_exam_school_logo_legacy_fields',
  },
  {
    up: migration_20260429_190000_teacher_generate_slug.up,
    down: migration_20260429_190000_teacher_generate_slug.down,
    name: '20260429_190000_teacher_generate_slug',
  },
  {
    up: migration_20260429_195000_delete_draft_teachers.up,
    down: migration_20260429_195000_delete_draft_teachers.down,
    name: '20260429_195000_delete_draft_teachers',
  },
  {
    up: migration_20260429_200000_drop_teacher_representative_work_display_order.up,
    down: migration_20260429_200000_drop_teacher_representative_work_display_order.down,
    name: '20260429_200000_drop_teacher_representative_work_display_order',
  },
  {
    up: migration_20260429_210000_curriculum_policy_restructure.up,
    down: migration_20260429_210000_curriculum_policy_restructure.down,
    name: '20260429_210000_curriculum_policy_restructure',
  },
  {
    up: migration_20260429_211000_curriculum_class_options.up,
    down: migration_20260429_211000_curriculum_class_options.down,
    name: '20260429_211000_curriculum_class_options',
  },
  {
    up: migration_20260429_212000_curriculum_capacity_default.up,
    down: migration_20260429_212000_curriculum_capacity_default.down,
    name: '20260429_212000_curriculum_capacity_default',
  },
  {
    up: migration_20260429_213000_drop_curriculum_legacy_fields.up,
    down: migration_20260429_213000_drop_curriculum_legacy_fields.down,
    name: '20260429_213000_drop_curriculum_legacy_fields',
  },
  {
    up: migration_20260430_120000_drop_agency_body_html.up,
    down: migration_20260430_120000_drop_agency_body_html.down,
    name: '20260430_120000_drop_agency_body_html',
  },
  {
    up: migration_20260430_121000_drop_agency_actor_profile_image_path.up,
    down: migration_20260430_121000_drop_agency_actor_profile_image_path.down,
    name: '20260430_121000_drop_agency_actor_profile_image_path',
  },
  {
    up: migration_20260430_122000_agency_logo_media.up,
    down: migration_20260430_122000_agency_logo_media.down,
    name: '20260430_122000_agency_logo_media',
  },
  {
    up: migration_20260430_123000_drop_agency_profile_image_path.up,
    down: migration_20260430_123000_drop_agency_profile_image_path.down,
    name: '20260430_123000_drop_agency_profile_image_path',
  },
  {
    up: migration_20260430_124000_drop_agency_legacy_fields.up,
    down: migration_20260430_124000_drop_agency_legacy_fields.down,
    name: '20260430_124000_drop_agency_legacy_fields',
  },
  {
    up: migration_20260430_130000_exam_passed_video_dates_slugs.up,
    down: migration_20260430_130000_exam_passed_video_dates_slugs.down,
    name: '20260430_130000_exam_passed_video_dates_slugs',
  },
  {
    up: migration_20260430_140000_drop_unused_template_collections.up,
    down: migration_20260430_140000_drop_unused_template_collections.down,
    name: '20260430_140000_drop_unused_template_collections',
  },
  {
    up: migration_20260430_150000_align_legacy_created_at.up,
    down: migration_20260430_150000_align_legacy_created_at.down,
    name: '20260430_150000_align_legacy_created_at',
  },
  {
    up: migration_20260430_160000_exam_result_slugs_local_paths.up,
    down: migration_20260430_160000_exam_result_slugs_local_paths.down,
    name: '20260430_160000_exam_result_slugs_local_paths',
  },
  {
    up: migration_20260430_170000_drop_exam_result_legacy_fields.up,
    down: migration_20260430_170000_drop_exam_result_legacy_fields.down,
    name: '20260430_170000_drop_exam_result_legacy_fields',
  },
  {
    up: migration_20260430_180000_drop_exam_passed_video_legacy_fields.up,
    down: migration_20260430_180000_drop_exam_passed_video_legacy_fields.down,
    name: '20260430_180000_drop_exam_passed_video_legacy_fields',
  },
]
