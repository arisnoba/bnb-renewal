import * as migration_20260423_083425 from './20260423_083425'
import * as migration_20260427_162500_display_status_visibility from './20260427_162500_display_status_visibility'
import * as migration_20260427_170000_exam_review_school_relation from './20260427_170000_exam_review_school_relation'
import * as migration_20260427_180000_casting_appearance_cast_members from './20260427_180000_casting_appearance_cast_members'

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
]
