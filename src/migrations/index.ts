import * as migration_20260416_111020_c0_phase0_baseline from './20260416_111020_c0_phase0_baseline';

export const migrations = [
  {
    up: migration_20260416_111020_c0_phase0_baseline.up,
    down: migration_20260416_111020_c0_phase0_baseline.down,
    name: '20260416_111020_c0_phase0_baseline'
  },
];
