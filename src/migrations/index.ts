import * as migration_20260416_111020_c0_phase0_baseline from './20260416_111020_c0_phase0_baseline';
import * as migration_20260420_090000_c0_phase1_core_reset from './20260420_090000_c0_phase1_core_reset';
import * as migration_20260420_173500_c0_phase1_teacher_photo_columns_fix from './20260420_173500_c0_phase1_teacher_photo_columns_fix';
import * as migration_20260420_190000_c0_phase3_batch3a from './20260420_190000_c0_phase3_batch3a';
import * as migration_20260420_200000_c0_phase3_batch3b from './20260420_200000_c0_phase3_batch3b';

export const migrations = [
  {
    up: migration_20260416_111020_c0_phase0_baseline.up,
    down: migration_20260416_111020_c0_phase0_baseline.down,
    name: '20260416_111020_c0_phase0_baseline',
  },
  {
    up: migration_20260420_090000_c0_phase1_core_reset.up,
    down: migration_20260420_090000_c0_phase1_core_reset.down,
    name: '20260420_090000_c0_phase1_core_reset',
  },
  {
    up: migration_20260420_173500_c0_phase1_teacher_photo_columns_fix.up,
    down: migration_20260420_173500_c0_phase1_teacher_photo_columns_fix.down,
    name: '20260420_173500_c0_phase1_teacher_photo_columns_fix',
  },
  {
    up: migration_20260420_190000_c0_phase3_batch3a.up,
    down: migration_20260420_190000_c0_phase3_batch3a.down,
    name: '20260420_190000_c0_phase3_batch3a',
  },
  {
    up: migration_20260420_200000_c0_phase3_batch3b.up,
    down: migration_20260420_200000_c0_phase3_batch3b.down,
    name: '20260420_200000_c0_phase3_batch3b',
  },
];
