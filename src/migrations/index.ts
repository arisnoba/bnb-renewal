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
]
