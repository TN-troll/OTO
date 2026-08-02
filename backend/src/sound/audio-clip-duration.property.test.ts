import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SoundProfileService } from './sound-profile-service.js';
import { MAX_AUDIO_CLIP_DURATION_SECONDS } from '@car-ads/shared';

/**
 * Property 7: Audio Clip Duration Constraint
 *
 * For any Sound_Profile that has an associated audio clip,
 * the clip duration SHALL be at most 30 seconds.
 *
 * Validates: Requirements 3.5
 */

// Mock the database connection module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { queryOne } from '../db/connection.js';

const mockedQueryOne = vi.mocked(queryOne);

describe('Property 7: Audio Clip Duration Constraint', () => {
  let service: SoundProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SoundProfileService();
  });

  it('should return null when audio clip duration exceeds 30 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: MAX_AUDIO_CLIP_DURATION_SECONDS + 1, max: 60 }),
        fc.uuid(),
        fc.webUrl(),
        async (duration, profileId, clipUrl) => {
          mockedQueryOne.mockResolvedValueOnce({
            audio_clip_url: clipUrl,
            audio_clip_duration_seconds: duration,
          });

          const result = await service.getAudioClipUrl(profileId);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return the audio clip URL when duration is within 30 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: MAX_AUDIO_CLIP_DURATION_SECONDS }),
        fc.uuid(),
        fc.webUrl(),
        async (duration, profileId, clipUrl) => {
          mockedQueryOne.mockResolvedValueOnce({
            audio_clip_url: clipUrl,
            audio_clip_duration_seconds: duration,
          });

          const result = await service.getAudioClipUrl(profileId);
          expect(result).toBe(clipUrl);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should enforce the 30-second boundary: duration > 30 → null, duration ≤ 30 → URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 60 }),
        fc.uuid(),
        fc.webUrl(),
        async (durationSeconds, profileId, clipUrl) => {
          mockedQueryOne.mockResolvedValueOnce({
            audio_clip_url: clipUrl,
            audio_clip_duration_seconds: durationSeconds,
          });

          const result = await service.getAudioClipUrl(profileId);

          if (durationSeconds > MAX_AUDIO_CLIP_DURATION_SECONDS) {
            expect(result).toBeNull();
          } else {
            expect(result).toBe(clipUrl);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return the URL when duration is null (unknown duration is allowed)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.webUrl(),
        async (profileId, clipUrl) => {
          mockedQueryOne.mockResolvedValueOnce({
            audio_clip_url: clipUrl,
            audio_clip_duration_seconds: null,
          });

          const result = await service.getAudioClipUrl(profileId);
          expect(result).toBe(clipUrl);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return null when profile has no audio clip URL regardless of duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 60 }),
        fc.uuid(),
        async (durationSeconds, profileId) => {
          mockedQueryOne.mockResolvedValueOnce({
            audio_clip_url: null,
            audio_clip_duration_seconds: durationSeconds,
          });

          const result = await service.getAudioClipUrl(profileId);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
