import type { EngineConfiguration, ForcedInduction, ExhaustNote } from '@car-ads/shared';

/**
 * Seed data for sound profiles of common luxury and performance models.
 * Used to populate the sound_profiles table on initial setup.
 */
export interface SoundProfileSeedEntry {
  make: string;
  model: string;
  engineConfiguration: EngineConfiguration;
  cylinderCount: number;
  forcedInduction: ForcedInduction;
  exhaustNote: ExhaustNote;
  audioClipUrl: string | null;
  audioClipDurationSeconds: number | null;
}

export const SOUND_PROFILE_SEED_DATA: SoundProfileSeedEntry[] = [
  // Ferrari 488 - V8 Twin-Turbo
  {
    make: 'Ferrari',
    model: '488',
    engineConfiguration: 'v-type',
    cylinderCount: 8,
    forcedInduction: 'turbocharged',
    exhaustNote: 'deep_rumble',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/ferrari-488.mp3',
    audioClipDurationSeconds: 25,
  },
  // Ferrari 812 Superfast - V12 NA
  {
    make: 'Ferrari',
    model: '812 Superfast',
    engineConfiguration: 'v-type',
    cylinderCount: 12,
    forcedInduction: 'naturally_aspirated',
    exhaustNote: 'high_pitched_scream',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/ferrari-812.mp3',
    audioClipDurationSeconds: 28,
  },
  // Lamborghini Huracán - V10 NA
  {
    make: 'Lamborghini',
    model: 'Huracán',
    engineConfiguration: 'v-type',
    cylinderCount: 10,
    forcedInduction: 'naturally_aspirated',
    exhaustNote: 'high_pitched_scream',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/lambo-huracan.mp3',
    audioClipDurationSeconds: 22,
  },
  // Porsche 911 GT3 - Flat-6 NA
  {
    make: 'Porsche',
    model: '911 GT3',
    engineConfiguration: 'flat',
    cylinderCount: 6,
    forcedInduction: 'naturally_aspirated',
    exhaustNote: 'deep_rumble',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/porsche-911-gt3.mp3',
    audioClipDurationSeconds: 30,
  },
  // BMW M3 - Inline-6 Twin-Turbo
  {
    make: 'BMW',
    model: 'M3',
    engineConfiguration: 'inline',
    cylinderCount: 6,
    forcedInduction: 'turbocharged',
    exhaustNote: 'aggressive_bark',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/bmw-m3.mp3',
    audioClipDurationSeconds: 20,
  },
  // Mercedes AMG GT - V8 Twin-Turbo
  {
    make: 'Mercedes',
    model: 'AMG GT',
    engineConfiguration: 'v-type',
    cylinderCount: 8,
    forcedInduction: 'turbocharged',
    exhaustNote: 'deep_rumble',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/mercedes-amg-gt.mp3',
    audioClipDurationSeconds: 26,
  },
  // Audi R8 - V10 NA
  {
    make: 'Audi',
    model: 'R8',
    engineConfiguration: 'v-type',
    cylinderCount: 10,
    forcedInduction: 'naturally_aspirated',
    exhaustNote: 'high_pitched_scream',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/audi-r8.mp3',
    audioClipDurationSeconds: 24,
  },
  // Ford Mustang GT - V8 NA
  {
    make: 'Ford',
    model: 'Mustang GT',
    engineConfiguration: 'v-type',
    cylinderCount: 8,
    forcedInduction: 'naturally_aspirated',
    exhaustNote: 'deep_rumble',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/ford-mustang-gt.mp3',
    audioClipDurationSeconds: 18,
  },
  // Nissan GT-R - V6 Twin-Turbo
  {
    make: 'Nissan',
    model: 'GT-R',
    engineConfiguration: 'v-type',
    cylinderCount: 6,
    forcedInduction: 'turbocharged',
    exhaustNote: 'aggressive_bark',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/nissan-gtr.mp3',
    audioClipDurationSeconds: 21,
  },
  // Mazda RX-7 - Rotary (twin-rotor)
  {
    make: 'Mazda',
    model: 'RX-7',
    engineConfiguration: 'rotary',
    cylinderCount: 2,
    forcedInduction: 'turbocharged',
    exhaustNote: 'high_pitched_scream',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/mazda-rx7.mp3',
    audioClipDurationSeconds: 19,
  },
  // Subaru WRX STI - Flat-4 Turbo
  {
    make: 'Subaru',
    model: 'WRX STI',
    engineConfiguration: 'flat',
    cylinderCount: 4,
    forcedInduction: 'turbocharged',
    exhaustNote: 'deep_rumble',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/subaru-wrx-sti.mp3',
    audioClipDurationSeconds: 17,
  },
  // Volkswagen Golf R - Inline-4 Turbo
  {
    make: 'Volkswagen',
    model: 'Golf R',
    engineConfiguration: 'inline',
    cylinderCount: 4,
    forcedInduction: 'turbocharged',
    exhaustNote: 'aggressive_bark',
    audioClipUrl: 'https://cdn.car-ads.nl/audio/vw-golf-r.mp3',
    audioClipDurationSeconds: 15,
  },
];
