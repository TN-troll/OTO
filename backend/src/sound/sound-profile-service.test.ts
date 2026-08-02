import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundProfileService, classifyExhaustNote, normalizeEngineLayout, normalizeInduction } from './sound-profile-service.js';

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { queryOne } from '../db/connection.js';
const mockQueryOne = vi.mocked(queryOne);

describe('SoundProfileService', () => {
  let service: SoundProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SoundProfileService();
  });

  describe('getSoundProfile()', () => {
    it('should return a sound profile for a known make and model', async () => {
      mockQueryOne.mockResolvedValue({
        id: 'profile-1',
        engine_configuration: 'v-type',
        cylinder_count: 8,
        forced_induction: 'turbocharged',
        exhaust_note: 'deep_rumble',
        audio_clip_url: 'https://cdn.car-ads.nl/audio/ferrari-488.mp3',
        audio_clip_duration_seconds: 25,
      });

      const result = await service.getSoundProfile('Ferrari', '488');

      expect(result).toEqual({
        id: 'profile-1',
        engineConfiguration: 'v-type',
        cylinderCount: 8,
        forcedInduction: 'turbocharged',
        exhaustNote: 'deep_rumble',
        audioClipUrl: 'https://cdn.car-ads.nl/audio/ferrari-488.mp3',
        audioClipDurationSeconds: 25,
      });
    });

    it('should return null when no profile exists', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await service.getSoundProfile('Unknown', 'Car');
      expect(result).toBeNull();
    });

    it('should perform case-insensitive lookup', async () => {
      mockQueryOne.mockResolvedValue(null);

      await service.getSoundProfile('FERRARI', '488');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(make) = LOWER($1)'),
        expect.arrayContaining(['FERRARI', '488']),
      );
    });

    it('should filter by engine configuration when provided', async () => {
      mockQueryOne.mockResolvedValue(null);

      await service.getSoundProfile('Ferrari', '488', 'v-type');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(engine_configuration) = LOWER($3)'),
        expect.arrayContaining(['Ferrari', '488', 'v-type']),
      );
    });

    it('should trim whitespace from parameters', async () => {
      mockQueryOne.mockResolvedValue(null);

      await service.getSoundProfile('  Ferrari  ', '  488  ');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Ferrari', '488']),
      );
    });
  });

  describe('getAudioClipUrl()', () => {
    it('should return the audio URL when clip is within duration limit', async () => {
      mockQueryOne.mockResolvedValue({
        audio_clip_url: 'https://cdn.car-ads.nl/audio/ferrari-488.mp3',
        audio_clip_duration_seconds: 25,
      });

      const result = await service.getAudioClipUrl('profile-1');
      expect(result).toBe('https://cdn.car-ads.nl/audio/ferrari-488.mp3');
    });

    it('should return the audio URL when duration is exactly 30 seconds', async () => {
      mockQueryOne.mockResolvedValue({
        audio_clip_url: 'https://cdn.car-ads.nl/audio/test.mp3',
        audio_clip_duration_seconds: 30,
      });

      const result = await service.getAudioClipUrl('profile-1');
      expect(result).toBe('https://cdn.car-ads.nl/audio/test.mp3');
    });

    it('should return null when clip exceeds 30 seconds', async () => {
      mockQueryOne.mockResolvedValue({
        audio_clip_url: 'https://cdn.car-ads.nl/audio/long-clip.mp3',
        audio_clip_duration_seconds: 31,
      });

      const result = await service.getAudioClipUrl('profile-1');
      expect(result).toBeNull();
    });

    it('should return null when no profile exists', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await service.getAudioClipUrl('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should return null when profile has no audio clip', async () => {
      mockQueryOne.mockResolvedValue({
        audio_clip_url: null,
        audio_clip_duration_seconds: null,
      });

      const result = await service.getAudioClipUrl('profile-1');
      expect(result).toBeNull();
    });

    it('should return the URL when duration is null (unknown but clip exists)', async () => {
      mockQueryOne.mockResolvedValue({
        audio_clip_url: 'https://cdn.car-ads.nl/audio/test.mp3',
        audio_clip_duration_seconds: null,
      });

      const result = await service.getAudioClipUrl('profile-1');
      expect(result).toBe('https://cdn.car-ads.nl/audio/test.mp3');
    });
  });

  describe('classifySound()', () => {
    it('should classify V12 naturally aspirated as high_pitched_scream', () => {
      const result = service.classifySound('Ferrari', '812', 12, 'v-type', 'naturally_aspirated');

      expect(result.engineConfiguration).toBe('v-type');
      expect(result.cylinderCount).toBe(12);
      expect(result.forcedInduction).toBe('naturally_aspirated');
      expect(result.exhaustNote).toBe('high_pitched_scream');
    });

    it('should classify V10 naturally aspirated as high_pitched_scream', () => {
      const result = service.classifySound('Lamborghini', 'Huracán', 10, 'v-type', 'naturally_aspirated');
      expect(result.exhaustNote).toBe('high_pitched_scream');
    });

    it('should classify V8 naturally aspirated as deep_rumble', () => {
      const result = service.classifySound('Ford', 'Mustang GT', 8, 'v-type', 'naturally_aspirated');
      expect(result.exhaustNote).toBe('deep_rumble');
    });

    it('should classify flat/boxer engines as deep_rumble', () => {
      const result = service.classifySound('Porsche', '911', 6, 'flat', 'naturally_aspirated');
      expect(result.exhaustNote).toBe('deep_rumble');
    });

    it('should classify inline-4 turbo as aggressive_bark', () => {
      const result = service.classifySound('VW', 'Golf R', 4, 'inline', 'turbocharged');
      expect(result.exhaustNote).toBe('aggressive_bark');
    });

    it('should classify V6 turbo as aggressive_bark', () => {
      const result = service.classifySound('Nissan', 'GT-R', 6, 'v-type', 'turbocharged');
      expect(result.exhaustNote).toBe('aggressive_bark');
    });

    it('should classify rotary as high_pitched_scream', () => {
      const result = service.classifySound('Mazda', 'RX-7', 2, 'rotary', 'turbocharged');
      expect(result.exhaustNote).toBe('high_pitched_scream');
    });

    it('should classify small inline-4 naturally aspirated as smooth_purr', () => {
      const result = service.classifySound('Toyota', 'Corolla', 4, 'inline', 'naturally_aspirated');
      expect(result.exhaustNote).toBe('smooth_purr');
    });

    it('should classify inline-6 naturally aspirated as smooth_purr', () => {
      const result = service.classifySound('BMW', '330i', 6, 'inline', 'naturally_aspirated');
      expect(result.exhaustNote).toBe('smooth_purr');
    });

    it('should return smooth_purr for unrecognized configurations', () => {
      const result = service.classifySound('Unknown', 'Car', 3, 'inline', 'naturally_aspirated');
      expect(result.exhaustNote).toBe('smooth_purr');
    });

    it('should return empty id and null audio fields', () => {
      const result = service.classifySound('Ferrari', '488', 8, 'v-type', 'turbocharged');
      expect(result.id).toBe('');
      expect(result.audioClipUrl).toBeNull();
      expect(result.audioClipDurationSeconds).toBeNull();
    });

    it('should classify V8 turbo as deep_rumble', () => {
      const result = service.classifySound('Mercedes', 'AMG GT', 8, 'v-type', 'turbocharged');
      expect(result.exhaustNote).toBe('deep_rumble');
    });

    it('should classify inline-6 turbo as aggressive_bark', () => {
      const result = service.classifySound('BMW', 'M3', 6, 'inline', 'turbocharged');
      expect(result.exhaustNote).toBe('aggressive_bark');
    });
  });
});

describe('normalizeEngineLayout()', () => {
  it('should normalize "v-type" to v-type', () => {
    expect(normalizeEngineLayout('v-type')).toBe('v-type');
  });

  it('should normalize "V" to v-type', () => {
    expect(normalizeEngineLayout('V')).toBe('v-type');
  });

  it('should normalize "v-" prefix to v-type', () => {
    expect(normalizeEngineLayout('v-8')).toBe('v-type');
  });

  it('should normalize "inline" to inline', () => {
    expect(normalizeEngineLayout('inline')).toBe('inline');
  });

  it('should normalize "straight" to inline', () => {
    expect(normalizeEngineLayout('straight')).toBe('inline');
  });

  it('should normalize "flat" to flat', () => {
    expect(normalizeEngineLayout('flat')).toBe('flat');
  });

  it('should normalize "boxer" to flat', () => {
    expect(normalizeEngineLayout('boxer')).toBe('flat');
  });

  it('should normalize "rotary" to rotary', () => {
    expect(normalizeEngineLayout('rotary')).toBe('rotary');
  });

  it('should normalize "wankel" to rotary', () => {
    expect(normalizeEngineLayout('wankel')).toBe('rotary');
  });

  it('should default unrecognized to inline', () => {
    expect(normalizeEngineLayout('unknown')).toBe('inline');
  });

  it('should handle case insensitivity', () => {
    expect(normalizeEngineLayout('FLAT')).toBe('flat');
    expect(normalizeEngineLayout('Rotary')).toBe('rotary');
    expect(normalizeEngineLayout('V-Type')).toBe('v-type');
  });

  it('should trim whitespace', () => {
    expect(normalizeEngineLayout('  inline  ')).toBe('inline');
  });
});

describe('normalizeInduction()', () => {
  it('should normalize "naturally_aspirated" correctly', () => {
    expect(normalizeInduction('naturally_aspirated')).toBe('naturally_aspirated');
  });

  it('should normalize "na" to naturally_aspirated', () => {
    expect(normalizeInduction('na')).toBe('naturally_aspirated');
  });

  it('should normalize "natural" to naturally_aspirated', () => {
    expect(normalizeInduction('natural')).toBe('naturally_aspirated');
  });

  it('should normalize "turbocharged" correctly', () => {
    expect(normalizeInduction('turbocharged')).toBe('turbocharged');
  });

  it('should normalize "turbo" to turbocharged', () => {
    expect(normalizeInduction('turbo')).toBe('turbocharged');
  });

  it('should normalize "supercharged" correctly', () => {
    expect(normalizeInduction('supercharged')).toBe('supercharged');
  });

  it('should normalize "sc" to supercharged', () => {
    expect(normalizeInduction('sc')).toBe('supercharged');
  });

  it('should default unrecognized to naturally_aspirated', () => {
    expect(normalizeInduction('unknown')).toBe('naturally_aspirated');
  });

  it('should handle case insensitivity', () => {
    expect(normalizeInduction('TURBO')).toBe('turbocharged');
    expect(normalizeInduction('Supercharged')).toBe('supercharged');
  });

  it('should trim whitespace', () => {
    expect(normalizeInduction('  turbo  ')).toBe('turbocharged');
  });
});

describe('classifyExhaustNote()', () => {
  it('should return high_pitched_scream for rotary regardless of induction', () => {
    expect(classifyExhaustNote(2, 'rotary', 'naturally_aspirated')).toBe('high_pitched_scream');
    expect(classifyExhaustNote(2, 'rotary', 'turbocharged')).toBe('high_pitched_scream');
  });

  it('should return deep_rumble for flat engines regardless of other params', () => {
    expect(classifyExhaustNote(4, 'flat', 'turbocharged')).toBe('deep_rumble');
    expect(classifyExhaustNote(6, 'flat', 'naturally_aspirated')).toBe('deep_rumble');
  });

  it('should return high_pitched_scream for large V NA (10+ cylinders)', () => {
    expect(classifyExhaustNote(10, 'v-type', 'naturally_aspirated')).toBe('high_pitched_scream');
    expect(classifyExhaustNote(12, 'v-type', 'naturally_aspirated')).toBe('high_pitched_scream');
    expect(classifyExhaustNote(16, 'v-type', 'naturally_aspirated')).toBe('high_pitched_scream');
  });

  it('should return deep_rumble for V8 NA', () => {
    expect(classifyExhaustNote(8, 'v-type', 'naturally_aspirated')).toBe('deep_rumble');
  });

  it('should return aggressive_bark for V6 turbo', () => {
    expect(classifyExhaustNote(6, 'v-type', 'turbocharged')).toBe('aggressive_bark');
    expect(classifyExhaustNote(6, 'v-type', 'supercharged')).toBe('aggressive_bark');
  });

  it('should return deep_rumble for V8 turbo', () => {
    expect(classifyExhaustNote(8, 'v-type', 'turbocharged')).toBe('deep_rumble');
  });

  it('should return aggressive_bark for inline-4 turbo', () => {
    expect(classifyExhaustNote(4, 'inline', 'turbocharged')).toBe('aggressive_bark');
  });

  it('should return smooth_purr for inline-4 NA', () => {
    expect(classifyExhaustNote(4, 'inline', 'naturally_aspirated')).toBe('smooth_purr');
  });

  it('should return smooth_purr for inline-6 NA', () => {
    expect(classifyExhaustNote(6, 'inline', 'naturally_aspirated')).toBe('smooth_purr');
  });

  it('should return aggressive_bark for inline-6 turbo', () => {
    expect(classifyExhaustNote(6, 'inline', 'turbocharged')).toBe('aggressive_bark');
  });
});
