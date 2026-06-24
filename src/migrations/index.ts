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
import * as migration_20260430_190000_drop_profile_legacy_fields from './20260430_190000_drop_profile_legacy_fields'
import * as migration_20260430_191000_profile_versions from './20260430_191000_profile_versions'
import * as migration_20260430_192000_profile_gallery_images from './20260430_192000_profile_gallery_images'
import * as migration_20260430_193000_teacher_cleanup_versions from './20260430_193000_teacher_cleanup_versions'
import * as migration_20260430_194000_teacher_profile_image_required from './20260430_194000_teacher_profile_image_required'
import * as migration_20260511_160000_drop_casting_director_legacy_fields from './20260511_160000_drop_casting_director_legacy_fields'
import * as migration_20260511_163000_exam_passed_review_structured_content from './20260511_163000_exam_passed_review_structured_content'
import * as migration_20260511_170000_drop_exam_passed_review_legacy_fields from './20260511_170000_drop_exam_passed_review_legacy_fields'
import * as migration_20260511_180000_audition_schedule_event_type_select from './20260511_180000_audition_schedule_event_type_select'
import * as migration_20260511_181000_drop_audition_schedule_legacy_fields from './20260511_181000_drop_audition_schedule_legacy_fields'
import * as migration_20260511_200000_drop_artist_press_legacy_fields from './20260511_200000_drop_artist_press_legacy_fields'
import * as migration_20260512_140000_screen_appearance_local_image_paths from './20260512_140000_screen_appearance_local_image_paths'
import * as migration_20260512_143000_media_external_url from './20260512_143000_media_external_url'
import * as migration_20260512_150000_screen_appearance_field_types from './20260512_150000_screen_appearance_field_types'
import * as migration_20260512_160000_screen_appearance_structured_body from './20260512_160000_screen_appearance_structured_body'
import * as migration_20260512_170000_screen_appearance_profile_links from './20260512_170000_screen_appearance_profile_links'
import * as migration_20260512_171000_screen_appearance_profile_links_backfill from './20260512_171000_screen_appearance_profile_links_backfill'
import * as migration_20260512_180000_screen_appearance_actor_input_mode from './20260512_180000_screen_appearance_actor_input_mode'
import * as migration_20260512_190000_drop_screen_appearance_body_legacy_fields from './20260512_190000_drop_screen_appearance_body_legacy_fields'
import * as migration_20260512_191000_backfill_screen_appearance_air_dates from './20260512_191000_backfill_screen_appearance_air_dates'
import * as migration_20260513_171500_casting_appearance_legacy_cleanup from './20260513_171500_casting_appearance_legacy_cleanup'
import * as migration_20260513_190000_news_pre2020_draft from './20260513_190000_news_pre2020_draft'
import * as migration_20260514_150000_news_body_and_legacy_cleanup from './20260514_150000_news_body_and_legacy_cleanup'
import * as migration_20260518_140000_highteen_special_classes from './20260518_140000_highteen_special_classes'
import * as migration_20260518_143000_drop_highteen_special_class_view_count from './20260518_143000_drop_highteen_special_class_view_count'
import * as migration_20260518_160000_direct_castings from './20260518_160000_direct_castings'
import * as migration_20260518_170000_direct_casting_thumbnail_media from './20260518_170000_direct_casting_thumbnail_media'
import * as migration_20260518_180000_direct_casting_centers_and_body_html from './20260518_180000_direct_casting_centers_and_body_html'
import * as migration_20260518_190000_drop_direct_casting_work_items from './20260518_190000_drop_direct_casting_work_items'
import * as migration_20260518_201500_faqs from './20260518_201500_faqs'
import * as migration_20260518_203000_drop_faq_source_fields from './20260518_203000_drop_faq_source_fields'
import * as migration_20260518_204000_drop_faq_duplicate_question_fields from './20260518_204000_drop_faq_duplicate_question_fields'
import * as migration_20260518_210000_star_cards from './20260518_210000_star_cards'
import * as migration_20260518_211000_star_card_body_images from './20260518_211000_star_card_body_images'
import * as migration_20260518_212000_drop_star_card_summary_and_body_image_order from './20260518_212000_drop_star_card_summary_and_body_image_order'
import * as migration_20260518_213000_drop_star_card_body_image_source_file from './20260518_213000_drop_star_card_body_image_source_file'
import * as migration_20260518_214000_histories from './20260518_214000_histories'
import * as migration_20260518_215000_yearly_histories from './20260518_215000_yearly_histories'
import * as migration_20260518_220000_drop_history_display_order from './20260518_220000_drop_history_display_order'
import * as migration_20260520_120000_drop_direct_casting_legacy_fields from './20260520_120000_drop_direct_casting_legacy_fields'
import * as migration_20260520_121000_highteen_special_class_media_fields from './20260520_121000_highteen_special_class_media_fields'
import * as migration_20260520_122000_drop_highteen_special_class_legacy_fields from './20260520_122000_drop_highteen_special_class_legacy_fields'
import * as migration_20260520_123000_artist_press_agencies from './20260520_123000_artist_press_agencies'
import * as migration_20260520_124000_star_card_media_fields from './20260520_124000_star_card_media_fields'
import * as migration_20260520_125000_drop_star_card_legacy_fields from './20260520_125000_drop_star_card_legacy_fields'
import * as migration_20260521_120000_drop_teacher_bio_html from './20260521_120000_drop_teacher_bio_html'
import * as migration_20260521_130000_artist_press_agency_slug_cleanup from './20260521_130000_artist_press_agency_slug_cleanup'
import * as migration_20260521_140000_drop_exam_passed_review_cohort from './20260521_140000_drop_exam_passed_review_cohort'
import * as migration_20260522_150000_news_center_slug_prefixes from './20260522_150000_news_center_slug_prefixes'
import * as migration_20260522_160000_exam_passed_content_slugs from './20260522_160000_exam_passed_content_slugs'
import * as migration_20260522_170000_direct_casting_title_slugs from './20260522_170000_direct_casting_title_slugs'
import * as migration_20260522_180000_direct_casting_title_aliases from './20260522_180000_direct_casting_title_aliases'
import * as migration_20260522_190000_direct_casting_broadcast_title_names from './20260522_190000_direct_casting_broadcast_title_names'
import * as migration_20260526_130000_teacher_profile_image_media from './20260526_130000_teacher_profile_image_media'
import * as migration_20260526_150000_profile_image_media from './20260526_150000_profile_image_media'
import * as migration_20260526_200000_restore_screen_appearances_centers from './20260526_200000_restore_screen_appearances_centers'
import * as migration_20260526_210000_drop_star_card_logo_media from './20260526_210000_drop_star_card_logo_media'
import * as migration_20260526_211000_star_card_discount_rate from './20260526_211000_star_card_discount_rate'
import * as migration_20260526_212000_teacher_profile_image_media_required from './20260526_212000_teacher_profile_image_media_required'
import * as migration_20260527_110000_teacher_name_slugs from './20260527_110000_teacher_name_slugs'
import * as migration_20260527_120000_collection_slug_cleanup from './20260527_120000_collection_slug_cleanup'
import * as migration_20260527_121000_normalize_collection_slug_hyphens from './20260527_121000_normalize_collection_slug_hyphens'
import * as migration_20260527_130000_curriculum_single_center_classes from './20260527_130000_curriculum_single_center_classes'
import * as migration_20260527_140000_faq_status_and_answer_mode from './20260527_140000_faq_status_and_answer_mode'
import * as migration_20260527_200000_inquiries from './20260527_200000_inquiries'
import * as migration_20260527_201000_inquiry_birth_date_text from './20260527_201000_inquiry_birth_date_text'
import * as migration_20260528_120000_inquiry_privacy_consent_at from './20260528_120000_inquiry_privacy_consent_at'
import * as migration_20260528_121000_inquiry_attachment_r2_link from './20260528_121000_inquiry_attachment_r2_link'
import * as migration_20260528_130000_main_global from './20260528_130000_main_global'
import * as migration_20260529_153600_add_social_links from './20260529_153600_add_social_links'
import * as migration_20260529_160000_social_link_image_url from './20260529_160000_social_link_image_url'
import * as migration_20260602_161500_main_banner_linked_content_items from './20260602_161500_main_banner_linked_content_items'
import * as migration_20260602_173000_main_banner_autoplay_settings from './20260602_173000_main_banner_autoplay_settings'
import * as migration_20260602_181000_main_statistics from './20260602_181000_main_statistics'
import * as migration_20260602_182000_main_statistics_center from './20260602_182000_main_statistics_center'
import * as migration_20260602_183000_main_statistics_global_fields from './20260602_183000_main_statistics_global_fields'
import * as migration_20260602_184000_drop_main_statistics_collection_lock_rel from './20260602_184000_drop_main_statistics_collection_lock_rel'
import * as migration_20260602_185000_main_settings_collection_lock_rels from './20260602_185000_main_settings_collection_lock_rels'
import * as migration_20260608_120000_star_card_category from './20260608_120000_star_card_category'
import * as migration_20260609_163500_terms from './20260609_163500_terms'
import * as migration_20260611_191500_teacher_representative_work_poster_media from './20260611_191500_teacher_representative_work_poster_media'
import * as migration_20260612_123500_broadcast_stations from './20260612_123500_broadcast_stations'
import * as migration_20260612_153000_screen_appearance_movie_type_project_titles from './20260612_153000_screen_appearance_movie_type_project_titles'
import * as migration_20260615_123800_profile_class_cohort from './20260615_123800_profile_class_cohort'
import * as migration_20260615_150000_drop_pages_posts_collections from './20260615_150000_drop_pages_posts_collections'
import * as migration_20260615_200800_classrooms from './20260615_200800_classrooms'
import * as migration_20260615_211000_curriculum_classroom_tuition from './20260615_211000_curriculum_classroom_tuition'
import * as migration_20260617_120000_agency_display_status from './20260617_120000_agency_display_status'
import * as migration_20260622_170000_inquiry_public_form_options from './20260622_170000_inquiry_public_form_options'
import * as migration_20260622_182500_footer_center_sns_urls from './20260622_182500_footer_center_sns_urls'
import * as migration_20260623_120000_direct_casting_company_arko_lab from './20260623_120000_direct_casting_company_arko_lab'
import * as migration_20260623_191500_direct_casting_multi_company_merge from './20260623_191500_direct_casting_multi_company_merge'
import * as migration_20260624_120000_social_links_sns_type from './20260624_120000_social_links_sns_type'

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
  {
    up: migration_20260430_190000_drop_profile_legacy_fields.up,
    down: migration_20260430_190000_drop_profile_legacy_fields.down,
    name: '20260430_190000_drop_profile_legacy_fields',
  },
  {
    up: migration_20260430_191000_profile_versions.up,
    down: migration_20260430_191000_profile_versions.down,
    name: '20260430_191000_profile_versions',
  },
  {
    up: migration_20260430_192000_profile_gallery_images.up,
    down: migration_20260430_192000_profile_gallery_images.down,
    name: '20260430_192000_profile_gallery_images',
  },
  {
    up: migration_20260430_193000_teacher_cleanup_versions.up,
    down: migration_20260430_193000_teacher_cleanup_versions.down,
    name: '20260430_193000_teacher_cleanup_versions',
  },
  {
    up: migration_20260430_194000_teacher_profile_image_required.up,
    down: migration_20260430_194000_teacher_profile_image_required.down,
    name: '20260430_194000_teacher_profile_image_required',
  },
  {
    up: migration_20260511_160000_drop_casting_director_legacy_fields.up,
    down: migration_20260511_160000_drop_casting_director_legacy_fields.down,
    name: '20260511_160000_drop_casting_director_legacy_fields',
  },
  {
    up: migration_20260511_163000_exam_passed_review_structured_content.up,
    down: migration_20260511_163000_exam_passed_review_structured_content.down,
    name: '20260511_163000_exam_passed_review_structured_content',
  },
  {
    up: migration_20260511_170000_drop_exam_passed_review_legacy_fields.up,
    down: migration_20260511_170000_drop_exam_passed_review_legacy_fields.down,
    name: '20260511_170000_drop_exam_passed_review_legacy_fields',
  },
  {
    up: migration_20260511_180000_audition_schedule_event_type_select.up,
    down: migration_20260511_180000_audition_schedule_event_type_select.down,
    name: '20260511_180000_audition_schedule_event_type_select',
  },
  {
    up: migration_20260511_181000_drop_audition_schedule_legacy_fields.up,
    down: migration_20260511_181000_drop_audition_schedule_legacy_fields.down,
    name: '20260511_181000_drop_audition_schedule_legacy_fields',
  },
  {
    up: migration_20260511_200000_drop_artist_press_legacy_fields.up,
    down: migration_20260511_200000_drop_artist_press_legacy_fields.down,
    name: '20260511_200000_drop_artist_press_legacy_fields',
  },
  {
    up: migration_20260512_140000_screen_appearance_local_image_paths.up,
    down: migration_20260512_140000_screen_appearance_local_image_paths.down,
    name: '20260512_140000_screen_appearance_local_image_paths',
  },
  {
    up: migration_20260512_143000_media_external_url.up,
    down: migration_20260512_143000_media_external_url.down,
    name: '20260512_143000_media_external_url',
  },
  {
    up: migration_20260512_150000_screen_appearance_field_types.up,
    down: migration_20260512_150000_screen_appearance_field_types.down,
    name: '20260512_150000_screen_appearance_field_types',
  },
  {
    up: migration_20260512_160000_screen_appearance_structured_body.up,
    down: migration_20260512_160000_screen_appearance_structured_body.down,
    name: '20260512_160000_screen_appearance_structured_body',
  },
  {
    up: migration_20260512_170000_screen_appearance_profile_links.up,
    down: migration_20260512_170000_screen_appearance_profile_links.down,
    name: '20260512_170000_screen_appearance_profile_links',
  },
  {
    up: migration_20260512_171000_screen_appearance_profile_links_backfill.up,
    down: migration_20260512_171000_screen_appearance_profile_links_backfill.down,
    name: '20260512_171000_screen_appearance_profile_links_backfill',
  },
  {
    up: migration_20260512_180000_screen_appearance_actor_input_mode.up,
    down: migration_20260512_180000_screen_appearance_actor_input_mode.down,
    name: '20260512_180000_screen_appearance_actor_input_mode',
  },
  {
    up: migration_20260512_190000_drop_screen_appearance_body_legacy_fields.up,
    down: migration_20260512_190000_drop_screen_appearance_body_legacy_fields.down,
    name: '20260512_190000_drop_screen_appearance_body_legacy_fields',
  },
  {
    up: migration_20260512_191000_backfill_screen_appearance_air_dates.up,
    down: migration_20260512_191000_backfill_screen_appearance_air_dates.down,
    name: '20260512_191000_backfill_screen_appearance_air_dates',
  },
  {
    up: migration_20260513_171500_casting_appearance_legacy_cleanup.up,
    down: migration_20260513_171500_casting_appearance_legacy_cleanup.down,
    name: '20260513_171500_casting_appearance_legacy_cleanup',
  },
  {
    up: migration_20260513_190000_news_pre2020_draft.up,
    down: migration_20260513_190000_news_pre2020_draft.down,
    name: '20260513_190000_news_pre2020_draft',
  },
  {
    up: migration_20260514_150000_news_body_and_legacy_cleanup.up,
    down: migration_20260514_150000_news_body_and_legacy_cleanup.down,
    name: '20260514_150000_news_body_and_legacy_cleanup',
  },
  {
    up: migration_20260518_140000_highteen_special_classes.up,
    down: migration_20260518_140000_highteen_special_classes.down,
    name: '20260518_140000_highteen_special_classes',
  },
  {
    up: migration_20260518_143000_drop_highteen_special_class_view_count.up,
    down: migration_20260518_143000_drop_highteen_special_class_view_count.down,
    name: '20260518_143000_drop_highteen_special_class_view_count',
  },
  {
    up: migration_20260518_160000_direct_castings.up,
    down: migration_20260518_160000_direct_castings.down,
    name: '20260518_160000_direct_castings',
  },
  {
    up: migration_20260518_170000_direct_casting_thumbnail_media.up,
    down: migration_20260518_170000_direct_casting_thumbnail_media.down,
    name: '20260518_170000_direct_casting_thumbnail_media',
  },
  {
    up: migration_20260518_180000_direct_casting_centers_and_body_html.up,
    down: migration_20260518_180000_direct_casting_centers_and_body_html.down,
    name: '20260518_180000_direct_casting_centers_and_body_html',
  },
  {
    up: migration_20260518_190000_drop_direct_casting_work_items.up,
    down: migration_20260518_190000_drop_direct_casting_work_items.down,
    name: '20260518_190000_drop_direct_casting_work_items',
  },
  {
    up: migration_20260518_201500_faqs.up,
    down: migration_20260518_201500_faqs.down,
    name: '20260518_201500_faqs',
  },
  {
    up: migration_20260518_203000_drop_faq_source_fields.up,
    down: migration_20260518_203000_drop_faq_source_fields.down,
    name: '20260518_203000_drop_faq_source_fields',
  },
  {
    up: migration_20260518_204000_drop_faq_duplicate_question_fields.up,
    down: migration_20260518_204000_drop_faq_duplicate_question_fields.down,
    name: '20260518_204000_drop_faq_duplicate_question_fields',
  },
  {
    up: migration_20260518_210000_star_cards.up,
    down: migration_20260518_210000_star_cards.down,
    name: '20260518_210000_star_cards',
  },
  {
    up: migration_20260518_211000_star_card_body_images.up,
    down: migration_20260518_211000_star_card_body_images.down,
    name: '20260518_211000_star_card_body_images',
  },
  {
    up: migration_20260518_212000_drop_star_card_summary_and_body_image_order.up,
    down: migration_20260518_212000_drop_star_card_summary_and_body_image_order.down,
    name: '20260518_212000_drop_star_card_summary_and_body_image_order',
  },
  {
    up: migration_20260518_213000_drop_star_card_body_image_source_file.up,
    down: migration_20260518_213000_drop_star_card_body_image_source_file.down,
    name: '20260518_213000_drop_star_card_body_image_source_file',
  },
  {
    up: migration_20260518_214000_histories.up,
    down: migration_20260518_214000_histories.down,
    name: '20260518_214000_histories',
  },
  {
    up: migration_20260518_215000_yearly_histories.up,
    down: migration_20260518_215000_yearly_histories.down,
    name: '20260518_215000_yearly_histories',
  },
  {
    up: migration_20260518_220000_drop_history_display_order.up,
    down: migration_20260518_220000_drop_history_display_order.down,
    name: '20260518_220000_drop_history_display_order',
  },
  {
    up: migration_20260520_120000_drop_direct_casting_legacy_fields.up,
    down: migration_20260520_120000_drop_direct_casting_legacy_fields.down,
    name: '20260520_120000_drop_direct_casting_legacy_fields',
  },
  {
    up: migration_20260520_121000_highteen_special_class_media_fields.up,
    down: migration_20260520_121000_highteen_special_class_media_fields.down,
    name: '20260520_121000_highteen_special_class_media_fields',
  },
  {
    up: migration_20260520_122000_drop_highteen_special_class_legacy_fields.up,
    down: migration_20260520_122000_drop_highteen_special_class_legacy_fields.down,
    name: '20260520_122000_drop_highteen_special_class_legacy_fields',
  },
  {
    up: migration_20260520_123000_artist_press_agencies.up,
    down: migration_20260520_123000_artist_press_agencies.down,
    name: '20260520_123000_artist_press_agencies',
  },
  {
    up: migration_20260520_124000_star_card_media_fields.up,
    down: migration_20260520_124000_star_card_media_fields.down,
    name: '20260520_124000_star_card_media_fields',
  },
  {
    up: migration_20260520_125000_drop_star_card_legacy_fields.up,
    down: migration_20260520_125000_drop_star_card_legacy_fields.down,
    name: '20260520_125000_drop_star_card_legacy_fields',
  },
  {
    up: migration_20260521_120000_drop_teacher_bio_html.up,
    down: migration_20260521_120000_drop_teacher_bio_html.down,
    name: '20260521_120000_drop_teacher_bio_html',
  },
  {
    up: migration_20260521_130000_artist_press_agency_slug_cleanup.up,
    down: migration_20260521_130000_artist_press_agency_slug_cleanup.down,
    name: '20260521_130000_artist_press_agency_slug_cleanup',
  },
  {
    up: migration_20260521_140000_drop_exam_passed_review_cohort.up,
    down: migration_20260521_140000_drop_exam_passed_review_cohort.down,
    name: '20260521_140000_drop_exam_passed_review_cohort',
  },
  {
    up: migration_20260522_150000_news_center_slug_prefixes.up,
    down: migration_20260522_150000_news_center_slug_prefixes.down,
    name: '20260522_150000_news_center_slug_prefixes',
  },
  {
    up: migration_20260522_160000_exam_passed_content_slugs.up,
    down: migration_20260522_160000_exam_passed_content_slugs.down,
    name: '20260522_160000_exam_passed_content_slugs',
  },
  {
    up: migration_20260522_170000_direct_casting_title_slugs.up,
    down: migration_20260522_170000_direct_casting_title_slugs.down,
    name: '20260522_170000_direct_casting_title_slugs',
  },
  {
    up: migration_20260522_180000_direct_casting_title_aliases.up,
    down: migration_20260522_180000_direct_casting_title_aliases.down,
    name: '20260522_180000_direct_casting_title_aliases',
  },
  {
    up: migration_20260522_190000_direct_casting_broadcast_title_names.up,
    down: migration_20260522_190000_direct_casting_broadcast_title_names.down,
    name: '20260522_190000_direct_casting_broadcast_title_names',
  },
  {
    up: migration_20260526_130000_teacher_profile_image_media.up,
    down: migration_20260526_130000_teacher_profile_image_media.down,
    name: '20260526_130000_teacher_profile_image_media',
  },
  {
    up: migration_20260526_150000_profile_image_media.up,
    down: migration_20260526_150000_profile_image_media.down,
    name: '20260526_150000_profile_image_media',
  },
  {
    up: migration_20260526_200000_restore_screen_appearances_centers.up,
    down: migration_20260526_200000_restore_screen_appearances_centers.down,
    name: '20260526_200000_restore_screen_appearances_centers',
  },
  {
    up: migration_20260526_210000_drop_star_card_logo_media.up,
    down: migration_20260526_210000_drop_star_card_logo_media.down,
    name: '20260526_210000_drop_star_card_logo_media',
  },
  {
    up: migration_20260526_211000_star_card_discount_rate.up,
    down: migration_20260526_211000_star_card_discount_rate.down,
    name: '20260526_211000_star_card_discount_rate',
  },
  {
    up: migration_20260526_212000_teacher_profile_image_media_required.up,
    down: migration_20260526_212000_teacher_profile_image_media_required.down,
    name: '20260526_212000_teacher_profile_image_media_required',
  },
  {
    up: migration_20260527_110000_teacher_name_slugs.up,
    down: migration_20260527_110000_teacher_name_slugs.down,
    name: '20260527_110000_teacher_name_slugs',
  },
  {
    up: migration_20260527_120000_collection_slug_cleanup.up,
    down: migration_20260527_120000_collection_slug_cleanup.down,
    name: '20260527_120000_collection_slug_cleanup',
  },
  {
    up: migration_20260527_121000_normalize_collection_slug_hyphens.up,
    down: migration_20260527_121000_normalize_collection_slug_hyphens.down,
    name: '20260527_121000_normalize_collection_slug_hyphens',
  },
  {
    up: migration_20260527_130000_curriculum_single_center_classes.up,
    down: migration_20260527_130000_curriculum_single_center_classes.down,
    name: '20260527_130000_curriculum_single_center_classes',
  },
  {
    up: migration_20260527_140000_faq_status_and_answer_mode.up,
    down: migration_20260527_140000_faq_status_and_answer_mode.down,
    name: '20260527_140000_faq_status_and_answer_mode',
  },
  {
    up: migration_20260527_200000_inquiries.up,
    down: migration_20260527_200000_inquiries.down,
    name: '20260527_200000_inquiries',
  },
  {
    up: migration_20260527_201000_inquiry_birth_date_text.up,
    down: migration_20260527_201000_inquiry_birth_date_text.down,
    name: '20260527_201000_inquiry_birth_date_text',
  },
  {
    up: migration_20260528_120000_inquiry_privacy_consent_at.up,
    down: migration_20260528_120000_inquiry_privacy_consent_at.down,
    name: '20260528_120000_inquiry_privacy_consent_at',
  },
  {
    up: migration_20260528_121000_inquiry_attachment_r2_link.up,
    down: migration_20260528_121000_inquiry_attachment_r2_link.down,
    name: '20260528_121000_inquiry_attachment_r2_link',
  },
  {
    up: migration_20260528_130000_main_global.up,
    down: migration_20260528_130000_main_global.down,
    name: '20260528_130000_main_global',
  },
  {
    up: migration_20260529_153600_add_social_links.up,
    down: migration_20260529_153600_add_social_links.down,
    name: '20260529_153600_add_social_links',
  },
  {
    up: migration_20260529_160000_social_link_image_url.up,
    down: migration_20260529_160000_social_link_image_url.down,
    name: '20260529_160000_social_link_image_url',
  },
  {
    up: migration_20260602_161500_main_banner_linked_content_items.up,
    down: migration_20260602_161500_main_banner_linked_content_items.down,
    name: '20260602_161500_main_banner_linked_content_items',
  },
  {
    up: migration_20260602_173000_main_banner_autoplay_settings.up,
    down: migration_20260602_173000_main_banner_autoplay_settings.down,
    name: '20260602_173000_main_banner_autoplay_settings',
  },
  {
    up: migration_20260602_181000_main_statistics.up,
    down: migration_20260602_181000_main_statistics.down,
    name: '20260602_181000_main_statistics',
  },
  {
    up: migration_20260602_182000_main_statistics_center.up,
    down: migration_20260602_182000_main_statistics_center.down,
    name: '20260602_182000_main_statistics_center',
  },
  {
    up: migration_20260602_183000_main_statistics_global_fields.up,
    down: migration_20260602_183000_main_statistics_global_fields.down,
    name: '20260602_183000_main_statistics_global_fields',
  },
  {
    up: migration_20260602_184000_drop_main_statistics_collection_lock_rel.up,
    down: migration_20260602_184000_drop_main_statistics_collection_lock_rel.down,
    name: '20260602_184000_drop_main_statistics_collection_lock_rel',
  },
  {
    up: migration_20260602_185000_main_settings_collection_lock_rels.up,
    down: migration_20260602_185000_main_settings_collection_lock_rels.down,
    name: '20260602_185000_main_settings_collection_lock_rels',
  },
  {
    up: migration_20260608_120000_star_card_category.up,
    down: migration_20260608_120000_star_card_category.down,
    name: '20260608_120000_star_card_category',
  },
  {
    up: migration_20260609_163500_terms.up,
    down: migration_20260609_163500_terms.down,
    name: '20260609_163500_terms',
  },
  {
    up: migration_20260611_191500_teacher_representative_work_poster_media.up,
    down: migration_20260611_191500_teacher_representative_work_poster_media.down,
    name: '20260611_191500_teacher_representative_work_poster_media',
  },
  {
    up: migration_20260612_123500_broadcast_stations.up,
    down: migration_20260612_123500_broadcast_stations.down,
    name: '20260612_123500_broadcast_stations',
  },
  {
    up: migration_20260612_153000_screen_appearance_movie_type_project_titles.up,
    down: migration_20260612_153000_screen_appearance_movie_type_project_titles.down,
    name: '20260612_153000_screen_appearance_movie_type_project_titles',
  },
  {
    up: migration_20260615_123800_profile_class_cohort.up,
    down: migration_20260615_123800_profile_class_cohort.down,
    name: '20260615_123800_profile_class_cohort',
  },
  {
    up: migration_20260615_150000_drop_pages_posts_collections.up,
    down: migration_20260615_150000_drop_pages_posts_collections.down,
    name: '20260615_150000_drop_pages_posts_collections',
  },
  {
    up: migration_20260615_200800_classrooms.up,
    down: migration_20260615_200800_classrooms.down,
    name: '20260615_200800_classrooms',
  },
  {
    up: migration_20260615_211000_curriculum_classroom_tuition.up,
    down: migration_20260615_211000_curriculum_classroom_tuition.down,
    name: '20260615_211000_curriculum_classroom_tuition',
  },
  {
    up: migration_20260617_120000_agency_display_status.up,
    down: migration_20260617_120000_agency_display_status.down,
    name: '20260617_120000_agency_display_status',
  },
  {
    up: migration_20260622_170000_inquiry_public_form_options.up,
    down: migration_20260622_170000_inquiry_public_form_options.down,
    name: '20260622_170000_inquiry_public_form_options',
  },
  {
    up: migration_20260622_182500_footer_center_sns_urls.up,
    down: migration_20260622_182500_footer_center_sns_urls.down,
    name: '20260622_182500_footer_center_sns_urls',
  },
  {
    up: migration_20260623_120000_direct_casting_company_arko_lab.up,
    down: migration_20260623_120000_direct_casting_company_arko_lab.down,
    name: '20260623_120000_direct_casting_company_arko_lab',
  },
  {
    up: migration_20260623_191500_direct_casting_multi_company_merge.up,
    down: migration_20260623_191500_direct_casting_multi_company_merge.down,
    name: '20260623_191500_direct_casting_multi_company_merge',
  },
  {
    up: migration_20260624_120000_social_links_sns_type.up,
    down: migration_20260624_120000_social_links_sns_type.down,
    name: '20260624_120000_social_links_sns_type',
  },
]
