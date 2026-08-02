import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('sound_profiles', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    engine_configuration: {
      type: 'varchar(20)',
      notNull: true,
    },
    cylinder_count: {
      type: 'integer',
      notNull: true,
    },
    forced_induction: {
      type: 'varchar(30)',
      notNull: true,
    },
    exhaust_note: {
      type: 'varchar(30)',
      notNull: true,
    },
    audio_clip_url: {
      type: 'text',
    },
    audio_clip_duration_seconds: {
      type: 'integer',
    },
    make: {
      type: 'varchar(100)',
      notNull: true,
    },
    model: {
      type: 'varchar(200)',
      notNull: true,
    },
  });

  pgm.addConstraint('sound_profiles', 'uq_sound_profiles_make_model_engine', {
    unique: ['make', 'model', 'engine_configuration', 'cylinder_count', 'forced_induction'],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('sound_profiles');
}
