import { Router, Request, Response } from 'express';
import { SoundProfileService } from '../sound/sound-profile-service.js';
import { getEngineProfile } from '../sound/engine-data.js';
import { query, queryOne } from '../db/connection.js';

export const soundProfilesRouter = Router();

const soundProfileService = new SoundProfileService();

/**
 * GET /api/sound-profiles/assign
 *
 * Assigns sound profiles to listings that don't have one yet,
 * based on the engine-data lookup table. Creates sound_profiles records as needed.
 */
soundProfilesRouter.get('/assign', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get listings without a sound profile
    const unassigned = await query<{ id: string; make: string; model: string }>(
      `SELECT id, make, model FROM listings WHERE sound_profile_id IS NULL LIMIT 100`
    );

    let assigned = 0;
    let created = 0;

    for (const listing of unassigned.rows) {
      const profile = getEngineProfile(listing.make, listing.model);
      if (!profile) continue;

      // Check if this sound profile already exists in the DB
      let spId: string | null = null;
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM sound_profiles
         WHERE make = $1 AND model = $2
           AND engine_configuration = $3
           AND cylinder_count = $4
           AND forced_induction = $5
         LIMIT 1`,
        [listing.make, listing.model, profile.engineConfiguration, profile.cylinderCount, profile.forcedInduction]
      );

      if (existing) {
        spId = existing.id;
      } else {
        // Create new sound profile
        const result = await queryOne<{ id: string }>(
          `INSERT INTO sound_profiles (engine_configuration, cylinder_count, forced_induction, exhaust_note, make, model)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [profile.engineConfiguration, profile.cylinderCount, profile.forcedInduction, profile.exhaustNote, listing.make, listing.model]
        );
        if (result) {
          spId = result.id;
          created++;
        }
      }

      if (spId) {
        await query(
          `UPDATE listings SET sound_profile_id = $1 WHERE id = $2`,
          [spId, listing.id]
        );
        assigned++;
      }
    }

    res.json({
      success: true,
      checked: unassigned.rows.length,
      assigned,
      profilesCreated: created,
    });
  } catch (err) {
    console.error('[OTO] Sound profile assignment error:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/sound-profiles/fix
 * Re-evaluates and updates existing sound profiles based on the latest engine data.
 */
soundProfilesRouter.get('/fix', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get all sound profiles
    const profiles = await query<{ id: string; make: string; model: string }>(
      `SELECT id, make, model FROM sound_profiles`
    );

    let updated = 0;
    for (const sp of profiles.rows) {
      const correctProfile = getEngineProfile(sp.make, sp.model);
      if (!correctProfile) continue;

      await query(
        `UPDATE sound_profiles SET engine_configuration = $1, cylinder_count = $2, forced_induction = $3, exhaust_note = $4 WHERE id = $5`,
        [correctProfile.engineConfiguration, correctProfile.cylinderCount, correctProfile.forcedInduction, correctProfile.exhaustNote, sp.id]
      );
      updated++;
    }

    res.json({ success: true, checked: profiles.rows.length, updated });
  } catch (err) {
    console.error('[OTO] Sound profile fix error:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/sound-profiles/:id/audio
 *
 * Serve or redirect to the audio clip URL for a given sound profile.
 * Returns a 302 redirect to the audio file, or 404 if not available.
 */
soundProfilesRouter.get('/:id/audio', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const audioUrl = await soundProfileService.getAudioClipUrl(id);

    if (!audioUrl) {
      res.status(404).json({ error: 'Audio clip not available for this sound profile' });
      return;
    }

    res.redirect(302, audioUrl);
  } catch (err) {
    console.error('Error fetching audio clip URL:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
